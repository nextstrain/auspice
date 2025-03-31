import { Selection, select, event as d3event } from "d3-selection";
import { updateVisibleTipsAndBranchThicknesses, applyFilter, Root } from "../../../actions/tree";
import { NODE_VISIBLE, strainSymbol } from "../../../util/globals";
import { getDomId, getParentBeyondPolytomy, getIdxOfInViewRootNode } from "../phyloTree/helpers";
import { branchStrokeForHover, branchStrokeForLeave, LabelDatum, nonHoveredRippleOpacity } from "../phyloTree/renderers";
import { PhyloNode } from "../phyloTree/types";
import { ReduxNode, TreeState} from "../../../reducers/tree/types";
import { SELECT_NODE, DESELECT_NODE } from "../../../actions/types";
import { SelectedNode } from "../../../reducers/controls";
import { TreeComponent } from "../tree";
import { getEmphasizedColor } from "../../../util/colorHelpers";

/* Callbacks used by the tips / branches when hovered / selected */

export const onTipHover = function onTipHover(this: TreeComponent, d: PhyloNode): void {
  if (d.visibility !== NODE_VISIBLE) return;
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  phylotree.svg.select("#"+getDomId("tip", d.n.name))
    .attr("r", (e) => e["r"] + 4);
  this.setState({
    hoveredNode: {node: d, isBranch: false}
  });
};

export const onTipClick = function onTipClick(this: TreeComponent, d: PhyloNode): void {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  /* The order of these two dispatches is important: the reducer handling
  `SELECT_NODE` must have access to the filtering state _prior_ to these filters
  being applied */
  this.props.dispatch({type: SELECT_NODE, name: d.n.name, idx: d.n.arrayIdx, isBranch: false, treeId: d.that.id});
  this.props.dispatch(applyFilter("add", strainSymbol, [d.n.name]));
};


export const onBranchHover = function onBranchHover(this: TreeComponent, d: PhyloNode): void {
  if (d.visibility !== NODE_VISIBLE) return;

  branchStrokeForHover(d);

  /* if temporal confidence bounds are defined for this branch, then display them on hover */
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    const tree = d.that.params.orientation[0] === 1 ? this.state.tree : this.state.treeToo;
    if (!("confidenceIntervals" in tree.groups)) {
      tree.groups.confidenceIntervals = tree.svg.append("g").attr("id", "confidenceIntervals");
    }
    tree.groups.confidenceIntervals
      .selectAll(".conf")
      .data([d])
      .enter()
        .call((sel) => tree.drawSingleCI(sel, 0.5));
  }

  /* Set the hovered state so that an info box can be displayed */
  this.setState({
    hoveredNode: {node: d, isBranch: true}
  });
};

export const onBranchClick = function onBranchClick(this: TreeComponent, d: PhyloNode): void {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;

  /* if a branch was clicked while holding the shift key, we instead display a node-clicked modal */
  /* NOTE: window.event is deprecated, however the version of d3-selection we're using doesn't supply
  the event as an argument */
  if (window.event instanceof PointerEvent && window.event.shiftKey) {
    // no need to dispatch a filter action
    this.props.dispatch({type: SELECT_NODE, name: d.n.name, idx: d.n.arrayIdx, isBranch: true, treeId: d.that.id})
    return;
  }

  const LHSTree = d.that.params.orientation[0] === 1;
  const zoomBackwards = getIdxOfInViewRootNode(d.n) === d.n.arrayIdx;

  /** Handle the case where we are clicking on the in-view root which is also a stream, i.e.
   * we want to zoom back to the parent stream
   */
  if (zoomBackwards && this.props.showStreamTrees) { // Note: streamtrees only (currently) work for single trees
    const parentStreamName = this.props.tree.streams[d.n.streamName].parentStreamName;
    if (parentStreamName) { // if this is false we are zooming back into the "normal" tree, so use the non-stream-tree code path
      const parentStreamIndex = this.props.tree.streams[parentStreamName].startNode
      const parentStreamNode = d.that.nodes[parentStreamIndex].n;``
      return this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
        root: [parentStreamIndex, undefined],
        urlQueryLabel: computeUrlQueryLabel(parentStreamNode, this.props.tree.availableBranchLabels)
      }));
    }
  }

  /* Clicking on a branch means we want to zoom into the clade defined by that branch
  _except_ when it's the "in-view" root branch, in which case we want to zoom out */
  const arrayIdxToZoomTo = zoomBackwards ?
    getParentBeyondPolytomy(d.n, this.props.distanceMeasure, LHSTree ? this.props.tree.observedMutations : this.props.treeToo.observedMutations).arrayIdx :
    d.n.arrayIdx; 
  const root: Root = LHSTree ? [arrayIdxToZoomTo, undefined] : [undefined, arrayIdxToZoomTo];
  /* clade selected (as used in the URL query) is only designed to work for the main tree, not the RHS tree */
  const newZoomNode = zoomBackwards ? d.that.nodes[arrayIdxToZoomTo].n : d.n;
  const urlQueryLabel = LHSTree ? computeUrlQueryLabel(newZoomNode, this.props.tree.availableBranchLabels) : undefined;
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root, urlQueryLabel}));
};

/**
 * Scan the branch labels associated with the node *n* and if an appropriate one
 * exists then we want to set this as the branch label query. Branches with
 * multiple labels will be used in the order specified by *availableBranchLabels*
 * (i.e. the order of the drop-down on the menu)
 */
function computeUrlQueryLabel(
  n: ReduxNode,
  availableBranchLabels: TreeState["availableBranchLabels"]
): string | undefined {
  let urlQueryLabel: string | undefined;
  if (n.branch_attrs && n.branch_attrs.labels !== undefined) {
    const legalBranchLabels: string[] = Object.keys(n.branch_attrs.labels)
      // don't use AA mutations as zoom labels currently (the URL is ugly and there will be too many non-unique labels)
      .filter((label) => label !== "aa")
      // sort the possible branch labels by the order of those available on the tree
      .sort((a, b) => availableBranchLabels.indexOf(a) - availableBranchLabels.indexOf(b));
    if (legalBranchLabels.length) {
      const key = legalBranchLabels[0]; // use the first one (if multiple)
      urlQueryLabel = `${key}:${n.branch_attrs.labels[key]}`;
    }
  }
  return urlQueryLabel;
}


/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function onBranchLeave(this: TreeComponent, d: PhyloNode): void {

  /* Reset the stroke back to what it was before */
  branchStrokeForLeave(d);

  /* Remove the temporal confidence bar unless it's meant to be displayed */
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    const tree = d.that.params.orientation[0] === 1 ? this.state.tree : this.state.treeToo;
    tree.removeConfidence();
  }
  /* Set selectedNode state to an empty object, which will remove the info box */
  this.setState({hoveredNode: null});
};

export const onTipLeave = function onTipLeave(this: TreeComponent, d: PhyloNode): void {
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  if (this.state.hoveredNode) {
    phylotree.svg.select("#"+getDomId("tip", d.n.name))
      .attr("r", (dd) => dd["r"]);
  }
  this.setState({hoveredNode: null});
};

/* clearSelectedNode when clicking to remove the node-selected modal */
export const clearSelectedNode = function clearSelectedNode(this: TreeComponent, selectedNode: SelectedNode): void {
  if (!selectedNode.isBranch) {
    /* perform the filtering action (if necessary) that will restore the
    filtering state of the node prior to the selection */
    if (!selectedNode.existingFilterState) {
      this.props.dispatch(applyFilter("remove", strainSymbol, [selectedNode.name]));
    } else if (selectedNode.existingFilterState==='inactive') {
      this.props.dispatch(applyFilter("inactivate", strainSymbol, [selectedNode.name]));
    }
    /* else the filter was already active, so leave it unchanged */
  }
  this.props.dispatch({type: DESELECT_NODE});
};

export function onStreamHover(this: TreeComponent, node: PhyloNode, categoryIndex: number, paths: SVGPathElement[], isBranch: boolean): void {
  /** For each ripple (SVGPathElement) _not_ hovered, lower the opacity so that we focus attention on the hovered ribbon */
  if (isBranch) {
    select(paths[0]).style("stroke", getEmphasizedColor(node.branchStroke))
  } else {
    paths.forEach((path, i) => {
      if (i===categoryIndex) {
        select(path).attr("fill", getEmphasizedColor(node.n.streamCategories[categoryIndex].color))
      } else {
        select(path).style('opacity', nonHoveredRippleOpacity)
      }
    })
  }

  /* Ensure the label is visible & enlarged */
  const selection = selectStreamLabel(node);
  if (selection.data()?.at(0)?.visibility==='hidden') {
    selection.attr("visibility", "visible")
    selection.attr("font-size", 16)
  }

  this.setState({hoveredNode: {
    node,
    isBranch,
    streamDetails: {x: d3event.layerX, y: d3event.layerY, categoryIndex}
  }});
}

export function onStreamLeave(this: TreeComponent, node: PhyloNode, categoryIndex: number, paths: SVGPathElement[], isBranch): void {
  if (isBranch) {
    /* return branch colour back to normal */
    select(paths[0]).style("stroke", node.branchStroke)
  } else {
    /** ensure each ripple's opacity is reset back to 1  */
    paths.forEach((path, i) => {
      if (i===categoryIndex) {
        select(path).attr("fill", node.n.streamCategories[categoryIndex].color)
      } else {
        select(path).style('opacity', 1)
      }
    })
  }

  /* Ensure the label goes back to its previous state */
  const selection = selectStreamLabel(node);
  if (selection.data()?.at(0)?.visibility==='hidden') {
    selection.attr("visibility", "hidden")
  }

  this.setState({hoveredNode: null});
}


function selectStreamLabel(node: PhyloNode) {
  // When `groups.streamsLabels` is created we haven't bound any data so it's datum type is `unknown`
  // We subsequently bind `LabelDatum` elements, but we can't change the underlying type without an assertion
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return node.that.groups.streamsLabels
    .select(`#${CSS.escape(`label${node.n.streamName}`)}`) as Selection<SVGTextElement, LabelDatum, null, unknown>;
}