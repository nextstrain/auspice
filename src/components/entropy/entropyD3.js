/* eslint no-underscore-dangle: off */
import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { zoom } from "d3-zoom";
import { brushX } from "d3-brush";
import Mousetrap from "mousetrap";
import { lightGrey, medGrey, darkGrey } from "../../globalStyles";
import { parseEncodedGenotype } from "../../util/getGenotype";

/* EntropChart uses D3 for visualisation. There are 2 methods exposed to
 * keep the visualisation in sync with React:
 * EntropyChart.render & EntropyChartupdate
 */
const EntropyChart = function EntropyChart(ref, annotations, geneMap, maxNt, callbacks) {
  this.svg = select(ref);
  this.annotations = annotations;
  this.geneMap = geneMap;
  this.maxNt = maxNt;
  this.callbacks = callbacks;
  this.okToDrawBars = false; /* useful as the brush setUp causes _drawBars x 2 */
};

/* "PUBLIC" PROTOTYPES */
EntropyChart.prototype.render = function render(props) {
  this.aa = props.mutType === "aa";
  this.bars = props.bars;
  this.selectedNode = props.colorBy.startsWith("gt") ?
    this._getSelectedNode(parseEncodedGenotype(props.colorBy, props.geneLength)) :
    undefined;
  this.svg.selectAll("*").remove(); /* tear things down */
  this._calcOffsets(props.width, props.height);
  this._drawMainNavElements();
  this._addZoomLayers();
  this._setScales(this.maxNt + 1, props.maxYVal);
  this._drawAxes();
  this._addBrush();
  this._addClipMask();
  this._drawGenes(this.annotations);
  this.okToDrawBars = true;
  this._drawBars();
  this.zoomed = this._createZoomFn();
};

EntropyChart.prototype.update = function update({
  aa = undefined, /* undefined is a no-op for each optional argument */
  selected = undefined,
  newBars = undefined,
  maxYVal = undefined,
  clearSelected = false
}) {
  const aaChange = aa !== undefined && aa !== this.aa;
  if (newBars || aaChange) {
    if (aaChange) {this.aa = aa;}
    if (newBars) {this.bars = newBars;}
    this._updateYScaleAndAxis(maxYVal);
    this._drawBars();
  }
  if (selected !== undefined) {
    this.selectedNode = this._getSelectedNode(selected);
    this._clearSelectedBar();
    this._highlightSelectedBar();
  } else if (clearSelected) {
    this.selectedNode = undefined;
    this._clearSelectedBar();
  }
};

/* "PRIVATE" PROTOTYPES */

/* convert amino acid X in gene Y to a nucleotide number */
EntropyChart.prototype._aaToNtCoord = function _aaToNtCoord(gene, aaPos) {
  return this.geneMap[gene].start + aaPos * 3;
};

EntropyChart.prototype._getSelectedNode = function _getSelectedNode(parsed) {
  if (parsed.length > 1 || parsed[0].positions.length > 1) {
    console.warn("multiple genotypes not yet built into entropy. Using first only.");
  }

  if (this.aa !== parsed[0].aa) {
    console.error("entropy out of sync");
    return undefined;
  }
  /* simply looking at the first position TODO */
  if (this.aa) {
    for (const node of this.bars) {
      if (node.prot === parsed[0].prot && node.codon === parsed[0].positions[0]) {
        return node;
      }
    }
  } else {
    for (const node of this.bars) {
      if (node.x === parsed[0].positions[0]) {
        return node;
      }
    }
  }
  /* we fall through to here if the selected genotype (from URL or typed in)
  is not in the entropy data as it has no variation */
  return undefined;
};

/* draw the genes (annotations) */
EntropyChart.prototype._drawGenes = function _drawGenes(annotations) {
  const geneHeight = 20;
  const readingFrameOffset = (frame) => 5; // eslint-disable-line no-unused-vars
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

/* clearSelectedBar works on SVG id tags, not on this.selected */
EntropyChart.prototype._clearSelectedBar = function _clearSelectedBar() {
  if (this.aa) {
    select("#entropySelected")
      .attr("id", (node) => node.prot + node.codon)
      .style("fill", (node) => this.geneMap[node.prot].idx % 2 ? medGrey : darkGrey);
  } else {
    select("#entropySelected")
      .attr("id", (node) => "nt" + node.x)
      .style("fill", (node) => {
        if (node.prot) {
          return (this.geneMap[node.prot].idx % 2) ? medGrey : darkGrey;
        }
        return lightGrey;
      });
  }
};

EntropyChart.prototype._highlightSelectedBar = function _highlightSelectedBar() {
  const d = this.selectedNode;
  if (d === undefined) { return; }
  if (this.aa) {
    select("#" + d.prot + d.codon)
      .attr("id", "entropySelected")
      .style("fill", () => this.geneMap[d.prot].fill);
  } else {
    select("#nt" + d.x)
      .attr("id", "entropySelected")
      .style("fill", () => {
        if (d.prot) {
          return this.geneMap[d.prot].fill;
        }
        return "red";
      });
  }
};

/* draw the bars (for each base / aa) */
EntropyChart.prototype._drawBars = function _drawBars() {
  if (!this.okToDrawBars) {return;}
  this.mainGraph.selectAll("*").remove();
  let posInView = this.scales.xMain.domain()[1] - this.scales.xMain.domain()[0];
  if (this.aa) {
    posInView /= 3;
  }
  const barWidth = posInView > 10000 ? 1 : posInView > 1000 ? 2 : posInView > 100 ? 3 : 5;
  const chart = this.mainGraph.append("g")
    .attr("clip-path", "url(#clip)")
    .selectAll(".bar");
  const idfn = this.aa ? (d) => d.prot + d.codon : (d) => "nt" + d.x;
  const xscale = this.aa ?
    (d) => this.scales.xMain(this._aaToNtCoord(d.prot, d.codon)) :
    (d) => this.scales.xMain(d.x);
  const fillfn = this.aa ?
    (d) => this.geneMap[d.prot].idx % 2 ? medGrey : darkGrey :
    (d) => {
      if (d.prot) {
        return (this.geneMap[d.prot].idx % 2) ? medGrey : darkGrey;
      }
      return lightGrey;
    };
  chart.data(this.bars)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("id", idfn)
    .attr("x", xscale)
    .attr("y", (d) => this.scales.y(d.y))
    .attr("width", barWidth)
    .attr("height", (d) => this.offsets.heightMain - this.scales.y(d.y))
    .style("fill", fillfn)
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
  this._highlightSelectedBar();
};

/* set scales - normally use this.scales.y, this.scales.xMain, this.scales.xNav */
EntropyChart.prototype._setScales = function _setScales(xMax, yMax) {
  this.scales = {};
  this.scales.xMax = xMax;
  this.scales.yMax = yMax;
  this.scales.yMin = 0; // -0.11 * yMax;
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
    .domain([this.scales.yMin, 1.2 * yMax])
    .range([this.offsets.y2Main, this.offsets.y1Main]);
};

EntropyChart.prototype._drawAxes = function _drawAxes() {
  this.axes = {};
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  this.axes.xMain = axisBottom(this.scales.xMain).ticks(20);
  this.axes.xNav = axisBottom(this.scales.xNav).ticks(20);

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
};

EntropyChart.prototype._updateYScaleAndAxis = function _updateYScaleAndAxis(yMax) {
  this.scales.y = scaleLinear()
    .domain([this.scales.yMin, 1.2 * yMax])
    .range([this.offsets.y2Main, this.offsets.y1Main]);
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  this.svg.select("#entropyYAxis").remove();
  this.svg.append("g")
    .attr("class", "y axis")
    .attr("id", "entropyYAxis")
    /* no idea why the 15 is needed here */
    .attr("transform", "translate(" + (this.offsets.x1 + 15) + "," + this.offsets.y1Main + ")")
    .call(this.axes.y);
  /* requires redraw of bars */
};


/* calculate the offsets */
EntropyChart.prototype._calcOffsets = function _calcOffsets(width, height) {
  /* hardcoded padding */
  this.offsets = {
    x1: 15,
    x2: width - 32,
    y1Main: 0, /* remember y1 is the top, y2 is the bottom, measured going down */
    y1Nav: height - 80,
    y2Main: height - 100,
    y2Nav: height - 50
  };
  this.offsets.heightMain = this.offsets.y2Main - this.offsets.y1Main;
  this.offsets.heightNav = this.offsets.y2Nav - this.offsets.y1Nav;
  this.offsets.width = this.offsets.x2 - this.offsets.x1;
};

/* the brush is the shaded area in the nav window */
EntropyChart.prototype._addBrush = function _addBrush() {
  this.brushed = function brushed() {
    /* this block called when the brush is manipulated */
    const s = event.selection || this.scales.xNav.range();
    // console.log("brushed", s.map(this.scales.xNav.invert, this.scales.xNav))
    this.xModified = this.scales.xMain.domain(s.map(this.scales.xNav.invert, this.scales.xNav));
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this._drawBars();
    if (this.brushHandle) {
      this.brushHandle
        .attr("display", null)
        .attr("transform", (d, i) => "translate(" + s[i] + "," + (this.offsets.heightNav + 29) + ")");
    }
  };

  this.brush = brushX()
    /* the extent is relative to the navGraph group - the constants are a bit hacky... */
    .extent([[this.offsets.x1, 0], [this.offsets.width + 20, this.offsets.heightNav - 1 + 30]])
    .on("brush end", () => { // https://github.com/d3/d3-brush#brush_on
      this.brushed()
    })
  this.gBrush = this.navGraph.append("g")
    .attr("class", "brush")
    .attr("stroke-width", 0)
    .call(this.brush)
    .call(this.brush.move, () => {
      return this.scales.xMain.range();
    })

  /* https://bl.ocks.org/mbostock/4349545 */
  this.brushHandle = this.gBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("fill", darkGrey)
    .attr("cursor", "ew-resize")
    .attr("d", "M0,0 0,0 -5,11 5,11 0,0 Z")
    /* see the extent x,y params in brushX() (above) */
    .attr("transform", (d) =>
      d.type === "e" ?
        "translate(" + (this.offsets.x2 - 1) + "," + (this.offsets.heightNav + 29) + ")" :
        "translate(" + (this.offsets.x1 + 1) + "," + (this.offsets.heightNav + 29) + ")"
    );
};

/* set up zoom */
EntropyChart.prototype._addZoomLayers = function _addZoomLayers() {
  // set up a zoom overlay (else clicking on whitespace won't zoom)
  const zoomExtents = [
    [this.offsets.x1, this.offsets.y1Main],
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
      .attr("height", this.offsets.y2Nav + 30 - this.offsets.y1Main)
      .call(this.zoom)
      .on("wheel", () => { event.preventDefault(); });
  }, "keydown");
  Mousetrap.bind(zoomKeys, () => {
    this.svg.selectAll(".overlay").remove();
  }, "keyup");
};

EntropyChart.prototype._createZoomFn = function _createZoomFn() {
  return function zoomed() {
    const t = event.transform;
    /* rescale the x axis (not y) */
    this.xModified = t.rescaleX(this.scales.xMainOriginal);
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this._drawBars();

    /* move the brush */
    this.navGraph.select(".brush")
      .call(this.brush.move, () => {
        return this.scales.xMain.range().map(t.invertX, t);
      });
  };
};

/* prepare graph elements to be drawn in */
EntropyChart.prototype._drawMainNavElements = function _drawMainNavElements() {
  this.mainGraph = this.svg.append("g")
    .attr("class", "main")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")");
  this.navGraph = this.svg.append("g")
    .attr("class", "nav")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Nav + ")");
};

EntropyChart.prototype._addClipMask = function _addClipMask() {
  /* https://bl.ocks.org/mbostock/4015254 */
  this.svg.append("g")
    .append("clipPath")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")")
    .attr("id", "clip")
    .append("rect")
    .attr("id", "cliprect")
    .attr("width", this.offsets.width)
    .attr("height", this.offsets.heightMain);
};

export default EntropyChart;
