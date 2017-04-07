import _ from "lodash";
import { lightGrey, medGrey, darkGrey } from "../../globalStyles";
import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { zoom, zoomIdentity } from "d3-zoom";
import { brushX } from "d3-brush";
import Mousetrap from "mousetrap";

/* constructor - sed up data and store params */
const EntropyChart = function (ref, data, callbacks) {
  this.svg = select(ref);
  this.data = data;
  this.callbacks = callbacks;
  this.processAnnotations();
  for (const nt of this.data.entropyNtWithoutZeros) {
    nt.prot = this.intersectGenes(nt.x);
  }
  // console.log(this.data)
};

/* the annotation order in JSON is not necessarily sorted */
EntropyChart.prototype.processAnnotations = function () {
  const m = {};
  this.data.annotations.map((d) => {
    m[d.prot] = d;
  });
  const sorted = Object.keys(m).sort((a, b) =>
    m[a].start < m[b].start ? -1 : m[a].start > m[b].start ? 1 : 0
  );
  for (const gene in m) {
    m[gene].idx = sorted.indexOf(gene);
  }
  this.geneMap = m;
};

EntropyChart.prototype.intersectGenes = function (pos) {
  for (const gene in this.geneMap) {
    if (pos >= this.geneMap[gene].start && pos <= this.geneMap[gene].end) {
      return gene;
    }
  }
  return false;
};

/* convert amino acid X in gene Y to a nucleotide number */
EntropyChart.prototype.aaToNtCoord = function (gene, aaPos) {
  return this.geneMap[gene].start + aaPos * 3;
};

/* draw the genes (annotations) */
EntropyChart.prototype.drawGenes = function (annotations) {
  const geneHeight = 20;
  const readingFrameOffset = (frame) => 5
  const selection = this.navGraph.selectAll(".gene")
    .data(annotations)
    .enter()
    .append("g");
  selection.append("rect")
    .attr("class", "gene")
    .attr("x", (d) => this.scales.xNav(d.start))
    .attr("y", (d) => readingFrameOffset(d.readingFrame))
    .attr("width", (d) => this.scales.xNav(d.end) - this.scales.xNav(d.start))
    .attr("height", geneHeight)
    .style("fill", (d) => d.fill)
    .style("stroke", () => "white");
  selection.append("text")
    .attr("x", (d) =>
      this.scales.xNav(d.start) + (this.scales.xNav(d.end) - this.scales.xNav(d.start)) / 2
    )
    .attr("y", (d) => readingFrameOffset(d.readingFrame) + 5)
    .attr("dy", ".7em")
    .attr("text-anchor", "middle")
    .style("fill", () => "white")
    .text((d) => d.prot);
};

EntropyChart.prototype.drawAA = function (el, w) {
  el.data(this.data.aminoAcidEntropyWithoutZeros)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d) => this.scales.xMain(this.aaToNtCoord(d.prot, d.codon)))
      .attr("y", (d) => this.scales.y(d.y))
      .attr("width", w)
      .attr("height", (d) => this.offsets.heightMain - this.scales.y(d.y))
      .style("fill", (d) => this.geneMap[d.prot].idx % 2 ? medGrey : darkGrey)
      // .style("fill", (d) => d.fill)
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

EntropyChart.prototype.drawNt = function (el, w) {
  el.data(this.data.entropyNtWithoutZeros)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d) => this.scales.xMain(d.x))
      .attr("y", (d) => this.scales.y(d.y))
      .attr("width", w)
      .attr("height", (d) => this.offsets.heightMain - this.scales.y(d.y))
      .style("fill", (d) => {
        if (d.prot) {
          return (this.geneMap[d.prot].idx % 2) ? medGrey : darkGrey;
        }
        return lightGrey;
      })
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
EntropyChart.prototype.drawBars = function () {
  this.mainGraph.selectAll("*").remove();
  let posInView = this.scales.xMain.domain()[1] - this.scales.xMain.domain()[0];
  if (this.aa) {
    posInView /= 3;
  }
  const barWidth = posInView > 10000 ? 1 : posInView > 1000 ? 2 : posInView > 100 ? 3 : 5;
  const chart = this.mainGraph.append("g")
    .attr("clip-path", "url(#clip)")
    .selectAll(".bar");
  if (this.aa) {
    this.drawAA(chart, barWidth);
  } else {
    this.drawNt(chart, barWidth);
  }
};

EntropyChart.prototype.toggle = function (aa) {
  this.aa = aa;
  this.drawBars();
};

/* set scales - normally use this.scales.y, this.scales.xMain, this.scales.xNav */
EntropyChart.prototype.setScales = function (chartGeom, xMax, yMax) {
  this.scales = {};
  this.scales.xMax = xMax;
  this.scales.yMax = yMax;
  this.scales.yMin = -0.11 * yMax;
  this.scales.xMin = 0;
  this.scales.xMainOriginal = scaleLinear()
    .domain([0, xMax])
    // .range([0, this.offsets.width])
    .range([this.offsets.x1, this.offsets.x2]);
  this.scales.xMain = this.scales.xMainOriginal;
  this.scales.xNav = scaleLinear()
    .domain([0, xMax])
    .range([this.offsets.x1, this.offsets.x2]);
  this.scales.y = scaleLinear()
    .domain([-0.11 * yMax, 1.2 * yMax])
    .range([this.offsets.y2Main, this.offsets.y1Main]);
};

/* calculate the offsets */
EntropyChart.prototype.calcOffsets = function (chartGeom) {
  this.offsets = {
    x1: chartGeom.padLeft,
    x2: chartGeom.width - chartGeom.padRight,
    y1Main: 0, /* remember y1 is the top, y2 is the bottom, measured going down */
    y1Nav: chartGeom.height - chartGeom.padBottom - 30,
    y2Main: chartGeom.height - chartGeom.padBottom - 50,
    y2Nav: chartGeom.height - chartGeom.padBottom
  };
  this.offsets.heightMain = this.offsets.y2Main - this.offsets.y1Main;
  this.offsets.heightNav = this.offsets.y2Nav - this.offsets.y1Nav;
  this.offsets.width = this.offsets.x2 - this.offsets.x1;
};

/* initial render - set up zooming etc */
EntropyChart.prototype.render = function (chartGeom, aa) {
  this.aa = aa; /* bool */
  this.calcOffsets(chartGeom);
  this.setScales(
    chartGeom,
    this.data.entropyNt.length,
    Math.max(
      _.maxBy(this.data.entropyNtWithoutZeros, "y").y,
      _.maxBy(this.data.aminoAcidEntropyWithoutZeros, "y").y
    )
  );

  /* tear things down */
  this.svg.selectAll("*").remove();

  // set up a zoom overlay (else clicking on whitespace won't zoom)
  const zoomExtents = [
    [this.offsets.x1, this.offsets.y1],
    [this.offsets.width, this.offsets.y2Main]
  ];
  this.zoom = zoom()
    .scaleExtent([1, 8])
    .translateExtent(zoomExtents)
    .extent(zoomExtents)
    .on("zoom", () => this.zoomed());

  /* the overlay should be dependent on whether you have certain keys pressed */
  const zoomKeys = ["option"];
  Mousetrap.bind(zoomKeys, () => {
    this.svg.append("rect")
      .attr("class", "overlay")
      .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")")
      .attr("width", this.offsets.width)
      .attr("height", this.offsets.heightMain)
      .call(this.zoom)
      .on("wheel", () => { event.preventDefault(); });
  }, "keydown");
  Mousetrap.bind(zoomKeys, () => {
    this.svg.selectAll(".overlay").remove();
  }, "keyup");

  /* construct axes */
  this.axes = {};
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  this.axes.xMain = axisBottom(this.scales.xMain).ticks(20);
  this.axes.xNav = axisBottom(this.scales.xNav).ticks(20);

  /* draw axes */
  this.svg.append("g")
      .attr("class", "y axis")
      .attr("id", "entropyYAxis")
      /* no idea why the 15 is needed here */
      .attr("transform", "translate(" + (this.offsets.x1 + 15) + "," + this.offsets.y1Main + ")")
      .call(this.axes.y);
  this.svg.append("g")
      .attr("class", "xMain axis")
      .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y2Main + ")")
      .call(this.axes.xMain);
  this.svg.append("g")
      .attr("class", "xNav axis")
      .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y2Nav + ")")
      .call(this.axes.xNav);

  /* draw main graphs */
  this.mainGraph = this.svg.append("g")
    .attr("class", "main")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")");

  /* https://bl.ocks.org/mbostock/4015254 */
  // this.mainGraph.append("clipPath")
  //     .attr("id", "clip")
  //   .append("rect")
  //     .attr("width", this.offsets.width)
  //     .attr("height", this.offsets.heightMain)

  /* http://jsfiddle.net/dsummersl/EqLBJ/1/ */
  this.clip = this.mainGraph.append("defs")
    .append("svg:clipPath")
      .attr("id", "clip")
    .append("svg:rect")
      .attr("id", "clip-rect")
      .attr("x", "0")
      .attr("y", "0")
      .attr("width", this.offsets.width)
      .attr("height", this.offsets.heightMain);

  this.navGraph = this.svg.append("g")
    .attr("class", "nav")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Nav + ")")

  this.brushed = function () {
    const s = event.selection || this.scales.xNav.range();
    this.xModified = this.scales.xMain.domain(s.map(this.scales.xNav.invert, this.scales.xNav));
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this.drawBars();
  };

  /* draw the genes */
  this.drawGenes(this.data.annotations);

  /* the brush is the shaded area in the nav window */
  this.brush = brushX()
    /* the extent is relative to the navGraph group */
    .extent([[0, 0], [this.offsets.width, this.offsets.heightNav - 1]])
    .on("brush end", () => this.brushed());
  this.navGraph.append("g")
    .attr("class", "brush")
    .call(this.brush)
    .call(this.brush.move, this.scales.xMain.range());

  /* draw the data */
  this.drawBars();

  this.zoomed = function () {
    const t = event.transform;
    /* rescale the x axis (not y) */
    this.xModified = t.rescaleX(this.scales.xMainOriginal);
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this.drawBars();

    /* move the brush */
    this.navGraph.select(".brush")
      .call(this.brush.move, this.scales.xMain.range().map(t.invertX, t));

  };
};

export default EntropyChart;
