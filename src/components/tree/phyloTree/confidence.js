import { getDomId } from "./helpers";

export const removeConfidence = function removeConfidence(dt) {
  this.confidencesInSVG = false;
  if (!("confidenceIntervals" in this.groups)) return;

  if (dt) {
    this.groups.confidenceIntervals
      .selectAll("*")
      .transition().duration(dt)
        .style("opacity", 0)
        .remove();
  } else {
    this.groups.confidenceIntervals.selectAll("*").remove();
  }
};

export const drawConfidence = function drawConfidence(dt) {
  this.confidencesInSVG = true;
  if (!("confidenceIntervals" in this.groups)) {
    this.groups.confidenceIntervals = this.svg.append("g").attr("id", "confidenceIntervals");
  }
  if (dt) {
    this.groups.confidenceIntervals
      .selectAll(".conf")
      .data(this.nodes)
      .enter()
      .call((sel) => this.drawSingleCI(sel, 0));
    this.groups.confidenceIntervals
      .transition().duration(dt)
        .style("opacity", 0.5);
  } else {
    this.groups.confidenceIntervals
      .selectAll(".conf")
      .data(this.nodes)
      .enter()
        .call((sel) => this.drawSingleCI(sel, 0.5));
  }
};

export const calcConfidenceWidth = (el) =>
  el["stroke-width"] === 1 ? 0 :
    el["stroke-width"] > 6 ? el["stroke-width"] + 6 :
      el["stroke-width"] * 2;

export const drawSingleCI = function drawSingleCI(selection, opacity) {
  selection.append("path")
    .attr("class", "conf")
    .attr("id", (d) => getDomId("conf", d.n.name))
    .attr("d", (d) => d.confLine)
    .style("stroke", (d) => d.branchStroke || "#888")
    .style("opacity", opacity)
    .style("fill", "none")
    .style("stroke-width", calcConfidenceWidth)
    .style("pointer-events", "none"); // setting to "none" to prevent CIs from grabbing branch hovers
};
