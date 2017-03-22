import _ from "lodash";
import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { zoom, zoomIdentity } from "d3-zoom";
import { brushX } from "d3-brush";

/* constructor - sed up data and store params */
const EntropyChart = function (ref, data, callbacks) {
  this.svg = select(ref);
  this.data = data;
  this.callbacks = callbacks;
  this.geneMap = {};
  data.annotations.map((d, idx) => {
    this.geneMap[d.prot] = d;
    this.geneMap[d.prot].idx = idx;
  });
  console.log(this.data)
};

/* convert amino acid X in gene Y to a nucleotide number */
EntropyChart.prototype.aaToNtCoord = function (gene, aaPos) {
  return this.geneMap[gene].start + aaPos * 3;
};

/* draw the genes (annotations) */
EntropyChart.prototype.drawGenes = function (annotations) {
  const geneHeight = 16;
  const readingFrameOffset = (frame) => (frame - 1) * geneHeight;
  this.navGraph.selectAll(".gene")
    .data(annotations)
    .enter().append("rect")
      .attr("class", "gene")
      .attr("x", (d) => this.x2(d.start))
      .attr("y", (d) => 20 + readingFrameOffset(d.readingFrame))
      .attr("width", (d) => this.x2(d.end) - this.x2(d.start))
      .attr("height", geneHeight)
      .style("fill", (d) => d.fill);
};

EntropyChart.prototype.drawAA = function (el, xscale) {
  el.data(this.data.aminoAcidEntropyWithoutZeros)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xscale(this.aaToNtCoord(d.prot, d.codon)))
      .attr("y", (d) => this.y(d.y))
      .attr("width", 3)
      .attr("height", (d) => this.height - this.y(d.y))
      .style("fill", (d) => d.fill)
      .on("mouseover", (d) => {
        this.callbacks.onHover(d, event.pageX, event.pageY);
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })
      .on("click", (d) => {
        this.callbacks.onClick(d);
      })
      .style("cursor", "pointer");
};

EntropyChart.prototype.drawNt = function (el, xscale) {
  el.data(this.data.entropyNtWithoutZeros)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xscale(d.x))
      .attr("y", (d) => this.y(d.y))
      .attr("width", 1)
      .attr("height", (d) => this.height - this.y(d.y))
      .style("fill", (d) => "#DC9BFF")
      .on("mouseover", (d) => {
        this.callbacks.onHover(d, event.pageX, event.pageY);
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })
      .on("click", (d) => {
        this.callbacks.onClick(d);
      })
      .style("cursor", "pointer");
};

/* draw the bars (for each base / aa) */
EntropyChart.prototype.drawBars = function (xscale) {
  this.mainGraph.selectAll("*").remove();
  if (this.aa) {
    this.drawAA(this.mainGraph.selectAll(".bar"), xscale);
  } else {
    this.drawNt(this.mainGraph.selectAll(".bar"), xscale);
  }
};

EntropyChart.prototype.toggle = function (aa) {
  this.aa = aa;
  this.drawBars(this.xModified);
};

/* set scales */
EntropyChart.prototype.setScales = function (chartGeom, xMax, yMax) {
  this.xMax = xMax;
  this.x = scaleLinear()
    .domain([0, xMax])
    .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
  this.xModified = this.x;
  this.x2 = scaleLinear()
    .domain([0, xMax])
    .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
  this.yMin = -0.11 * yMax;
  this.y = scaleLinear()
    .domain([-0.11 * yMax, 1.2 * yMax])
    .range([chartGeom.height - chartGeom.padBottom - 50, 0]);
};

/* initial render - set up zooming etc */
EntropyChart.prototype.render = function (chartGeom, aa) {
  this.aa = aa;
  this.setScales(
    chartGeom,
    this.data.entropyNt.length,
    Math.max(
      _.maxBy(this.data.entropyNtWithoutZeros, "y").y,
      _.maxBy(this.data.aminoAcidEntropyWithoutZeros, "y").y
    )
  );
  this.height = chartGeom.height - chartGeom.padBottom - 50;
  this.width = chartGeom.width;

  /* tear things down */
  this.svg.selectAll("*").remove();

  /* Z O O M I N G    P A R T   1 */
  // set up a zoom overlay (else clicking on whitespace won't zoom)
  this.zoom = zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [this.width, this.height]])
    .extent([[0, 0], [this.width, this.height]])
    .on("zoom", () => this.zoomed());
  this.svg.append("rect")
    .attr("class", "overlay")
    .attr("width", this.width)
    .attr("height", this.height)
    .call(this.zoom)
    .on("wheel", () => { event.preventDefault(); });

  /* draw x & y axis, given the scales this.x and this.y */
  this.yAxis = axisLeft(this.y).ticks(4);
  this.xAxis = axisBottom(this.x).ticks(20);
  this.x2Axis = axisBottom(this.x2).ticks(20);
  this.svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + this.x(0) + ",0)")
      .call(this.yAxis);
  this.svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);
  this.svg.append("g")
      .attr("class", "x2 axis")
      .attr("transform", "translate(0," + (this.height + 60) + ")")
      .call(this.x2Axis);
  this.mainGraph = this.svg.append("g")
    .attr("class", "main");
  this.navGraph = this.svg.append("g")
    .attr("class", "nav")
    .attr("transform", "translate(0," + (this.height + 20) + ")");

  this.brushed = function () {
    const s = event.selection || this.x2.range();
    this.xModified = this.x.domain(s.map(this.x2.invert, this.x2));
    this.xAxis = this.xAxis.scale(this.xModified);
    this.svg.select(".x.axis").call(this.xAxis);
    this.drawBars(this.xModified);

    // this.svg.select(".zoom").call(
    //   this.zoom.transform,
    //   zoomIdentity.scale(this.width / (s[1] - s[0])).translate(-s[0], 0)
    // )

  };

  this.brush = brushX()
    .extent([[0, 0], [this.width, 60]]) // relative to div it's attached to
    .on("brush end", () => this.brushed());

  this.navGraph.append("g")
    .attr("class", "brush")
    .call(this.brush)
    .call(this.brush.move, this.x.range());

  /* draw some data */
  this.drawBars(this.x);
  this.drawGenes(this.data.annotations);

  this.zoomed = function () {
    const t = event.transform;
    /* rescale the x axis (not y) */
    this.xModified = t.rescaleX(this.x);
    this.xAxis = this.xAxis.scale(this.xModified);
    this.svg.select(".x.axis").call(this.xAxis);
    this.drawBars(this.xModified);

    /* move the brush */
    this.navGraph.select(".brush")
      .call(this.brush.move, this.xModified.range().map(t.invertX, t));

  };


};

export default EntropyChart;
