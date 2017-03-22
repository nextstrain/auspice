import _ from "lodash";
import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { zoom } from "d3-zoom";

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
      .attr("x", (d) => this.x(d.start))
      .attr("y", (d) => this.y(this.yMin) + 20 + readingFrameOffset(d.readingFrame))
      .attr("width", (d) => this.x(d.end) - this.x(d.start))
      .attr("height", geneHeight)
      .style("fill", (d) => d.fill);
};

/* draw the bars (for each base / aa) */
EntropyChart.prototype.drawBars = function (xscale) {
  this.mainGraph.selectAll("*").remove();
  this.mainGraph.selectAll(".bar")
    .data(this.data.aminoAcidEntropyWithoutZeros)
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

/* set scales */
EntropyChart.prototype.setScales = function (chartGeom, xMax, yMax) {
  this.xMax = xMax;
  this.x = scaleLinear()
    .domain([0, xMax])
    .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
  this.yMin = -0.11 * yMax;
  this.y = scaleLinear()
    .domain([-0.11 * yMax, 1.2 * yMax])
    .range([chartGeom.height - chartGeom.padBottom - 50, 0]);
};

/* initial render - set up zooming etc */
EntropyChart.prototype.render = function (chartGeom) {
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
    .scaleExtent([1, 4])
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
      .attr("transform", "translate(0," + this.height + 60 + ")")
      .call(this.xAxis);
  this.mainGraph = this.svg.append("g");
  this.navGraph = this.svg.append("g");

  /* draw some data */
  this.drawBars(this.x);
  this.drawGenes(this.data.annotations);

  this.zoomed = function () {
    /* rescale the x axis (not y) */
    const x = event.transform.rescaleX(this.x);
    this.xAxis = this.xAxis.scale(x);
    this.svg.select(".x.axis").call(this.xAxis);
    this.drawBars(x);
  };

};

export default EntropyChart;
