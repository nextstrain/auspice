/* eslint no-underscore-dangle: off */
import { select, event as d3event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { format } from "d3-format";
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
  this.selectedNodes = props.colorBy.startsWith("gt") ?
    this._getSelectedNodes(parseEncodedGenotype(props.colorBy, props.geneLength)) :
    [];
  this.svg.selectAll("*").remove(); /* tear things down */
  this._calcOffsets(props.width, props.height);
  this._drawMainNavElements();
  this._addZoomLayers();
  this._setScales(this.maxNt + 1, props.maxYVal);
  this._drawAxes();
  this._addBrush();
  this._addClipMask();
  this._drawGenes(this.annotations);
  this._drawZoomGenes(this.annotations);
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
    this._clearSelectedBars();
    this.selectedNodes = this._getSelectedNodes(selected);
    this._highlightSelectedBars();
  } else if (clearSelected) {
    this._clearSelectedBars();
  }
};

/* "PRIVATE" PROTOTYPES */

/* convert amino acid X in gene Y to a nucleotide number */
EntropyChart.prototype._aaToNtCoord = function _aaToNtCoord(gene, aaPos) {
  return this.geneMap[gene].start + aaPos * 3;
};

EntropyChart.prototype._getSelectedNodes = function _getSelectedNodes(parsed) {
  if (this.aa !== parsed[0].aa) {
    console.error("entropy out of sync");
    return undefined;
  }
  const selectedNodes = [];
  if (this.aa) { /*     P  R  O  T  E  I  N  S    */
    const genePosPairs = [];
    for (const entry of parsed) {
      for (const pos of entry.positions) {
        genePosPairs.push([entry.prot, pos]);
      }
    }
    for (const node of this.bars) {
      for (const pair of genePosPairs) {
        if (node.prot === pair[0] && node.codon === pair[1]) {
          selectedNodes.push(node);
        }
      }
    }
  } else { /*     N U C L E O T I D E S     */
    for (const node of this.bars) {
      if (parsed[0].positions.indexOf(node.x) !== -1) {
        selectedNodes.push(node);
      }
    }
  }
  /* we fall through to here if the selected genotype (from URL or typed in)
  is not in the entropy data as it has no variation */
  // console.log("get selected nodes returning", selectedNodes)
  return selectedNodes;
};

/* draw the genes Gene (annotations) */
EntropyChart.prototype._drawZoomGenes = function _drawZoomGenes(annotations) {
  this.geneGraph.selectAll("*").remove();
  const geneHeight = 15; // 20;
  const readingFrameOffset = (frame) => frame===-1 ? 10 : 0; // 5*frame; // eslint-disable-line no-unused-vars
  const visibleAnnots = annotations.filter((annot) => /* try to prevent drawing genes if not visible */
    (annot.start < this.scales.xGene.domain()[1] && annot.start > this.scales.xGene.domain()[0]) ||
    (annot.end > this.scales.xGene.domain()[0] && annot.end < this.scales.xGene.domain()[1]));
  const startG = (d) => d.start > this.scales.xGene.domain()[0] ? this.scales.xGene(d.start) : this.offsets.x1;
  const endG = (d) => d.end < this.scales.xGene.domain()[1] ? this.scales.xGene(d.end) : this.offsets.x2;
  const selection = this.geneGraph.selectAll(".gene")
    .data(visibleAnnots)
    .enter()
    .append("g");
  selection.append("rect")
    .attr("class", "gene")
    .attr("x", (d) => startG(d)) // d.start > this.scales.xGene.domain()[0] ? this.scales.xGene(d.start) : this.offsets.x1)
    .attr("y", (d) => readingFrameOffset(d.readingFrame))
    /* this ensures genes aren't drawn past the graph, but makes moving brushes less smooth? */
    .attr("width", (d) => endG(d) - startG(d))
    .attr("height", geneHeight)
    .style("fill", (d) => d.fill)
    .style("stroke", () => "black");
  selection.append("text")
    .attr("x", (d) =>
      this.scales.xGene(d.start) + (this.scales.xGene(d.end) - this.scales.xGene(d.start)) / 2
    )
    .attr("y", (d) => readingFrameOffset(d.readingFrame) + 5)
    .attr("dy", ".7em")
    .attr("text-anchor", "middle")
    .style("fill", () => "white")
    .text((d) => d.prot);
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
EntropyChart.prototype._clearSelectedBars = function _clearSelectedBars() {
  for (const d of this.selectedNodes) {
    const id = this.aa ? `#prot${d.prot}${d.codon}` : `#nt${d.x}`;
    const fillFn = this.aa ?
      (node) => this.geneMap[node.prot].idx % 2 ? medGrey : darkGrey :
      (node) => !node.prot ? lightGrey : this.geneMap[node.prot].idx % 2 ? medGrey : darkGrey;
    select(id).style("fill", fillFn);
  }
  this.selectedNodes = [];
};

EntropyChart.prototype._highlightSelectedBars = function _highlightSelectedBars() {
  for (const d of this.selectedNodes) {
    const id = this.aa ? `#prot${d.prot}${d.codon}` : `#nt${d.x}`;
    const fillVal = this.aa ?
      this.geneMap[d.prot].fill :
      d.prot ? this.geneMap[d.prot].fill : "red";
    select(id).style("fill", fillVal);
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
  const idfn = this.aa ? (d) => "prot" + d.prot + d.codon : (d) => "nt" + d.x;
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
      this.callbacks.onHover(d, d3event.pageX, d3event.pageY);
    })
    .on("mouseout", (d) => {
      this.callbacks.onLeave(d);
    })
    .on("click", (d) => {
      this.callbacks.onClick(d);
    })
    .style("cursor", "pointer");
  this._highlightSelectedBars();
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
  this.scales.xGeneOriginal = scaleLinear()
    .domain([0, xMax])
    .range([this.offsets.x1, this.offsets.x2]);
  this.scales.xGene = this.scales.xGeneOriginal;
  this.scales.y = scaleLinear()
    .domain([this.scales.yMin, 1.2 * yMax])
    .range([this.offsets.y2Main, this.offsets.y1Main]);
};

EntropyChart.prototype._drawAxes = function _drawAxes() {
  this.axes = {};
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  this.axes.xMain = axisBottom(this.scales.xMain).ticks(16);
  this.axes.xNav = axisBottom(this.scales.xNav).ticks(20, ",f");
  const visPos = this.scales.xNav.domain()[1] - this.scales.xNav.domain()[0];
  if (visPos > 1e6) {   /* axes number differently if large genome */
    this.axes.xNav.tickFormat(format(".1e"));
  }
  // this.axes.xGene = axisBottom(this.scales.xGene).ticks(20);

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
  /* this.svg.append("g")
    .attr("class", "xGene axis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y2Gene + ")")
    .call(this.axes.xGene);  */
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
    y1Nav: height - 70, /* 100, to be first */ /* 80, */
    y2Main: height - 120, /* - 100, */
    y2Nav: height - 40, /* 70, to be first */ /* 50, */
    y1Gene: height - 100, /* 40, to be second */
    y2Gene: height - 80 /* 10 to be second */
  };
  this.offsets.heightMain = this.offsets.y2Main - this.offsets.y1Main;
  this.offsets.heightNav = this.offsets.y2Nav - this.offsets.y1Nav;
  this.offsets.heightGene = this.offsets.y2Gene - this.offsets.y1Gene;
  this.offsets.width = this.offsets.x2 - this.offsets.x1;
};

/* the brush is the shaded area in the nav window */
EntropyChart.prototype._addBrush = function _addBrush() {
  this.brushed = function brushed() {
    /* this block called when the brush is manipulated */
    const s = d3event.selection || this.scales.xNav.range();
    // console.log("brushed", s.map(this.scales.xNav.invert, this.scales.xNav))
    this.xModified = this.scales.xMain.domain(s.map(this.scales.xNav.invert, this.scales.xNav));
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.xGeneModified = this.scales.xGene.domain(s.map(this.scales.xNav.invert, this.scales.xNav));
    /* this.axes.xGene = this.axes.xGene.scale(this.scales.xGene);
    this.svg.select(".xGene.axis").call(this.axes.xGene); */
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this._drawBars();
    this._drawZoomGenes(this.annotations);
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
      this.brushed();
    });
  this.gBrush = this.navGraph.append("g")
    .attr("class", "brush")
    .attr("stroke-width", 0)
    .call(this.brush)
    .call(this.brush.move, () => {
      return this.scales.xMain.range();
    });

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
      .on("wheel", () => { d3event.preventDefault(); });
  }, "keydown");
  Mousetrap.bind(zoomKeys, () => {
    this.svg.selectAll(".overlay").remove();
  }, "keyup");
};

EntropyChart.prototype._createZoomFn = function _createZoomFn() {
  return function zoomed() {
    const t = d3event.transform;
    /* rescale the x axis (not y) */
    this.xModified = t.rescaleX(this.scales.xMainOriginal);
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this.svg.select(".xMain.axis").call(this.axes.xMain);
    this._drawBars();

    const t2 = d3event.transform;
    this.xGeneModified = t2.rescaleX(this.scales.xGeneOriginal);
    this.axes.xGene = this.axes.xGene.scale(this.scales.xGene);
    this.svg.select(".xGene.axis").call(this.axes.xGene);
    this._drawZoomGenes(this.annotations);

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
  this.geneGraph = this.svg.append("g")
    .attr("class", "Gene")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Gene + ")");
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
