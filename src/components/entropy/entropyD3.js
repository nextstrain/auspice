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
import { darkGrey, infoPanelStyles } from "../../globalStyles";
import { changeZoom } from "../../actions/entropy";
import { nucleotide_gene } from "../../util/globals";
import { getCdsByName, getNucCoordinatesFromAaPos} from "../../util/entropy";

/* EntropyChart uses D3 for visualisation. There are 2 methods exposed to
 * keep the visualisation in sync with React:
 * EntropyChart.render & EntropyChart.update
 */
const EntropyChart = function EntropyChart(ref, annotations, genomeMap, maxNt, callbacks) {
  this.svg = select(ref);
  this.annotations = annotations;
  this.genomeMap = genomeMap;
  this.maxNt = maxNt;
  this.callbacks = callbacks;
  this.okToDrawBars = false; /* useful as the brush setUp causes _drawBars x 2 */
};

/* "PUBLIC" PROTOTYPES */
EntropyChart.prototype.render = function render(props) {
  this.props = props;
  this.selectedCds = props.selectedCds;
  this.selectedPositions = props.selectedPositions;
  /* temporarily keep this.aa, as so much code relies on it here */
  this.aa = this.selectedCds !== 'nuc';
  this.showCounts = props.showCounts;
  this.bars = props.bars;
  this._setSelectedNodes();
  this.svg.selectAll("*").remove(); /* tear things down */
  this._calcOffsets(props.width, props.height);
  this._createGroups();
  this._addZoomLayers();
  this._setScales(this.maxNt + 1, props.maxYVal);
  /* If only a gene/nuc, zoom to that. If zoom min/max as well, that takes precedence */

  /** TEMPORARY -- the zooming will be updated in a future commit. Here I simply convert the
   * new state (selectedCds, selectedPositions) into the previous structure so the code works
   * as intended without needing to refactor the zoom logic. The intention here is to 
   * "set zoom to specified gene or to whole genome" (although it also sets the zoom for nucleotide
   * positions)
   */
  if (this.selectedPositions.length) {
    const aa = this.selectedCds!==nucleotide_gene;
    const genotype = {aa, positions: [...this.selectedPositions], gene: aa ? this.selectedCds.name : nucleotide_gene}
    this.zoomCoordinates = this._getZoomCoordinates(genotype)
  } else {
    this.zoomCoordinates = this.scales.xNav.domain();
  }
  this.zoomCoordinates[0] = props.zoomMin ? props.zoomMin : this.zoomCoordinates[0];
  this.zoomCoordinates[1] = props.zoomMax ? props.zoomMax : this.zoomCoordinates[1];
  this._drawAxes();
  this._addBrush();
  this._drawNavCds();
  this._drawMainCds();
  this.okToDrawBars = true;
  this._drawBars();
  this.zoomed = this._createZoomFn();
};

EntropyChart.prototype.update = function update({
  selectedCds = undefined, /* undefined is a no-op for each optional argument */
  selectedPositions = undefined,
  newBars = undefined,
  showCounts = undefined,
  maxYVal = undefined,
  gene = undefined,
  start = undefined,
  end = undefined,
  zoomMax = undefined,
  zoomMin = undefined
}) {
  let aa = undefined; // see comment above
  if (selectedCds!==undefined) {
    this.selectedCds = selectedCds;
    aa = this.selectedCds !== 'nuc';
  }
  const aaChange = aa !== undefined && aa !== this.aa;
  if (newBars || aaChange) {
    if (aaChange) {this.aa = aa;}
    if (newBars) {
      this.bars = newBars;
      this.showCounts = showCounts;
    }
    this._updateYScaleAndAxis(maxYVal);
    this._drawBars(); // NOTE: this may (incorrectly) attempt to highlight previous bars
  }

  if (selectedPositions !== undefined) {
    this.selectedPositions = selectedPositions;
    this._clearSelectedBars();
    this._setSelectedNodes();
    this._highlightSelectedBars();
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



/**
 * This will change when we move the main axes to represent rangeLocal of the CDS (segments)
 * But for now this is at least as good as the previous implementation (but not perfect)
 */
// const firstNucOfCds = (d) => {
EntropyChart.prototype._aaToNtCoord = function _aaToNtCoord(gene, aaPos) {
  const cds = getCdsByName(this.genomeMap, gene);
  if (cds.strand==='-') {
    console.log("Negative strand mapping not yet implemented");
    return NaN;
  }
  for (const segment of cds.segments) {
    if (segment.rangeLocal[1] < (aaPos-1)*3) continue;
    const x = (aaPos-1)*3+1 - segment.rangeLocal[0];
    return segment.rangeGenome[0] + x;
  }
  console.error(`Error mapping codon position ${aaPos} for CDS ${gene}`);
  return NaN;
}

EntropyChart.prototype._getZoomCoordinates = function _getZoomCoordinates(parsed) {
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
    /* if a gene (CDS), scale to nice size */
    const segments = getCdsByName(this.genomeMap, parsed.gene)?.segments;
    if (!segments) {
      console.error(`Internal error. CDS name ${parsed.gene} not found in genomeMap`);
      return this.scales.xNav.domain();
    }
    startEnd = segments.reduce((z, d) => {
      if (d.rangeGenome[0]<z[0]) z[0]=d.rangeGenome[0];
      if (d.rangeGenome[1]>z[1]) z[1]=d.rangeGenome[1];
      return z;
    }, [Infinity,0]);
    multiplier = 0; // it's not really a multiplier!!!
  }
  /* ensure doesn't run off graph */
  return [Math.max(startEnd[0]-multiplier, 0),
    Math.min(startEnd[1]+multiplier, this.scales.xNav.domain()[1])];
};

EntropyChart.prototype._setSelectedNodes = function _setSelectedNodes() {
  if (this.aa !== (this.selectedCds!==nucleotide_gene)) {
    console.error("entropy out of sync");
    return undefined;
  }
  this.selectedNodes = [];
  if (!this.selectedPositions.length) return;
  if (this.aa) { /*     P  R  O  T  E  I  N  S    */
    for (const node of this.bars) {
      for (const position of this.selectedPositions) {
        if (node.prot === this.selectedCds.name && node.codon === position) {
          this.selectedNodes.push(node);
        }
      }
    }
  } else { /*     N U C L E O T I D E S     */
    for (const node of this.bars) {
      if (this.selectedPositions.indexOf(node.x) !== -1) {
        this.selectedNodes.push(node);
      }
    }
  }
  /* NOTE - if the selected genotype (from URL or typed in)
  is not in the entropy data as it has no variation - then selectedNodes may be empty */
};


/**
 * The rendering of the main ("zoomed") CDSs differs if we have selected a CDS
 * (and are viewing AA bars) vs if we are viewing the nucleotides. In the latter
 * case the code is very similar to this._drawNavCds, and we may unify them later on.
 */
EntropyChart.prototype._drawMainCds = function _drawMainCds() {
  this._groups.mainCds.selectAll("*").remove();
  const [inViewNucA, inViewNucB] = this.scales.xMain.domain();

  const cdsSegments = this._cdsSegments()
    .map((s) => {
      if (s.rangeGenome[1] < inViewNucA || s.rangeGenome[0] > inViewNucB) {
        return false; // CDS is beyond the current zoom domain
      }
      /* The benefit of recalculating the range like this as opposed to a clip mask is
      that the text can be easily centered on the visible pixels */
      s.rangePx = [
        this.scales.xMain(Math.max(s.rangeGenome[0], inViewNucA)),
        this.scales.xMain(Math.min(s.rangeGenome[1], inViewNucB))
      ];
      if (s.strand === '+') {
        s.yOffset = s.frame * this.offsets.mainCdsHeight/2;
      } else {
        // TODO XXX
      }
      return s;
    })
    .filter((s) => !!s)

  this._groups.mainCds.selectAll(".cds")
    .data(cdsSegments)
    .enter()
    .append("rect")
      .attr("class", "gene")
      .attr("x", (d) => d.rangePx[0])
      .attr("y", (d) => d.yOffset)
      .attr("width", (d) => d.rangePx[1] - d.rangePx[0])
      .attr("height", this.offsets.mainCdsHeight)
      .style("fill", (d) => d.color)
      .style('opacity', 0.5)
      .on("mouseover", (d) => { // note that the last-rendered CDS (rect) captures
        // TODO -- currently using the nav toolbar - perhaps they'll be the same?
        this.callbacks.onHover({d3event, tooltip: this._navCdsTooltip(d)})
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })

  this._groups.mainCds.selectAll(".cdsText")
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

/* draw the genes (annotations) */
EntropyChart.prototype._drawNavCds = function _drawNavCds() {

  const cdsSegments = this._cdsSegments()
  cdsSegments.forEach((s) => {
    s.rangePx = [this.scales.xNav(s.rangeGenome[0]), this.scales.xNav(s.rangeGenome[1])];
    if (s.strand === '+') {
      s.yOffset = s.frame * this.offsets.navCdsHeight/2
    } else {
      s.yOffset = (this.offsets.navCdsY2 - this.offsets.navCdsY1) - this.offsets.navCdsHeight -
        (1/((s.frame+1)%3))*this.offsets.navCdsHeight/2;
    }
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

EntropyChart.prototype._cdsSegments = function _cdsSegments() {
  const cdsSegments = []
  this.genomeMap[0] // Auspice only (currently) considers the first genome
    .genes.forEach((gene) => {
      gene.cds.forEach((cds) => {
        cds.segments.forEach((cdsSegment, idx) => {
          const s = {...cdsSegment};
          s.color = cds.color;
          s.name = cds.name;
          s.strand = cds.strand;
          s.geneName = gene.name;
          s.segmentNumber = `${idx+1}/${cds.segments.length}`;
          cdsSegments.push(s);
        })
      })
    })
  return cdsSegments;
}

/* clearSelectedBar works on SVG id tags, not on this.selected */
EntropyChart.prototype._clearSelectedBars = function _clearSelectedBars() {
  for (const d of this.selectedNodes) {
    const id = this.aa ? `#prot${d.prot}${d.codon}` : `#nt${d.x}`;
    /* To revisit: a previous version used a zebra-fill based on when nuc positions changed from within
    a gene to outside a gene, or to another gene. This information is no longer available as it
    was problematic, but it will hopefully resurface shortly. Given the problems of overlapping
    genes, perhaps a zebra-fill based soley on whether a position is inside a (any) CDS segment or not
    would be best... */
    select(id).style("fill", darkGrey);
  }
  this.selectedNodes = [];
};

EntropyChart.prototype._highlightSelectedBars = function _highlightSelectedBars() {
  for (const d of this.selectedNodes) {
    // TODO -- following needs updating once we reinstate CDS intersection
    if (this.aa && !d.prot) return; /* if we've switched from NT to AA by selecting a gene, don't try to highlight NT position! */
    const id = this.aa ? `#prot${d.prot}${d.codon}` : `#nt${d.x}`;
    select(id).style("fill", "red");
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
    .style("fill", darkGrey)
    .on("mouseover", (d) => {
      this.callbacks.onHover({
        d3event,
        tooltip: this.aa ? this._mainTooltipAa(d) : this._mainTooltipNuc(d),
      })
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
    .range([this.offsets.mainY2, this.offsets.mainY1]);
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
    .range([this.offsets.mainY2, this.offsets.mainY1]);
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

  /* Margins are space we don't directly draw elements into, but things may end up there
  e.g. axis ticks + labels */
  const marginTop = 0;
  const marginLeft = 15;
  const marginRight = 17;
  const marginBottom = 0;

  const tickSpace = 20; // ad-hoc TODO XXX
  const negStrand = false; // TODO XXX - probably in initial render / constructor?

  /* The general approach is to calculate spacings from the bottom up, with the barchart
  occupying the remaining space */
  this.offsets = {};

  /* nav (navigation) is the fixed axis, with a brush overlay (to zoom) + CDS annotations */
  this.offsets.navCdsHeight = 10;
  this.offsets.brushHeight = 10;
  const negStrandNavCdsSpace = negStrand ? this.offsets.navCdsHeight * 2 : 0;
  this.offsets.navAxisY1 = height - marginBottom - tickSpace - negStrandNavCdsSpace;
  this.offsets.brushY1 = this.offsets.navAxisY1 - this.offsets.brushHeight/2;
  this.offsets.navCdsY1 = this.offsets.brushY1 - 2*this.offsets.navCdsHeight;
  this.offsets.navCdsY2 = height - marginBottom;

  /* main is the barchart, axis (axes), CDS annotations. While it updates as we zoom,
  the updating doesn't change the offsets */
  this.offsets.mainCdsHeight = 15; // TODO XXX
  this.offsets.mainAxisY1 = this.offsets.navCdsY1 -
    0 - // spacing between nav + main -- adjust in conjunction with tickSpace
    (negStrand ? this.offsets.mainCdsHeight * 2 : 0) -
    tickSpace;
  this.offsets.mainCdsY1 = this.offsets.mainAxisY1 - 
    this.offsets.mainCdsHeight * 2 -
    0; // TODO - see next line - note that toggling this.aa doesn't update the positioning
    // (this.aa ? tickSpace : 0); // to allow codon-axis on top side of axis
  this.offsets.mainY1 = marginTop;
  this.offsets.mainY2 = this.offsets.mainCdsY1 - 5;
  this.offsets.heightMainBars = this.offsets.mainY2 - this.offsets.mainY1;

  /* Currently nav + brush + main occupy the same horizontal spaces */
  this.offsets.x1 = marginLeft;
  this.offsets.x2 = width - marginLeft - marginRight;
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
    this._drawMainCds();
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
    [this.offsets.x1, this.offsets.mainY1],
    [this.offsets.width, this.offsets.mainY2]
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
      .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainY1 + ")")
      .attr("width", this.offsets.width)
      .attr("height", this.offsets.navAxisY1 - this.offsets.mainY1)
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
    this._drawMainCds();

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
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainY1 + ")");
  this._groups.navCds = this.svg.append("g")
    .attr("id", "navCds")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.navCdsY1 + ")");
  this._groups.mainCds = this.svg.append("g")
    .attr("id", "mainCds")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainCdsY1 + ")");

  this._groups.mainYAxis = this.svg.append("g")
    .attr("id", "entropyYAxis") // NOTE - id is referred to by tooltip
    /* no idea why the 15 is needed here */
    .attr("transform", "translate(" + (this.offsets.x1 + 15) + "," + this.offsets.mainY1 + ")")

  this._groups.mainXAxis = this.svg.append("g")
    .attr("id", "mainXAxis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainAxisY1 + ")")

  this._groups.navXAxis = this.svg.append("g")
    .attr("id", "navXAxis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.navAxisY1 + ")")

  this._groups.navBrush = this.svg.append("g")
    .attr("id", "navBrush")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.brushY1 + ")");

  this._groups.mainClip = this.svg.append("g")
    .attr("id", "mainClip")
    .append("clipPath") /* see https://bl.ocks.org/mbostock/4015254 */
    .attr("class", "clipPath")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainY1 + ")")
    .attr("id", "clip") /* accessed by elements to be clipped via `url(#clip)` */
    .append("rect")
    .attr("id", "cliprect")
    .attr("width", this.offsets.width)
    .attr("height", this.offsets.heightMainBars);
};


EntropyChart.prototype._mainTooltipAa = function _mainTooltipAa(d) {
  const _render = function _render(t) {
    const cds = getCdsByName(this.genomeMap, d.prot);
    if (!cds) { /* I don't see how this can happen, but better safe than sorry */
      console.error(`CDS ${d.prot} not found in genomeMap (i.e. JSON annotations)`);
      return null;
    }
    const {frame, nucCoordinates} = getNucCoordinatesFromAaPos(cds, d.codon);
    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {t("Codon {{codon}} in protein {{protein}}", {codon: d.codon, protein: d.prot})}
        </div>
        <p/>
        <div>
          {t("Nuc positions {{positions}}", {positions: nucCoordinates.join(", ")})}
        </div>
        <p/>
        <div>
          {cds.strand==='-' ? 'Negative strand' : `Positive strand${cds.strand!=='+' ? ' (assumed)' : ''}`}
          {`, ${frame}`}
        </div>
        <p/>
        <div>
          {this.showCounts ? `${t("Num mutations")}: ${d.y}` : `${t("entropy")}: ${d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
        {t("Click to color tree & map by this genotype")}
        </div>
      </div>
    );
  }
  return _render.bind(this)
}

EntropyChart.prototype._mainTooltipNuc = function _mainTooltipAa(d) {
  const _render = function _render(t) {
    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {t("Nucleotide {{nuc}}", {nuc: d.x})}
        </div>
        <div>
          {t("Overlapping CDSs") + ":"}
        </div>
        <div>
          {"Table here! TODO"}
        </div>
        <p/>
        <div>
          {this.showCounts ? `${t("Num mutations")}: ${d.y}` : `${t("entropy")}: ${d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
          {t("Click to color tree & map by this genotype")}
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
