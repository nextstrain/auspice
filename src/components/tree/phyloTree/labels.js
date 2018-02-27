import { timerFlush } from "d3-timer";

export const updateTipLabels = function updateTipLabels(dt) {
  console.log("updateTipLabels called")
  this.svg.selectAll('.tipLabel').remove();
  const tLFunc = this.callbacks.tipLabel;
  const xPad = this.params.tipLabelPadX;
  const yPad = this.params.tipLabelPadY;
  const inViewTerminalNodes = this.nodes
    .filter((d) => d.terminal)
    .filter((d) => d.inView);
  // console.log(`there are ${inViewTerminalNodes.length} nodes in view`)
  if (inViewTerminalNodes.length < 50) {
    // console.log("DRAWING!", inViewTerminalNodes)
    window.setTimeout(() => {
      this.tipLabels = this.svg.append("g").selectAll('.tipLabel')
        .data(inViewTerminalNodes)
        .enter()
        .append("text")
        .attr("x", (d) => d.xTip + xPad)
        .attr("y", (d) => d.yTip + yPad)
        .text((d) => tLFunc(d))
        .attr("class", "tipLabel")
        .style('visibility', 'visible');
    }, dt);
  }
};

/** branchLabelSize
 * @param {str} key e.g. "aa" or "clade"
 * @param  {int} nTips total number of nodes in current view (visible or invisible)
 * @return {str} font size of the branch label, e.g. "12px"
 */
const branchLabelSize = (key, nTips) => {
  let size;
  size = nTips > 1000 ? 14 :
    nTips > 500 ? 16 :
      20;
  if (key === "aa") size -= 4;
  return `${size}px`;
};

/** createBranchLabelVisibility (the return value should be passed to d3 style call)
 * @param {str} key e.g. "aa" or "clade"
 * @param {str} layout
 * @param {int} totalTipsInView visible tips also in view
 * @return {func||str}
 */
const createBranchLabelVisibility = (key, layout, totalTipsInView) => {
  if (key === "clade") return "visible";
  const magicTipFractionToShowBranchLabel = 0.05;
  return (d) => {
    /* if the number of _visible_ tips descending from this node are over the
    magicTipFractionToShowBranchLabel (c/w the total numer of _visible_ and
    _inView_ tips then display the label */
    if (
      d.n.tipCount > magicTipFractionToShowBranchLabel * totalTipsInView &&
      layout === "rect"
    ) {
      return "visible";
    }
    return "hidden";
  };
};

export const updateBranchLabels = function updateBranchLabels(dt) {
  const visibility = createBranchLabelVisibility(this.params.branchLabelKey, this.layout, this.zoomNode.n.tipCount);
  const labelSize = branchLabelSize(this.params.branchLabelKey, this.zoomNode.n.fullTipCount);
  this.svg.selectAll('.branchLabel')
    .transition().duration(dt)
    .attr("x", (d) => d.xTip - 5)
    .attr("y", (d) => d.yTip - this.params.branchLabelPadY)
    .style("visibility", visibility)
    .style("font-size", labelSize);
  if (!dt) timerFlush();
};

export const drawBranchLabels = function drawBranchLabels(key) {
  /* salient props: this.zoomNode.n.tipCount, this.zoomNode.n.fullTipCount */
  this.params.branchLabelKey = key;
  const labelSize = branchLabelSize(key, this.zoomNode.n.fullTipCount);
  const visibility = createBranchLabelVisibility(key, this.layout, this.zoomNode.n.tipCount);
  this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes.filter((d) => d.n.attr.labels && d.n.attr.labels[key]))
    .enter()
    .append("text")
    .attr("class", "branchLabel")
    .attr("x", (d) => d.xTip - 5)
    .attr("y", (d) => d.yTip - this.params.branchLabelPadY)
    .style("text-anchor", "end")
    .style("visibility", visibility)
    .style("fill", this.params.branchLabelFill)
    .style("font-family", this.params.branchLabelFont)
    .style("font-size", labelSize)
    .text((d) => d.n.attr.labels[key]);
};
