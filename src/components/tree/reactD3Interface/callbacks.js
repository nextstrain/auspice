import { updateVisibleTipsAndBranchThicknesses} from "../../../actions/tree";
import { NODE_VISIBLE } from "../../../util/globals";
import { getDomId, getParentBeyondPolytomy, getIdxOfInViewRootNode } from "../phyloTree/helpers";
import { branchStrokeForHover, branchStrokeForLeave } from "../phyloTree/renderers";

/* Callbacks used by the tips / branches when hovered / selected */

export const onTipHover = function onTipHover(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  phylotree.svg.select(getDomId("#tip", d.n.name))
    .attr("r", (e) => e["r"] + 4);
  this.setState({
    hovered: {d, type: ".tip"}
  });
};

export const onTipClick = function onTipClick(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  // console.log("tip click", d)
  this.setState({
    hovered: null,
    selectedTip: d
  });
  /* are we clicking from tree1 or tree2? */
  const tipSelected = d.that.params.orientation[0] === 1 ?
    {treeIdx: d.n.arrayIdx} :
    {treeTooIdx: d.n.arrayIdx};
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({tipSelected, cladeSelected: this.props.tree.selectedClade}));
};


export const onBranchHover = function onBranchHover(d) {
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
    hovered: {d, type: ".branch"}
  });
};

/** Given a branch which we are zooming to, is there a branch label set which
 * we should use in the URL? This will allow restoration of zoom state via
 * the URL.
 */
const getBranchLabelForURLQuery = (node, availableBranchLabels) => {
  // Does the branch have labels (excluding AA labels which we don't use for URL queries)
  if (node.branch_attrs && node.branch_attrs.labels !== undefined) {
    const legalBranchLabels = Object.keys(node.branch_attrs.labels).filter((label) => label !== "aa");
    if (legalBranchLabels.length) {
      // sort the possible branch labels by the order of those available on the tree
      legalBranchLabels.sort((a, b) =>
        availableBranchLabels.indexOf(a) - availableBranchLabels.indexOf(b)
      );
      // then use the first!
      const key = legalBranchLabels[0];
      return `${key}:${node.branch_attrs.labels[key]}`;
    }
  }
  return "";
};


export const onBranchClick = function onBranchClick(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  /* We have different behavior if we click on the root of the in-view sub-tree...
  if the target branch is basal (in the current view) then we want to zoom out. Otherwise
  we want to zoom in to the subtree defined by that branch */
  const arrayIdxToZoomTo = (getIdxOfInViewRootNode(d.n) === d.n.arrayIdx) ?
    getParentBeyondPolytomy(d.n, this.props.distanceMeasure).arrayIdx :
    d.n.arrayIdx;
  const root = [undefined, undefined];
  if (d.that.params.orientation[0] === 1) root[0] = arrayIdxToZoomTo;
  else root[1] = arrayIdxToZoomTo;
  const cladeSelected = getBranchLabelForURLQuery(d.that.nodes[arrayIdxToZoomTo].n, this.props.tree.availableBranchLabels);
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root, cladeSelected}));
};

/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function onBranchLeave(d) {
  /* Reset the stroke back to what it was before */
  branchStrokeForLeave(d);

  /* Remove the temporal confidence bar unless it's meant to be displayed */
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    const tree = d.that.params.orientation[0] === 1 ? this.state.tree : this.state.treeToo;
    tree.removeConfidence();
  }
  /* Set hovered state to `null`, which will remove the info box */
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

export const onTipLeave = function onTipLeave(d) {
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  if (!this.state.selectedTip) {
    phylotree.svg.select(getDomId("#tip", d.n.name))
      .attr("r", (dd) => dd["r"]);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

/* clearSelectedTip when clicking to go away */
export const clearSelectedTip = function clearSelectedTip(d) {
  const phylotree = d.that.params.orientation[0] === 1 ?
    this.state.tree :
    this.state.treeToo;
  phylotree.svg.select(getDomId("#tip", d.n.name))
    .attr("r", (dd) => dd["r"]);
  this.setState({selectedTip: null, hovered: null});
  /* restore the tip visibility! */
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses(
    {tipSelected: {clear: true}, cladeSelected: this.props.tree.selectedClade}
  ));
};

/**
 * @param  {node} d tree node object
 * @param  {int} n total number of nodes in current view
 * @return {int} font size of the tip label
 */
export const tipLabelSize = (d, n) => {
  if (n > 70) {
    return 0;
  } else if (n < 20) {
    return 14;
  }
  const fs = 6 + 8 * (70 - n) / (70 - 20);
  return fs;
};
