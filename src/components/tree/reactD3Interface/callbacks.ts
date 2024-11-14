import { updateVisibleTipsAndBranchThicknesses, applyFilter, Root } from "../../../actions/tree";
import { NODE_VISIBLE, strainSymbol } from "../../../util/globals";
import { getDomId, getParentBeyondPolytomy, getIdxOfInViewRootNode } from "../phyloTree/helpers";
import { branchStrokeForHover, branchStrokeForLeave } from "../phyloTree/renderers";
import { PhyloNode } from "../phyloTree/types";
import { SELECT_NODE, DESELECT_NODE } from "../../../actions/types";
import { SelectedNode } from "../../../reducers/controls";
import { TreeComponent } from "../tree";

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

  const root: Root = [undefined, undefined];
  let cladeSelected: string | undefined;
  // Branches with multiple labels will be used in the order specified by this.props.tree.availableBranchLabels
  // (The order of the drop-down on the menu)
  // Can't use AA mut lists as zoom labels currently - URL is bad, but also, means every node has a label, and many conflict...
  let legalBranchLabels: string[] | undefined;
  // Check has some branch labels, and remove 'aa' ones.
  if (d.n.branch_attrs &&
    d.n.branch_attrs.labels !== undefined) {
    legalBranchLabels = Object.keys(d.n.branch_attrs.labels).filter((label) => label !== "aa");
  }
  // If has some, then could be clade label - but sort first
  if (legalBranchLabels && legalBranchLabels.length) {
    const availableBranchLabels = this.props.tree.availableBranchLabels;
    // sort the possible branch labels by the order of those available on the tree
    legalBranchLabels.sort((a, b) =>
      availableBranchLabels.indexOf(a) - availableBranchLabels.indexOf(b)
    );
    // then use the first!
    const key = legalBranchLabels[0];
    cladeSelected = `${key}:${d.n.branch_attrs.labels[key]}`;
  }
  /* Clicking on a branch means we want to zoom into the clade defined by that branch
  _except_ when it's the "in-view" root branch, in which case we want to zoom out */
  const observedMutations = d.that.params.orientation[0] === 1 ? this.props.tree.observedMutations : this.props.treeToo.observedMutations;
  const arrayIdxToZoomTo = (getIdxOfInViewRootNode(d.n) === d.n.arrayIdx) ?
    getParentBeyondPolytomy(d.n, this.props.distanceMeasure, observedMutations).arrayIdx :
    d.n.arrayIdx;
  if (d.that.params.orientation[0] === 1) root[0] = arrayIdxToZoomTo;
  else root[1] = arrayIdxToZoomTo;
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root, cladeSelected}));
};

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
