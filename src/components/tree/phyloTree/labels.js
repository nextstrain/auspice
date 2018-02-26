import { timerFlush } from "d3-timer";

export const updateTipLabels = function updateTipLabels(dt) {
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
 * @param  {int} n total number of nodes in current view
 * @return {str} font size of the branch label, e.g. "12px"
 */
const branchLabelSize = (n) => `${n > 1000 ? 14 : n > 500 ? 18 : 22}px`;

const shouldBranchLabelBeShownHOF = (layout) => {
  return (d) => {
    console.log("showing ", d.n.strain);
    return layout === "rect" ? "visible" : "hidden";
  }
}

export const updateBranchLabels = function updateBranchLabels(dt) {
  console.log("updateBranchLabels", dt)
  const visibility = this.layout === "rect" ? "visible" : "hidden";
  const labelSize = branchLabelSize(this.nNodesInView);
  this.svg.selectAll('.branchLabel')
    .transition().duration(dt)
    .attr("x", (d) => d.xTip - this.params.branchLabelPadX)
    .attr("y", (d) => d.yTip - this.params.branchLabelPadY)
    .style("visibility", visibility)
    .style("font-size", labelSize);
  if (!dt) timerFlush();
};

export const drawBranchLabels = function drawBranchLabels(key) {
  this.params.branchLabelKey = key;
  const labelSize = branchLabelSize(this.nNodesInView);
  const shouldBranchLabelBeShown = shouldBranchLabelBeShownHOF(this.layout);
  this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes.filter((d) => d.n.attr.labels && d.n.attr.labels[key]))
    .enter()
    .append("text")
    .attr("class", "branchLabel")
    .attr("x", (d) => d.xTip - this.params.branchLabelPadX)
    .attr("y", (d) => d.yTip - this.params.branchLabelPadY)
    .style("visibility", shouldBranchLabelBeShown)
    .style("text-anchor", "end")
    .style("fill", this.params.branchLabelFill)
    .style("font-family", this.params.branchLabelFont)
    .style("font-size", labelSize)
    .text((d) => d.n.attr.labels[key]);
};
