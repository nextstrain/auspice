/* eslint-disable */

export const removeConfidence = function removeConfidence(dt) {
  if (dt) {
    this.svg.selectAll(".conf")
      .transition()
      .duration(dt)
      .style("opacity", 0)
    .remove();
  } else {
    this.svg.selectAll(".conf").remove();
  }
  // this.props.confidence = false;
};

export const drawConfidence = function drawConfidence(dt) {
  // this.removeConfidence(); // just in case
  // console.log("drawing:", this.svg.selectAll(".conf"))
  if (dt) {
    this.confidence = this.svg.append("g").selectAll(".conf")
      .data(this.nodes)
      .enter()
        .call((sel) => this.drawSingleCI(sel, 0));
    this.svg.selectAll(".conf")
        .transition()
          .duration(dt)
          .style("opacity", 0.5);
  } else {
    this.confidence = this.svg.append("g").selectAll(".conf")
      .data(this.nodes)
      .enter()
        .call((sel) => this.drawSingleCI(sel, 0.5));
  }
  // this.props.confidence = true;
};

const confidenceWidth = (el) =>
  el["stroke-width"] === 1 ? 0 :
    el["stroke-width"] > 6 ? el["stroke-width"] + 6 : el["stroke-width"] * 2;

export const drawSingleCI = function drawSingleCI(selection, opacity) {
  selection.append("path")
    .attr("class", "conf")
    .attr("id", (d) => "conf_" + d.n.clade)
    .attr("d", (d) => d.confLine)
    .style("stroke", (d) => d.stroke || "#888")
    .style("opacity", opacity)
    .style("fill", "none")
    .style("stroke-width", confidenceWidth);
};


export const updateConfidence = function updateConfidence(dt) {
  if (dt) {
    this.svg.selectAll(".conf")
      .transition()
        .duration(dt)
      .style("stroke", (el) => el.stroke)
      .style("stroke-width", confidenceWidth);
  } else {
    this.svg.selectAll(".conf")
      .style("stroke", (el) => el.stroke)
      .style("stroke-width", confidenceWidth);
  }
};
