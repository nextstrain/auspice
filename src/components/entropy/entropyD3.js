/* eslint no-underscore-dangle: off */
import React from 'react';
import { select, event as d3event } from "d3-selection";
import 'd3-transition';
import scaleLinear from "d3-scale/src/linear";
import { axisBottom, axisLeft } from "d3-axis";
import { format } from "d3-format";
import { zoom } from "d3-zoom";
import { brushX } from "d3-brush";
import Mousetrap from "mousetrap";
import { lightGrey, medGrey, darkGrey, infoPanelStyles } from "../../globalStyles";
import { isColorByGenotype, decodeColorByGenotype } from "../../util/getGenotype";
import { changeZoom } from "../../actions/entropy";
import { nucleotide_gene } from "../../util/globals";

/* EntropyChart uses D3 for visualisation. There are 2 methods exposed to
 * keep the visualisation in sync with React:
 * EntropyChart.render & EntropyChart.update
 */
const EntropyChart = function EntropyChart(ref, annotations, geneMap, genomeMap, maxNt, callbacks) {
  this.svg = select(ref);
  this.annotations = annotations;
  this.geneMap = geneMap;
  this.genomeMap = genomeMap;
  this.maxNt = maxNt;
  this.callbacks = callbacks;
  this.okToDrawBars = false; /* useful as the brush setUp causes _drawBars x 2 */
};

/* "PUBLIC" PROTOTYPES */
EntropyChart.prototype.render = function render(props) {
  this.props = props;
  this.aa = props.mutType === "aa";
  this.showCounts = props.showCounts;
  this.bars = props.bars;
  this.selectedNodes = isColorByGenotype(props.colorBy) ?
    this._getSelectedNodes(decodeColorByGenotype(props.colorBy, props.geneLength)) :
    [];
  this.svg.selectAll("*").remove(); /* tear things down */
  this._calcOffsets(props.width, props.height);
  this._createGroups();
  this._addZoomLayers();
  this._setScales(this.maxNt + 1, props.maxYVal);
  /* If only a gene/nuc, zoom to that. If zoom min/max as well, that takes precedence */
  this.zoomCoordinates = isColorByGenotype(props.colorBy) ?
    this._getZoomCoordinates(decodeColorByGenotype(props.colorBy, props.geneLength), props.geneMap) :
    this.scales.xNav.domain(); // []; /* set zoom to specified gene or to whole genome */
  this.zoomCoordinates[0] = props.zoomMin ? props.zoomMin : this.zoomCoordinates[0];
  this.zoomCoordinates[1] = props.zoomMax ? props.zoomMax : this.zoomCoordinates[1];
  this._drawAxes();
  this._addBrush();
  this._drawNavCds();
  this._drawZoomGenes(this.annotations);
  this.okToDrawBars = true;
  this._drawBars();
  this.zoomed = this._createZoomFn();
};

EntropyChart.prototype.update = function update({
  aa = undefined, /* undefined is a no-op for each optional argument */
  selected = undefined,
  newBars = undefined,
  showCounts = undefined,
  maxYVal = undefined,
  clearSelected = false,
  gene = undefined,
  start = undefined,
  end = undefined,
  zoomMax = undefined,
  zoomMin = undefined
}) {
  const aaChange = aa !== undefined && aa !== this.aa;
  if (newBars || aaChange) {
    if (aaChange) {this.aa = aa;}
    if (newBars) {
      this.bars = newBars;
      this.showCounts = showCounts;
    }
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
  if (gene !== undefined && start !== undefined && end !== undefined) {
    /* move the brush */
    const geneLength = end-start;
    const multiplier = gene === nucleotide_gene ? 0 : 1*geneLength; /* scale genes to decent size, don't scale nucs */
    this._groups.navBrush
      .call(this.brush.move, () => {  /* scale so genes are a decent size. stop brushes going off graph */
        return [Math.max(this.scales.xNav(start-multiplier), this.scales.xNav(0)),
          Math.min(this.scales.xNav(end+multiplier), this.scales.xNav(this.scales.xNav.domain()[1]))];
      });
  }
  if (zoomMin !== undefined || zoomMax !== undefined) {
    const zMin = zoomMin === undefined ? 0 : zoomMin;
    const zMax = zoomMax === undefined ? this.scales.xNav.domain()[1] : zoomMax;
    this._groups.navBrush
      .call(this.brush.move, () => {
        return [this.scales.xNav(zMin), this.scales.xNav(zMax)];
      });
  }
};

/* "PRIVATE" PROTOTYPES */

/* convert amino acid X in gene Y to a nucleotide number */
EntropyChart.prototype._aaToNtCoord = function _aaToNtCoord(gene, aaPos) {
  if (this.geneMap[gene].strand === "-") {
    return this.geneMap[gene].end - aaPos * 3 + 1;
  }
  return this.geneMap[gene].start + aaPos * 3 - 2; // Plot from 1st codon position, not last.
};

EntropyChart.prototype._getZoomCoordinates = function _getZoomCoordinates(parsed, geneMap) {
  let startEnd = [0, this.scales.xNav.domain()[1]];
  let multiplier = 0; /* scale genes to nice sizes - don't scale nucs */
  if (!parsed.aa) {
    const maxNt = this.scales.xNav.domain()[1];
    /* if one nuc position, pad on either side with some space */
    if (parsed.positions.length === 1) {
      const pos = parsed.positions[0];
      const eitherSide = maxNt*0.05;
      startEnd = (pos-eitherSide) <= 0 ? [0, pos+eitherSide] :
        (pos+eitherSide) >= maxNt ? [pos-eitherSide, maxNt] : [pos-eitherSide, pos+eitherSide];
    } else {
      /* if two nuc pos, find largest and smallest and pad slightly */
      const start = Math.min.apply(null, parsed.positions);
      const end = Math.max.apply(null, parsed.positions);
      startEnd = [start - (end-start)*0.05, end + (end-start)*0.05];
    }
  } else {
    /* if a gene, scale to nice size */
    const gene = parsed.gene;
    startEnd = [geneMap[gene].start, geneMap[gene].end];
    multiplier = (startEnd[1]-startEnd[0])*1;
  }
  /* ensure doesn't run off graph */
  return [Math.max(startEnd[0]-multiplier, 0),
    Math.min(startEnd[1]+multiplier, this.scales.xNav.domain()[1])];
};

EntropyChart.prototype._getSelectedNodes = function _getSelectedNodes(parsed) {
  if (this.aa !== parsed.aa) {
    console.error("entropy out of sync");
    return undefined;
  }
  const selectedNodes = [];
  if (this.aa) { /*     P  R  O  T  E  I  N  S    */
    const genePosPairs = [];
    for (const pos of parsed.positions) {
      genePosPairs.push([parsed.gene, pos]);
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
      if (parsed.positions.indexOf(node.x) !== -1) {
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
  this._groups.mainCds.selectAll("*").remove();
  const geneHeight = 20;
  const posInSequence = this.scales.xNav.domain()[1] - this.scales.xNav.domain()[0];
  const strokeCol = posInSequence < 1e6 ? "white" : "black"; /* black for large because otherwise disappear against background */
  /* check if we've got 2 reading frames (genes on both the "+" & "-" strands) and if so then modify
  the offset accordingly. If not, plot them all in the middle to save space */
  const genesOnBothStrands = !!annotations.filter((a) => a.strand === "-").length;
  const readingFrameOffset = (strand) => {
    if (genesOnBothStrands) {
      return strand === "-" ? 20 : 0;
    }
    return 10;
  };
  const visibleAnnots = annotations.filter((annot) => /* try to prevent drawing genes if not visible */
    (annot.start < this.scales.xMain.domain()[1] && annot.start > this.scales.xMain.domain()[0]) ||
    (annot.end > this.scales.xMain.domain()[0] && annot.end < this.scales.xMain.domain()[1]) ||
    (annot.start <= this.scales.xMain.domain()[0] && annot.end >= this.scales.xMain.domain()[1])); // for extreme zoom, keep plotting if both ends off graph!
  /* stop gene plots from extending beyond axis if zoomed in */
  const startG = (d) => d.start > this.scales.xMain.domain()[0] ? this.scales.xMain(d.start) : this.offsets.x1;
  const endG = (d) => d.end < this.scales.xMain.domain()[1] ? this.scales.xMain(d.end) : this.offsets.x2;
  const selection = this._groups.mainCds.selectAll(".gene")
    .data(visibleAnnots)
    .enter()
    .append("g");
  selection.append("rect")
    .attr("class", "gene")
    .attr("x", (d) => startG(d))
    .attr("y", (d) => readingFrameOffset(d.strand))
    /* this ensures genes aren't drawn past the graph */
    .attr("width", (d) => endG(d) - startG(d))
    .attr("height", geneHeight)
    .style("fill", (d) => d.fill)
    .style("stroke", () => strokeCol);
  selection.append("text")
    .attr("x", (d) =>
      this.scales.xMain(d.start) + (this.scales.xMain(d.end) - this.scales.xMain(d.start)) / 2
    )
    .attr("y", (d) => readingFrameOffset(d.strand) + 5)
    .attr("dy", ".7em")
    .attr("text-anchor", "middle")
    .style("fill", () => "white")
    .text((d) => (endG(d)-startG(d)) > 15 ? d.prot : ""); /* only print labels if gene large enough to see */
};

/* draw the genes (annotations) */
EntropyChart.prototype._drawNavCds = function _drawNavCds() {

  const cdsSegments = []
  this.genomeMap[0] // Auspice only (currently) considers the first genome
    .genes.forEach((gene) => {
      gene.cds.forEach((cds) => {
        cds.segments.forEach((cdsSegment, idx) => {
          const s = {...cdsSegment};
          s.color = cds.color;
          s.name = cds.name;
          s.geneName = gene.name;
          s.yOffset = cdsSegment.frame * this.offsets.navCdsHeight/2
          s.segmentNumber = `${idx+1}/${cds.segments.length}`;
          if (cds.strand === '-') {
            s.yOffset += (this.offsets.brushHeight + this.offsets.navCdsHeight*2)
            // TODO XXX - need to properly account for ticks + axis text
            s.yOffset += 15
          }
          cdsSegments.push(s);
          s.rangePx = [this.scales.xNav(s.rangeGenome[0]), this.scales.xNav(s.rangeGenome[1])]
        })
      })
    })

  this._groups.navCds.selectAll(".cdsNav")
    .data(cdsSegments)
    .enter()
    .append("rect")
      .attr("class", "gene")
      .attr("x", (d) => d.rangePx[0])
      .attr("y", (d) => d.yOffset)
      .attr("width", (d) => d.rangePx[1] - d.rangePx[0])
      .attr("height", this.offsets.navCdsHeight)
      .style("fill", (d) => d.color)
      .style('opacity', 0.5)
      .on("mouseover", (d) => { // note that the last-rendered CDS (rect) captures
        this.callbacks.onHover({d3event, tooltip: this._navCdsTooltip(d)})
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })

  this._groups.navCds.selectAll(".cdsNavText")
    .data(cdsSegments)
    .enter()
    .append("text")
      .attr("x", (d) => d.rangePx[0] + 0.5*(d.rangePx[1]-d.rangePx[0]))
      .attr("y", (d) => d.yOffset)
      .attr("dy", ".7em")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")       // horizontal axis
      .attr("dominant-baseline", "auto") // vertical axis
      .style("fill", "white")
      .text((d) => d.name);

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
    if (this.aa && !d.prot) return; /* if we've switched from NT to AA by selecting a gene, don't try to highlight NT position! */
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
  this._groups.mainBars.selectAll("*").remove();
  let posInView = this.scales.xMain.domain()[1] - this.scales.xMain.domain()[0];
  if (this.aa) {
    posInView /= 3;
  }
  let barWidth;
  if (this.aa) {
    if (posInView > 600) {
      barWidth = 2;
    } else {
      barWidth = (d) => this.scales.xMain(this._aaToNtCoord(d.prot, d.codon)+2.6) - this.scales.xMain(this._aaToNtCoord(d.prot, d.codon));
    }
  } else {
    if (posInView > 1000) {
      barWidth = 2;
    } else if (posInView > 250) {
      barWidth = 3;
    } else {
      barWidth = (d) => this.scales.xMain(d.x + 0.3) - this.scales.xMain(d.x - 0.3);
    }
  }
    
  const idfn = this.aa ? (d) => "prot" + d.prot + d.codon : (d) => "nt" + d.x;

  const xscale = this.aa ?
    (d) => this.scales.xMain(this._aaToNtCoord(d.prot, d.codon) - 0.3) : // shift 0.3 in order to
    (d) => this.scales.xMain(d.x - 0.3);                                 // line up bars & ticks
  const fillfn = this.aa ?
    (d) => this.geneMap[d.prot].idx % 2 ? medGrey : darkGrey :
    (d) => {
      if (d.prot) {
        return (this.geneMap[d.prot].idx % 2) ? medGrey : darkGrey;
      }
      return lightGrey;
    };
  this._groups.mainBars
    .selectAll(".bar")
    .data(this.bars)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("id", idfn)
    .attr("x", xscale)
    .attr("y", (d) => this.scales.y(d.y))
    .attr("width", barWidth)
    .attr("height", (d) => this.offsets.heightMainBars - this.scales.y(d.y))
    .style("fill", fillfn)
    .on("mouseover", (d) => {
      this.callbacks.onHover({d3event, tooltip: this._mainTooltip(d)})
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

/* set scales
 * yMin, yMax: [0, maximum height of any entropy bar]
 * xMin, xMax: [0, genome length in nucleotides]
 * xMain: the x-scale for the bar chart & upper annotation track. Rescaled upon zooming.
 * xNav: the x-scale used to draw the entire genome with a brush & gene annotations.
 *       this is unchanged upon zooming.
 * y: the only y scale used
 */
EntropyChart.prototype._setScales = function _setScales(xMax, yMax) {
  this.scales = {};
  this.scales.xMax = xMax;
  this.scales.yMax = yMax;
  this.scales.yMin = 0; // -0.11 * yMax;
  this.scales.xMin = 0;
  this.scales.xMain = scaleLinear()
    .domain([0, xMax])
    .range([this.offsets.x1, this.offsets.x2]);
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
  this.axes.xMain = axisBottom(this.scales.xMain).ticks(16);
  this.axes.xNav = axisBottom(this.scales.xNav).ticks(20, ",f");
  const visPos = this.scales.xNav.domain()[1] - this.scales.xNav.domain()[0];
  if (visPos > 1e6) {   /* axes number differently if large genome */
    this.axes.xNav.tickFormat(format(".1e"));
  }

  this._groups.mainYAxis.call(this.axes.y);
  this._groups.mainXAxis.call(this.axes.xMain);
  this._groups.navXAxis.call(this.axes.xNav);
};

EntropyChart.prototype._updateYScaleAndAxis = function _updateYScaleAndAxis(yMax) {
  this.scales.y = scaleLinear()
    .domain([this.scales.yMin, 1.2 * yMax])
    .range([this.offsets.y2Main, this.offsets.y1Main]);
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  this._groups.mainYAxis.selectAll("*").remove()
  this._groups.mainYAxis.call(this.axes.y)
  /* requires redraw of bars */
};


/**
 * Calculate offsets (essentially {x1,x2,y1,y2} for most elements).
 * Note that y1 and y2 are measured from the top downwards, i.e. y2>y1.
 * The panel comprises two main parts, which have different scales
 * "main" is the top part, including bar chart + CDS annotations
 * "nav" is the whole-genome axis, including CDS annotations + zoom brush
 */
EntropyChart.prototype._calcOffsets = function _calcOffsets(width, height) {

  const marginTop = 0;
  const marginLeft = 15;
  const marginRight = 17;
  const spaceBelowBarchart = 130;
  const navCdsHeight = 10; /* for an individual CDS (rectangle) */
  const spaceBelowTopOfNavAxis = 35; // TODO - depends on whether -ve strand CDSs exist
  const spaceAboveTopOfNavAxis = 2 * navCdsHeight + 5; // 5px space between frame2 CDS + axis line
  const brushHeight = 10;
  const spaceBetweenMainCdsNavCds = 0;
  const heightMainCds = 42;

  this.offsets = {
    x1: marginLeft,
    x2: width - marginLeft - marginRight,
    y1Main: marginTop,
    y2Main: height - spaceBelowBarchart, // i.e. barchart is what's left over
    y1MainXAxis: height - spaceBelowBarchart,
  
    brushHeight,
    y1NavBrush: height - spaceBelowTopOfNavAxis - brushHeight/2, // brush centered on axis

    navCdsHeight, 
    y1NavAnnotations: height - spaceBelowTopOfNavAxis - spaceAboveTopOfNavAxis,
    y1NavXAxis: height - spaceBelowTopOfNavAxis,
    y1MainCds: height - spaceBelowTopOfNavAxis - spaceAboveTopOfNavAxis - spaceBetweenMainCdsNavCds - heightMainCds,
  };
  this.offsets.heightMainBars = this.offsets.y2Main - this.offsets.y1Main;
  this.offsets.width = this.offsets.x2 - this.offsets.x1;
};

/* the brush is the shaded area in the nav window */
EntropyChart.prototype._addBrush = function _addBrush() {
  this.brushed = function brushed() {
    /* this block called when the brush is manipulated */
    const s = d3event.selection || this.scales.xNav.range();
    // console.log("brushed", s); // , this.scales);
    // console.log("brushed", s.map(this.scales.xNav.invert, this.scales.xNav))
    const start_end = s.map(this.scales.xNav.invert, this.scales.xNav);
    this.zoomCoordinates = start_end.map(Math.round);
    if (!d3event.selection) { /* This keeps brush working if user clicks (zoom out entirely) rather than click-drag! */
      this._groups.navBrush.select(".brush")
        .call(this.brush.move, () => {
          this.zoomCoordinates = this.scales.xNav.range().map(Math.round);
          return this.scales.xNav.range();
        });
    } else {
      this._zoom(start_end[0], start_end[1]);
    }
  };

  this.brushFinished = function brushFinished() {
    this.brushed();
    /* if the brushes were moved by box, click drag, handle, or click, then update zoom coords */
    if (d3event.sourceEvent instanceof MouseEvent) {
      if (
        !d3event.selection ||
        d3event.sourceEvent.target.id === "d3entropyParent" ||
        d3event.sourceEvent.target.id === ""
      ) {
        this.props.dispatch(changeZoom(this.zoomCoordinates));
      } else if (
        d3event.sourceEvent.target.id.match(/^prot/) ||
        d3event.sourceEvent.target.id.match(/^nt/)
      ) {
        /* If selected gene or clicked on entropy, hide zoom coords */
        this.props.dispatch(changeZoom([undefined, undefined]));
      }
    } else if (_isZoomEvent(d3event)) {
      this.props.dispatch(changeZoom(this.zoomCoordinates));
    }
  };

  /* ZoomEvent is emitted by d3-zoom when shift/option + mouseWheel on the entropy panel. */
  function _isZoomEvent(d3Event) {
    return d3Event && d3Event.sourceEvent && d3Event.sourceEvent.type === 'zoom';
  }

  /* zooms in by modifying the domain of xMain scale */
  this._zoom = function _zoom(start, end) {
    const s = [start, end];
    this.scales.xMain.domain(s);
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this._groups.mainXAxis.call(this.axes.xMain);
    this._drawBars();
    this._drawZoomGenes(this.annotations);
    if (this.brushHandle) {
      this.brushHandle
        .attr("display", null)
        .attr("transform", (d, i) => "translate(" + this.scales.xNav(s[i]) + "," + (this.offsets.brushHeight) + ")");
    }
  };

  this.brush = brushX()
    /* the extent is relative to the navGraph group - the constants are a bit hacky... */
    .extent([[this.offsets.x1, 0], [this.offsets.width + 20, this.offsets.brushHeight]])
    .on("brush", () => { // https://github.com/d3/d3-brush#brush_on
      this.brushed();
    })
    .on("end", () => {
      this.brushFinished();
    });
  this._groups.navBrush
    .attr("class", "brush")
    .attr("stroke-width", 0)
    .call(this.brush)
    .call(this.brush.move, () => {
      return this.zoomCoordinates.map(this.scales.xNav); /* coords may have been specified by URL */
    });

  /* https://bl.ocks.org/mbostock/4349545 */
  this.brushHandle = this._groups.navBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("fill", darkGrey)
    .attr("cursor", "ew-resize")
    .attr("d", "M0,0 0,0 -5,11 5,11 0,0 Z")
    /* see the extent x,y params in brushX() (above) */
    .attr("transform", (d) =>
      d.type === "e" ?
        "translate(" + (this.scales.xNav(this.zoomCoordinates[1]) - 1) + "," + (this.offsets.brushHeight) + ")" :
        "translate(" + (this.scales.xNav(this.zoomCoordinates[0]) + 1) + "," + (this.offsets.brushHeight) + ")"
        /* this makes handles move if initial draw is zoomed! */
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
    // .scaleExtent([1, 8]) /* seems to limit mouse scroll zooming */
    .translateExtent(zoomExtents)
    .extent(zoomExtents)
    .on("zoom", () => this.zoomed());

  /* the overlay should be dependent on whether you have certain keys pressed */
  const zoomKeys = ["option", "shift"];
  Mousetrap.bind(zoomKeys, () => {
    /**
     * There is a small bug in the horizontal position of this overlay, or perhaps
     * the bug is really in the offset calculation / axis rendering.
     * offsets.x1 was intended to be the (pixel) position where the horizontal axis line
     * of the main/nav axes started, however axisLeft() adds its own horizontal shift
     * (seems to be 15.5px)
     * The overlay added here doesn't take this into account so will be offset
     * to the left by this amount. In practice, this means that mouse events when
     * positioned over the far RHS of the graph won't be captured.
     */
    this._groups.keyPressOverlay = this.svg.append("rect")
      .attr("class", "overlay")
      .attr("text", "zoom")
      .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")")
      .attr("width", this.offsets.width)
      .attr("height", this.offsets.y1NavXAxis + 30 - this.offsets.y1Main)
      .call(this.zoom)
      .on("wheel", () => { d3event.preventDefault(); });
  }, "keydown");
  Mousetrap.bind(zoomKeys, () => {
    // key-down not captured if actively dragging the brush
    if (this._groups.keyPressOverlay) {
      this._groups.keyPressOverlay.remove();
    }
  }, "keyup");
};

EntropyChart.prototype._createZoomFn = function _createZoomFn() {
  return function zoomed() {
    const t = d3event.transform;
    const zoomCoordLen = this.zoomCoordinates[1] - this.zoomCoordinates[0];
    const amountZoomChange = (zoomCoordLen - (zoomCoordLen/t.k))/2;
    const tempZoomCoordinates = [Math.max(this.zoomCoordinates[0]+amountZoomChange, this.scales.xNav(0)),
      Math.min(this.zoomCoordinates[1]-amountZoomChange, this.scales.xNav.domain()[1])];
    // don't allow to zoom below a certain level - but if below that level (clicked on gene), allow zoom out
    if ((tempZoomCoordinates[1]-tempZoomCoordinates[0] < 500) && (t.k > 1)) return;
    this.zoomCoordinates = tempZoomCoordinates;

    /* rescale the x axis (not y) */  // does this do anything?? Unsure.
    // On the surface, this is functionally equivalent to
    // this.scales.xMain.domain(tempZoomCoordinates);
    // Which is what we do within this._zoom
    t.rescaleX(this.scales.xMain);
    this.axes.xMain = this.axes.xMain.scale(this.scales.xMain);
    this._groups.mainXAxis.call(this.axes.xMain);
    this._drawBars();
    this._drawZoomGenes(this.annotations);

    /* move the brush */
    this._groups.navBrush
      .call(this.brush.move, () => {
        return this.zoomCoordinates.map(this.scales.xNav); /* go wherever we're supposed to be */
      });
  };
};

/* prepare graph elements to be drawn in */
EntropyChart.prototype._createGroups = function _createGroups() {
  this._groups = {}
  this._groups.mainBars = this.svg.append("g")
    .attr("id", "mainBars")
    .attr("clip-path", "url(#clip)")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")");
  this._groups.navCds = this.svg.append("g")
    .attr("id", "navCds")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1NavAnnotations + ")");
  this._groups.mainCds = this.svg.append("g")
    .attr("id", "mainCds")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1MainCds + ")");

  this._groups.mainYAxis = this.svg.append("g")
    .attr("id", "entropyYAxis") // NOTE - id is referred to by tooltip
    /* no idea why the 15 is needed here */
    .attr("transform", "translate(" + (this.offsets.x1 + 15) + "," + this.offsets.y1Main + ")")

  this._groups.mainXAxis = this.svg.append("g")
    .attr("id", "mainXAxis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1MainXAxis + ")")

  this._groups.navXAxis = this.svg.append("g")
    .attr("id", "navXAxis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1NavXAxis + ")")

  this._groups.navBrush = this.svg.append("g")
    .attr("id", "navBrush")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1NavBrush + ")");

  this._groups.mainClip = this.svg.append("g")
    .attr("id", "mainClip")
    .append("clipPath") /* see https://bl.ocks.org/mbostock/4015254 */
    .attr("class", "clipPath")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.y1Main + ")")
    .attr("id", "clip") /* accessed by elements to be clipped via `url(#clip)` */
    .append("rect")
    .attr("id", "cliprect")
    .attr("width", this.offsets.width)
    .attr("height", this.offsets.heightMainBars);
};


EntropyChart.prototype._mainTooltip = function _mainTooltip(d) {
  /* NOTE - d is still from geneMap (not genomeMap) */
  const _render = function _render(t) { 
    const isNegStrand = d.prot ? this.geneMap[d.prot].strand === "-" : null;

    const nucPos = d.prot ?
      this.aa ?
        isNegStrand ? this.geneMap[d.prot].end - d.codon * 3 + 3 :
          this.geneMap[d.prot].start + d.codon * 3
        : isNegStrand ? this.geneMap[d.prot].end - d.x :
          d.x - this.geneMap[d.prot].start-1
      : null;

      return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {
            this.aa ? t("Codon {{codon}} in protein {{protein}}", {codon: d.codon, protein: d.prot}) :
              d.prot ? `${t("Nucleotide {{nuc}}", {nuc: d.x})} (${t("Codon {{codon}} in protein {{protein}}", {codon: Math.floor((nucPos)/3) + 1, protein: d.prot})})` :
                t("Nucleotide {{nuc}}", {nuc: d.x})
          }
        </div>
        <p/>
        <div>
          {this.aa ? t("Nuc positions {{a}} to {{b}}", {a: nucPos-2, b: nucPos}) : ``}
        </div>
        <p/>
        <div>
          {isNegStrand === null ? `` : isNegStrand ? t("Negative strand") : t("Positive strand")}
        </div>
        <p/>
        <div>
          {this.showCounts ? `${t("Num mutations")}: ${d.y}` : `${t("entropy")}: ${d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
          {t("Click to color tree & map")}
        </div>
      </div>
    );
  }
  return _render.bind(this)
}


EntropyChart.prototype._navCdsTooltip = function _navCdsTooltip(d) {
  const _render = function _render(_t) {
    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <table>
          <tbody>
            <tr><td>CDS</td><td>{d.name}</td></tr>
            <tr><td>Parent Gene</td><td>{d.geneName}</td></tr>
            <tr><td>Range (genome)</td><td>{d.rangeGenome.join(" - ")}</td></tr>
            <tr><td>Range (local)</td><td>{d.rangeLocal.join(" - ")}</td></tr>
            <tr><td>CDS Segment</td><td>{d.segmentNumber}</td></tr>
            <tr><td>Frame</td><td>{d.frame}</td></tr>
            <tr><td>Phase</td><td>{d.phase}</td></tr>
          </tbody>
        </table>
      </div>
    )
  }
  return _render.bind(this)
}


export default EntropyChart;
