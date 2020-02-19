import { updateVisibleTipsAndBranchThicknesses} from "../../../actions/tree";
import { getEmphasizedColor } from "../../../util/colorHelpers";
import { NODE_VISIBLE } from "../../../util/globals";
import { getDomId } from "../phyloTree/helpers";

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

  /* We want to emphasize the colour of the branch. How we do this depends on how the branch was rendered in the first place! */
  const emphasizedStrokeColor = getEmphasizedColor(d.branchStroke);

  for (const id of [getDomId("#branchS", d.n.name), getDomId("#branchT", d.n.name)]) {
    const el = this.state.tree.svg.select(id);
    if (el.empty()) continue; // Some displays don't have S & T parts of the branch
    const currentStroke = el.style("stroke");
    if (currentStroke.startsWith("url")) {
      const gradientId = `${d.parent.n.arrayIdx}:${d.n.arrayIdx}:highlighted`;
      d.that.makeLinearGradient(gradientId, [[0, getEmphasizedColor(d.parent.branchStroke)], [100, emphasizedStrokeColor]]);
      el.style("stroke", `url(#${gradientId})`);
    } else {
      el.style("stroke", emphasizedStrokeColor);
    }
  }

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

export const onBranchClick = function onBranchClick(d) {
  if (d.visibility !== NODE_VISIBLE) return;
  if (this.props.narrativeMode) return;
  const root = [undefined, undefined];
  let cladeSelected;
  // Branches with multiple labels will be used in the order specified by this.props.tree.availableBranchLabels
  // (The order of the drop-down on the menu)
  // Can't use AA mut lists as zoom labels currently - URL is bad, but also, means every node has a label, and many conflict...
  let legalBranchLabels;
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
  if (d.that.params.orientation[0] === 1) root[0] = d.n.arrayIdx;
  else root[1] = d.n.arrayIdx;
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root, cladeSelected}));
};

/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function onBranchLeave(d) {
  /* Reset the stroke back to what it was before */
  for (const id of [getDomId("#branchT", d.n.name), getDomId("#branchS", d.n.name)]) {
    const el = this.state.tree.svg.select(id);
    if (el.empty()) continue; // Some displays don't have S & T parts of the branch
    const currentStroke = el.style("stroke");
    if (currentStroke.startsWith("url")) {
      el.style("stroke", `url(#${d.parent.n.arrayIdx}:${d.n.arrayIdx})`);
      /* remove the <def> of the highlighed (hovered) state */
      d.that.groups.branchGradientDefs
        .selectAll("linearGradient")
        .filter((_, i, l) => l.length-1 === i)
        .remove();
    } else {
      el.style("stroke", (dd) => dd.branchStroke);
    }
  }
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
