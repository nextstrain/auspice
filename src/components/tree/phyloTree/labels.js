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

/** cladeLabelSize
 * @param  {int} n total number of nodes in current view
 * @return {str} font size of the branch label, e.g. "12px"
 */
const cladeLabelSize = (n) => `${n > 1000 ? 14 : n > 500 ? 18 : 22}px`;


export const updateCladeLabels = function updateCladeLabels(dt) {
  const visibility = this.layout === "rect" ? "visible" : "hidden";
  const labelSize = cladeLabelSize(this.nNodesInView);
  this.svg.selectAll('.cladeLabel')
    .transition().duration(dt)
    .attr("x", (d) => d.xTip - this.params.cladeLabelPadX)
    .attr("y", (d) => d.yTip - this.params.cladeLabelPadY)
    .style("visibility", visibility)
    .style("font-size", labelSize);
  if (!dt) timerFlush();
};

export const drawCladeLabels = function drawCladeLabels(key) {
  this.params.cladeLabelKey = key; /* deprecated */
  const visibility = this.layout === "rect" ? "visible" : "hidden";
  const labelSize = cladeLabelSize(this.nNodesInView);
  this.svg.append("g").selectAll('.cladeLabel')
    .data(this.nodes.filter((d) => d.n.attr.labels && d.n.attr.labels[key]))
    .enter()
    .append("text")
    .attr("class", "cladeLabel")
    .attr("x", (d) => d.xTip - this.params.cladeLabelPadX)
    .attr("y", (d) => d.yTip - this.params.cladeLabelPadY)
    .style("visibility", visibility)
    .style("text-anchor", "end")
    .style("fill", this.params.cladeLabelFill)
    .style("font-family", this.params.cladeLabelFont)
    .style("font-size", labelSize)
    .text((d) => d.n.attr.labels[key]);
};
