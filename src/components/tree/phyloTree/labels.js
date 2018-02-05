/**
 * hide branchLabels
 */
export const hideBranchLabels = function hideBranchLabels() {
  this.params.showBranchLabels = false;
  this.svg.selectAll(".branchLabel").style('visibility', 'hidden');
};

/**
 * show branchLabels
 */
export const showBranchLabels = function showBranchLabels() {
  this.params.showBranchLabels = true;
  this.svg.selectAll(".branchLabel").style('visibility', 'visible');
};

/**
 * hide tipLabels - this function is never called!
 */
// PhyloTree.prototype.hideTipLabels = function() {
//   this.params.showTipLabels=false;
//   this.svg.selectAll(".tipLabel").style('visibility', 'hidden');
// };

/**
 * show tipLabels - this function is never called!
 */
// PhyloTree.prototype.showTipLabels = function() {
//   this.params.showTipLabels=true;
//   this.svg.selectAll(".tipLabel").style('visibility', 'visible');
// };

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

export const updateBranchLabels = function updateBranchLabels(dt) {
  const xPad = this.params.branchLabelPadX, yPad = this.params.branchLabelPadY;
  const nNIV = this.nNodesInView;
  const bLSFunc = this.callbacks.branchLabelSize;
  const showBL = (this.layout === "rect") && this.params.showBranchLabels;
  const visBL = showBL ? "visible" : "hidden";
  this.svg.selectAll('.branchLabel')
    .transition().duration(dt)
    .attr("x", (d) => d.xTip - xPad)
    .attr("y", (d) => d.yTip - yPad)
    .attr("visibility", visBL)
    .style("fill", this.params.branchLabelFill)
    .style("font-family", this.params.branchLabelFont)
    .style("font-size", (d) => bLSFunc(d, nNIV).toString() + "px");
};

export const drawCladeLabels = function drawCladeLabels() {
  this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes.filter((d) => typeof d.n.attr.clade_name !== 'undefined'))
    .enter()
    .append("text")
    .style("visibility", "visible")
    .text((d) => d.n.attr.clade_name)
    .attr("class", "branchLabel")
    .style("text-anchor", "end");
};

// PhyloTree.prototype.drawTipLabels = function() {
//   var params = this.params;
//   const tLFunc = this.callbacks.tipLabel;
//   const inViewTerminalNodes = this.nodes
//                   .filter(function(d){return d.terminal;})
//                   .filter(function(d){return d.inView;});
//   console.log(`there are ${inViewTerminalNodes.length} nodes in view`)
//   this.tipLabels = this.svg.append("g").selectAll('.tipLabel')
//     .data(inViewTerminalNodes)
//     .enter()
//     .append("text")
//     .text(function (d){return tLFunc(d);})
//     .attr("class", "tipLabel");
// }


// PhyloTree.prototype.drawBranchLabels = function() {
//   var params = this.params;
//   const bLFunc = this.callbacks.branchLabel;
//   this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
//     .data(this.nodes) //.filter(function (d){return bLFunc(d)!=="";}))
//     .enter()
//     .append("text")
//     .text(function (d){return bLFunc(d);})
//     .attr("class", "branchLabel")
//     .style("text-anchor","end");
// }
