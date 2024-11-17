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
import { getCdsByName, getNucCoordinatesFromAaPos, getCdsRangeLocalFromRangeGenome,
  nucleotideToAaPosition} from "../../util/entropy";

/* EntropyChart uses D3 for visualisation. There are 2 methods exposed to
 * keep the visualisation in sync with React:
 * EntropyChart.render & EntropyChart.update
 */
const EntropyChart = function EntropyChart(ref, genomeMap, callbacks) {
  this.svg = select(ref);
  this.genomeMap = genomeMap;
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
  this._setScales(props.maxYVal);
  this._setZoomBounds();
  this._setZoomCoordinates(props.zoomMin, props.zoomMax)
  this._drawAxes();
  this._setUpZoomBrush();
  this._drawNavCds();
  this._drawMainCds();
  this.okToDrawBars = true;
  this._drawBars();
};

EntropyChart.prototype.update = function update({
  selectedCds = undefined, /* undefined is a no-op for each optional argument */
  selectedPositions = undefined,
  newBars = undefined,
  showCounts = undefined,
  zoomMax = undefined,
  zoomMin = undefined
}) {
  if (selectedCds) {
    this.selectedCds = selectedCds;
    this._setUpZoomBrushWrapping()
    this.aa = this.selectedCds !== 'nuc';
    this._setZoomBounds();
  }

  if (showCounts!==undefined) this.showCounts = showCounts;

  if (newBars || selectedPositions!==undefined) {
    if (newBars) {
      this.bars = newBars[0];
      this._updateOffsets();
      this._updateMainScaleAndAxis(newBars[1]);
      this._drawNavCds(); // only for CDS opacity changes
    }
    if (selectedPositions !== undefined) {
      this.selectedPositions = selectedPositions;
    }
    /* TODO XXX: there's a potential bug here if selectedCds is set but we don't enter this code block
    due to the (newBars || selectedPositions!==undefined) conditional */
    if (selectedCds || selectedPositions !== undefined) {
      this._setZoomCoordinates(zoomMin, zoomMax, !!selectedCds);
    }
    /* always move the brush. If the zoom-coordinates are unchanged, then the
    brush won't actually move, but it will still trigger `_brushChanged` and
    therefore re-render bars + main CDS. Any previously highlighted bars will
    remain highlighted if the selectedCds hasn't changed, otherwise nothing will
    be highlighted */
    this._groups.navBrush.call(this.brush.move, () => this.zoomCoordinates.map(this.scales.xNav));

    if (selectedPositions !== undefined) {
      this._clearSelectedBars();
      this._setSelectedNodes();
      this._highlightSelectedBars();
    }
  } else if (zoomMin!==undefined || zoomMax!==undefined) {
    this._setZoomCoordinates(zoomMin, zoomMax, false);
    this._groups.navBrush.call(this.brush.move, () => this.zoomCoordinates.map(this.scales.xNav));
  }
}

/* "PRIVATE" PROTOTYPES */

EntropyChart.prototype._setZoomBounds = function _setZoomBounds() {
  if (this.aa) {
    const cdsGenomeCoords = this.selectedCds.segments.map((s) => s.rangeGenome).flat();
    this.zoomBounds = [Math.min(...cdsGenomeCoords), Math.max(...cdsGenomeCoords)];
  } else {
    this.zoomBounds = [0, this.genomeMap[0].range[1]];
  }
}

/**
 * Given the selectedCds + selectedPositions we want to choose the appropriate zoom
 * coordinates. This is decided in conjunction with any existing zoom coordinates - we
 * don't always want to change the zoom.
 * Called from:
 *  - initial render
 *  - update
 */
EntropyChart.prototype._setZoomCoordinates = function _setZoomCoordinates(overrideMin, overrideMax, cdsChanged) {

  if (cdsChanged && this.zoomCoordinates) {
    this.zoomCoordinates = undefined;
  }

  if (this.selectedCds===nucleotide_gene) {
    const domain = this.scales.xNav.domain();
    if (this.selectedPositions?.length) {
      const posMin = Math.min(...this.selectedPositions);
      const posMax = Math.max(...this.selectedPositions);
      /* If we already have coordinates which are not the default, and the new
      positions are within the coordinates, then don't change zoom at all */
      if (
        this.zoomCoordinates &&
        (this.zoomCoordinates[0]!==domain[0] || this.zoomCoordinates[1]!==domain[1]) &&
        posMin>this.zoomCoordinates[0] && posMax<this.zoomCoordinates[1]
      ) {
        return;
      }
      let desiredSurroundingSpace = Math.floor(domain[1] * 0.05);  // 5%
      if (desiredSurroundingSpace>1000) desiredSurroundingSpace=1000; // up to a max of 1kb
      this.zoomCoordinates = [posMin - desiredSurroundingSpace, posMax + desiredSurroundingSpace];
    } else {
      this.zoomCoordinates = domain;
    }
    if (overrideMin||overrideMax) {
      if (overrideMin) this.zoomCoordinates[0] = overrideMin;
      if (overrideMax) this.zoomCoordinates[1] = overrideMax;
      // it's guaranteed that overrideMin<overrideMax, however we may no longer have zoom coords [0] < [1]
      if (this.zoomCoordinates[0]>=this.zoomCoordinates[1]) {
        if (overrideMin) this.zoomCoordinates = [overrideMin, domain[1]];
        if (overrideMax) this.zoomCoordinates = [domain[0], overrideMax];
      }
    }
    // clamp the zoom to the domain
    if (this.zoomCoordinates[0] < domain[0]) this.zoomCoordinates[0]=domain[0];
    if (this.zoomCoordinates[1] > domain[1]) this.zoomCoordinates[1]=domain[1];
  } else {
    const segments = this.selectedCds.segments;
    if (!this.selectedCds.isWrapping) {
      this.zoomCoordinates = [...this.zoomBounds];
      if (overrideMin && overrideMin>this.zoomCoordinates[0] && overrideMin<this.zoomCoordinates[1]) {
        this.zoomCoordinates[0] = overrideMin;
      }
      if (overrideMax && overrideMax>this.zoomCoordinates[0] && overrideMax<this.zoomCoordinates[1]) {
        this.zoomCoordinates[1] = overrideMax;
      }
    } else {
      if (this.selectedCds.strand==='+') {
        this.zoomCoordinates = [
          segments[segments.length-1].rangeGenome[1],
          segments[0].rangeGenome[0]
        ]
      } else {
        this.zoomCoordinates = [
          segments[0].rangeGenome[1],
          segments[segments.length-1].rangeGenome[0]
        ]
      }
      /* gmin (overrideMin), gmax (overrideMax) are backwards with wrapping genes,
      although if you think of them as gmin<gmax always then it is consistent */
      if (overrideMin && overrideMin<this.zoomCoordinates[0]) {
        this.zoomCoordinates[0] = overrideMin;
      }
      if (overrideMax && overrideMax>this.zoomCoordinates[0]) {
        this.zoomCoordinates[1] = overrideMax;
      }
    }
  }
};


EntropyChart.prototype._setSelectedNodes = function _setSelectedNodes() {
  this.selectedNodes = [];
  if (!this.selectedPositions.length || !this.bars) return;
  if (this.aa) { /*     P  R  O  T  E  I  N  S    */
    for (const node of this.bars) {
      for (const position of this.selectedPositions) {
        if (node.codon === position) {
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

  if (this.selectedCds!==nucleotide_gene) {
    this._groups.mainCds.selectAll(".cds")
      .data(this._cdsSegments({selected: true}))
      .enter()
      .append("rect")
        .attr("class", "gene")
        .attr("x", (d) => this.scales.xMain(Math.max(d.rangeLocal[0]-0.5, inViewNucA)))
        .attr("y", 0)
        .attr("width", (d) => {
          return this.scales.xMain(Math.min(d.rangeLocal[1]+0.5, inViewNucB)) -
          this.scales.xMain(Math.max(d.rangeLocal[0]-0.5, inViewNucA))
        })
        .attr("height", this.offsets.mainCdsRectHeight)
        .style("fill", this.selectedCds.color)
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .style('opacity', 1) // Segments _can't_ overlap when viewing an individual CDS
        .on("mouseover", (d) => {
          this.callbacks.onHover({d3event, tooltip: this._cdsTooltip(d)})
        })
        .on("mouseout", (d) => {
          this.callbacks.onLeave(d);
        });
        // there is no onClick handler for a single CDS

    this._groups.mainCds
      .append("text")
        .attr("x", () => {
          const l =  this.scales.xMain(Math.max(1, inViewNucA));
          const r = this.scales.xMain(Math.min(this.selectedCds.length, inViewNucB));
          return l + (r-l)/2;
        })
        /* We create the SVG with units equal to pixels, so the top of the text is intended
        to start 1px below the top of the CDS rect, and stop 1px above the bottom of the rect */
        .attr("y", 1)
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")        // horizontal axis
        .attr("dominant-baseline", "hanging") // vertical axis
        .style("fill", "white")
        .style("font-size", `${this.offsets.mainCdsRectHeight-2}px`)
        .text(() => this.selectedCds.name);

    return;
  }

  const cdsSegments = this._cdsSegments({range: [inViewNucA, inViewNucB]})
    .map((s) => {
      const rangePx = [
        /* the nuc position is modified by 0.5 so that the start/end of the CDS lines up
        between two d3 ticks when zoomed in such that each tick represents one nucleotide */
        this.scales.xMain(Math.max(s.rangeGenome[0]-0.5, inViewNucA)),
        this.scales.xMain(Math.min(s.rangeGenome[1]+0.5, inViewNucB))
      ];
      /* Calculate the vertical coordinates in pixel space (relative to the <g> transform) */
      const jitter = (s.cds.stackPosition-1)*this.offsets.mainCdsJitter;
      const yPx = s.cds.strand==='+' ? // always top-left (irregardless of strand)
        (this.offsets.mainCdsPositiveDelta - jitter - this.offsets.mainCdsRectHeight) :
        (this.offsets.mainCdsNegativeDelta + jitter);
      return {rangePx, yPx, ...s};
    });

  this._groups.mainCds.selectAll(".cds")
    .data(cdsSegments)
    .enter()
    .append("path")
      .attr("class", "gene")
      .attr("d", (d) => _cdsPath(d, this.offsets))
      .style("fill", (d) => d.cds.color)
      .style('opacity', 0.7)
      .on("mouseover", (d) => { // note that the last-rendered CDS (rect) captures
        this.callbacks.onHover({d3event, tooltip: this._cdsTooltip(d)})
      })
      .on("mouseout", this.callbacks.onLeave)
      .on("click", this.callbacks.onCdsClick)
      .style("cursor", "pointer");

  this._groups.mainCds.selectAll(".cdsText")
    .data(cdsSegments)
    .enter()
    .append("text")
      .attr("x", (d) => d.rangePx[0] + 0.5*(d.rangePx[1]-d.rangePx[0]))
      .attr("y", (d) => d.yPx+1)
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")        // horizontal axis
      .attr("dominant-baseline", "hanging") // vertical axis
      .style("font-size", `${this.offsets.mainCdsRectHeight-2}px`)
      .style("fill", "white")
      .text((d) => textIfSpaceAllows(d.cds.name, d.rangePx[1] - d.rangePx[0], 10));
};

/**
 * A first pass at trying to be smart about how text is printed over CDSs, which
 * may be very few pixels wide... There are more complicated methods (e.g. query
 * the DOM), or alternatives (e.g. clipping). This doesn't address the problem of
 * text from different CDSs being printed over top of each other
 */
function textIfSpaceAllows(text, width, pxPerChar) {
  if ((width-5)/text.length > pxPerChar) {
    return text;
  }
  return null;
}


function _cdsPath(d, offsets) {
  const h = offsets.mainCdsRectHeight;
  let w = Math.floor(d.rangePx[1] - d.rangePx[0]); // width of CDS (pixels)
  let x = Math.round(d.rangePx[0])
  if (w<20) {
    /* no directional arrow - space is too limited */
    return `M ${x},${d.yPx} h ${w} v ${h} h -${w} Z`
  }
  const w2 = Math.floor(Math.min(w/4, 10)); // width of arrow head
  w-=w2;
  const h2 = h/2;
  if (d.cds.strand==='+') {
    return `M ${x},${d.yPx} h ${w} l ${w2},${h2} l -${w2},${h2} h -${w} Z`;
  }
  // start at top-right and go around the arrow anticlockwise
  x = Math.round(d.rangePx[1])
  return `M ${x},${d.yPx} h -${w} l -${w2},${h2} l ${w2},${h2} h ${w} Z`;
}

/**
 * Renders the CDS annotations in the lower "Nav" track. These have fixed
 * posisions and cannot be updated by zooming. Given the limited amount of
 * vertical space available (although we could use a little more if desired),
 * there will be necessarily busy for complex genomes. Currently we jitter the
 * y-position based on the frame the CDS is in, but CDSs may overlap and be in
 * the same frame! Other genome browsers solve this by using a lot of vertical
 * height - e.g. see https://www.ncbi.nlm.nih.gov/gene/43740578.
 *
 * The CDSs are redrawn when the selected CDS is changed, as we want to
 * highlight the selection within the nav track. Currently this involves
 * changing the opacity, text colour & stroke colour, but there are other
 * (better) ideas to explore here in the future!
 */
EntropyChart.prototype._drawNavCds = function _drawNavCds() {
  this._groups.navCds.selectAll("*").remove();

  const cdsSegments = this._cdsSegments({})
    .map((s) => ({
      rangePx: s.rangeGenome.map(this.scales.xNav),
      yPx: s.cds.strand==='+' ?
        this.offsets.navCdsPositiveStrandSpace - // start at the _bottom_ of the +ve strand CDS space & move up
          (s.cds.stackPosition) * this.offsets.navCdsRectHeight :
        this.offsets.navCdsNegativeY1Delta + // start below axis labels & move downwards
          (s.cds.stackPosition-1) * this.offsets.navCdsRectHeight,
      ...s
    }))

  this._groups.navCds.selectAll(".cdsNav")
    .data(cdsSegments)
    .enter()
    .append("rect")
      .attr("class", "gene")
      .attr("x", (d) => d.rangePx[0])
      .attr("y", (d) => d.yPx)
      .attr("width", (d) => d.rangePx[1] - d.rangePx[0])
      .attr("height", this.offsets.navCdsRectHeight)
      .style("fill", (d) => d.cds.color)
      .style('fill-opacity', (d) => {
        if (this.selectedCds===nucleotide_gene) return 1;
        return d.cds.name===this.selectedCds.name ? 1 : 0.3
      })
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .on("mouseover", (d) => { // note that the last-rendered CDS (rect) captures
        this.callbacks.onHover({d3event, tooltip: this._cdsTooltip(d)})
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })
      .on("click", this.callbacks.onCdsClick)
      .style("cursor", "pointer");

  this._groups.navCds.selectAll(".cdsNavText")
    .data(cdsSegments)
    .enter()
    .append("text")
      .attr("x", (d) => d.rangePx[0] + 0.5*(d.rangePx[1]-d.rangePx[0]))
      .attr("y", (d) => d.yPx+2)
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")        // horizontal axis
      .attr("dominant-baseline", "hanging") // vertical axis
      .style("font-size", `${this.offsets.navCdsRectHeight-2}px`)
      .style("fill", '#fff')
      .text((d) => textIfSpaceAllows(d.cds.name, d.rangePx[1] - d.rangePx[0], 30/4));
};

/**
 * Returns a list of objects which are similar to shallow copies of the matching `CdsSegment`s
 * but with some additions. This allows us to add properties from d3 without worrying about
 * modifying the underlying redux state and the sync-issues that would result.
 * Returned structure (in TypeScript) would be
 * interface Segment extends CdsSegment {
 *   cds: CDS;   // a pointer to a react object - do not modify
 *   gene: Gene; // a pointer to a react object - do not modify
 * }
 * Arguments (all optional):
 * selected: string - only return segments from the currently selected CDS
 * range: (RangeGenome|undefined) - return only segments which are visible in that range
 * @returns 
 */
EntropyChart.prototype._cdsSegments = function _cdsSegments({range=undefined, selected=false}) {
  const cdsSegments = []
  this.genomeMap[0] // Auspice only (currently) considers the first genome
    .genes.forEach((gene) => {
      gene.cds.forEach((cds) => {
        if (selected && cds.name!==this.selectedCds.name) return;
        cds.segments.forEach((cdsSegment) => {
          if (range && (cdsSegment.rangeGenome[1] < range[0] || cdsSegment.rangeGenome[0] > range[1])) {
            return; // CDS is beyond the requested range
          }
          const s = {...cdsSegment}; // shallow copy so we don't modify the redux data
          s.cds = cds;   // this is a pointer to the redux data - don't modify it!
          s.gene = gene; // this is a pointer to the redux data - don't modify it!
          cdsSegments.push(s);
        })
      })
    })
  return cdsSegments;
}

/* clearSelectedBar works on SVG id tags, not on this.selected */
EntropyChart.prototype._clearSelectedBars = function _clearSelectedBars() {
  for (const d of this.selectedNodes) {
    const id = this.aa ? `#cds-${this.selectedCds.name}-${d.codon}` : `#nt${d.x}`;
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
    const id = this.aa ? `#cds-${this.selectedCds.name}-${d.codon}` : `#nt${d.x}`;
    select(id).style("fill", "red");
  }
};

EntropyChart.prototype._drawLoadingState = function _drawLoadingState() {
  this._groups.mainBars
    .append("rect")
    .attr("class", "loading")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", () => this.scales.xMain.range()[1])
    .attr("height", () => this.scales.y.range()[0])
    .attr("fill-opacity", 0.1)
  this._groups.mainBars
    .append("text")
    .attr("y", () => this.scales.y.range()[0]/2)
    .attr("x", () => this.scales.xMain.range()[1]/2)
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")       // horizontal axis
    .attr("dominant-baseline", "middle") // vertical axis
    .style("fill", darkGrey)
    .style("font-size", '5rem')
    .style("font-weight", 200)
    .text('data loading')
}

/* draw the bars (for each base / aa) */
EntropyChart.prototype._drawBars = function _drawBars() {
  if (!this.okToDrawBars) {return;}
  this._groups.mainBars.selectAll("*").remove();

  // bars may be undefined when the underlying data is marked as stale but the panel's still rendered
  // (it's necessarily off-screen for this to occur, but we still call rendering code)
  if (!this.bars) {
    return this._drawLoadingState();
  }

  /* Calculate bar width */
  const validXPos = this.scales.xMain.domain()[0]; // any value inside the scale's domain will do
  let barWidth = this.scales.xMain(validXPos+1) - this.scales.xMain(validXPos); // pixels between 2 nucleotides
  if (this.aa) barWidth *= 3;           // pixels between 2 amino acids
  barWidth *= 0.9;                      // allow padding between bars
  if (barWidth < 1.5) barWidth = 1.5;   // minimum bar width of 1.5px

  const barSvgId = this.aa ? (d) => `cds-${this.selectedCds.name}-${d.codon}` : (d) => "nt" + d.x;

  const barWidthHalf = barWidth/2; // we'll shift the bars x-values left by half-a-bar so the center & tick line up

  this._groups.mainBars
    .selectAll(".bar")
    .data(this.bars)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("id", barSvgId)
    .attr("x", (d) => this.aa ? 
      this.scales.xMain((d.codon-1)*3+2) - barWidthHalf :
      this.scales.xMain(d.x) - barWidthHalf
    )
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
 * Adds the following properties to this.scales:
 * xMain: the x-scale for the bar chart & upper annotation track. Rescaled upon zooming.
 *        the domain of this represents CDS length or chromosome length, as applicable.
 *        in both cases, the domain is measured in nucleotides.
 * xMainUpperLimit: the maximum allowable value for xMain. In the absence of zooming,
 *                  xMain.domain()[1] === xMainUpperLimit, however zooming will modify
 *                  the xMain domain.
 * xNav: the x-scale used to draw the entire genome with a brush & gene annotations.
 *       this is unchanged upon zooming.
 * y: the only y scale used
 */
EntropyChart.prototype._setScales = function _setScales(yMax) {
  this.scales = {};

  const genomeLength = this.genomeMap[0].range[1];
  const mainAxisLength = this.selectedCds === nucleotide_gene ? genomeLength : this.selectedCds.length;
  /* Note that the domains start at zero, but there is no nuc/aa plotted at scale(0). We do, however, shift the bars
  left a bit so that the ~center of the bar is over scale(xVal). Starting at 0 therefore gives us some room to allow
  this for a bar at scale(1). Given this, we should perhaps be using mainAxisLength+1 for the domain. TODO. */
  this.scales.xMain = scaleLinear()
    .domain([0, mainAxisLength])
    .range([0, this.offsets.widthNarrow]); // origin is shifted via transform on <g>
  this.scales.xNav = scaleLinear()
    .domain([0, genomeLength])
    .range([0, this.offsets.width]); // origin is shifted via transform on <g>
  this.scales.y = scaleLinear()
    .domain([0, yMax])
    .range([this.offsets.heightMainBars, 0]);
  this.scales.xMainUpperLimit = mainAxisLength;
};

EntropyChart.prototype._drawAxes = function _drawAxes() {
  this.axes = {};
  this.axes.y = axisLeft(this.scales.y).ticks(4);
  /**
   * The scale behind the xMain axis is always in nucleotides, but we want the
   * ticks to represent nt or aa positions, depending on whether we're viewing
   * one CDS or the entire chromosome. The current implementation doesn't modify
   * the tick positions and so at high zoom levels we will get up to 3 ticks per
   * aa, all of which have the same (correct) label. This isn't so bad, but
   * definitely room for improvement. Ideally, the axis would actually have
   * ticks above and below the line, with one set representing codon position
   * (i.e. what we do here) and the other indicating the nucleotide position in
   * the genome (which we already show when hovering over bars).
   */
  this.axes.xMain = axisBottom(this.scales.xMain)
    .ticks(16)
    .tickFormat((d) => this.aa ? Math.ceil(d/3) : d);
  this.axes.xNav = axisBottom(this.scales.xNav).ticks(20, ",f");
  const visPos = this.scales.xNav.domain()[1] - this.scales.xNav.domain()[0];
  if (visPos > 1e6) {   /* axes number differently if large genome */
    this.axes.xNav.tickFormat(format(".1e"));
  }

  /* A hint that the numbering is AA when a CDS is selected */
  this._groups.mainXAxis.append("text")
    .attr("class", "axisLabel")
    .attr("y", 7)
    .attr("x", -2)
    .attr("pointer-events", "none")
    .attr("text-anchor", "end")           // horizontal axis
    .attr("dominant-baseline", "hanging") // vertical axis
    .style("fill", darkGrey)
    .style("font-size", '12px')
    .text('AA pos')
    .style("visibility", this.aa ? "visible": "hidden")

  this._groups.mainYAxis.call(this.axes.y);
  this._groups.mainXAxis.call(this.axes.xMain);
  this._groups.navXAxis.call(this.axes.xNav);
};

EntropyChart.prototype._updateMainScaleAndAxis = function _updateMainScaleAndAxis(yMax) {

  const genomeLength = this.genomeMap[0].range[1];
  const mainAxisLength = this.selectedCds === nucleotide_gene ? genomeLength : this.selectedCds.length;

  if (this.scales.xMain.domain()[1] !== mainAxisLength) {
    /* update the svg <g> transforms (only technically necessary on nucleotide <-> CDS change */
    this._groups.mainBars.attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainY1 + ")");
    this._groups.mainCds.attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainCdsY1 + ")");
    this._groups.mainXAxis.attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainAxisY1 + ")");
    this._groups.mainClip.select("#cliprect")
      .attr("width", this.offsets.widthNarrow)
      .attr("height", this.offsets.heightMainBars);

    /* update the scales & rerender x-axis */
    this.scales.xMain.domain([0, mainAxisLength])
      .range([0, this.offsets.widthNarrow]); // origin is shifted via transform on <g>
    this.scales.xMainUpperLimit = mainAxisLength;
    this._groups.mainXAxis.call(this.axes.xMain);
  }

  this._groups.mainXAxis.select(".axisLabel")
    .style("visibility", this.aa ? "visible": "hidden")

  this.scales.y
    .domain([0, yMax])
    .range([this.offsets.heightMainBars, 0]);
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
  const marginTop = 10;
  const marginLeft = 30;
  const marginRight = 15;
  const marginBottom = 0;

  /* Spacing which we'll use in the calculations below */
  const navCdsRectHeight = 13;
  const tinySpace = 2;  // space above axis line before a CDS appears
  const navAxisSpaceBelow = 20; // bigger than space above axis to accommodate ticks
  const brushSpaceAboveBelowCdsRects = 2;
  const metadata = this.genomeMap[0].metadata;
  const navCdsPositiveStrandSpace = metadata.strandsObserved.has('+') ?
    metadata.posStrandStackHeight*navCdsRectHeight : 0;
  const navCdsNegativeStrandSpace = metadata.strandsObserved.has('-') ?
    metadata.negStrandStackHeight*navCdsRectHeight : 0;
  const mainCdsRectHeight = 16;
  const mainCdsJitter = mainCdsRectHeight/2;
  const mainCdsPositiveStrandSpace = metadata.strandsObserved.has('+') ?
    mainCdsRectHeight + (metadata.posStrandStackHeight-1)*mainCdsJitter : 0;
  const mainCdsNegativeStrandSpace = metadata.strandsObserved.has('-') ?
    mainCdsRectHeight + (metadata.negStrandStackHeight-1)*mainCdsJitter : 0;

  const tickSpace = 20; // ad-hoc TODO XXX

  /* The general approach is to calculate spacings from the bottom up, with the barchart
  occupying the remaining space. The space needed below the bottom of the barchart is
  a function of the genomeMap, so we could calculate this ahead-of-time and make the entropy
  panel height a function of this. (I think this is a good idea, we should do it!)  */
  this.offsets = {};
  this.offsets.tinySpace = tinySpace;
  this.offsets.brushHandleHeight = 14;
  this.offsets.navCdsRectHeight = navCdsRectHeight;
  this.offsets.navAxisY1 = height - marginBottom - this.offsets.brushHandleHeight -
    tickSpace - navCdsNegativeStrandSpace;
  this.offsets.navCdsY1 = this.offsets.navAxisY1 - 
    tinySpace - // space above axis line before any CDS appears
    navCdsPositiveStrandSpace;
  this.offsets.navCdsPositiveStrandSpace = navCdsPositiveStrandSpace;
  /* navCdsNegativeY1Delta is the height change between navCdsY1 and the top of the highest -ve strand CDS rect */
  this.offsets.navCdsNegativeY1Delta = this.offsets.navAxisY1 + navAxisSpaceBelow - this.offsets.navCdsY1;

  /* brush should start just above highest CDS and extend to just below lowest CDS, or extend just below
  the tick labels if there are no -ve strand CDSs */
  this.offsets.brushY1 = this.offsets.navCdsY1 - brushSpaceAboveBelowCdsRects;
  this.offsets.brushHeight = this.offsets.navCdsNegativeY1Delta + // space between top of CDS space & top of -ve strand CDS
    navCdsNegativeStrandSpace + 2*brushSpaceAboveBelowCdsRects;

  /* The main axis sits ~directly above the top of the brush, with the CDSs
  above that. It is used by the barchart, upper axis, upper CDS annotations. It
  updates as we zoom, but zooming doesn't change the offsets. When (if) a CDS is
  selected then the axis doesn't change position, but the space above it (and
  thus mainCdsY1, heightMainBars) changes */
  this.offsets.mainAxisY1 = this.offsets.brushY1 - 
    tinySpace -
    tickSpace;
  if (this.aa) {  
    this.offsets.mainCdsY1 = this.offsets.mainAxisY1 - 
      tinySpace - // space above axis line before any CDS appears
      mainCdsRectHeight; // space only for a single rect
  } else {
    this.offsets.mainCdsY1 = this.offsets.mainAxisY1 - 
      tinySpace - // space above axis line before any CDS appears
      mainCdsNegativeStrandSpace -
      tinySpace - // space between -ve, +ve strand CDSs
      mainCdsPositiveStrandSpace;
  }
  this.offsets.mainCdsNegativeStrandSpace = mainCdsNegativeStrandSpace;
  this.offsets.mainCdsPositiveStrandSpace = mainCdsPositiveStrandSpace;

  /* deltas used to know where to start drawing CDSs relative to the transformed coords, were zero = mainCdsY1 */
  this.offsets.mainCdsPositiveDelta = mainCdsPositiveStrandSpace;
  this.offsets.mainCdsNegativeDelta = mainCdsPositiveStrandSpace + tinySpace;
  this.offsets.mainCdsJitter = mainCdsJitter;
  this.offsets.mainCdsRectHeight = mainCdsRectHeight;

  /* mainY1 is the top of the bar chart, and so the bars are the space that's left over */
  this.offsets.mainY1 = marginTop;
  this.offsets.heightMainBars = this.offsets.mainCdsY1 - 
    this.offsets.mainY1 - 
    tinySpace; // space between topmost CDS + bars starting 

  /* We now consider the horizontal offsets.
  The Nav, Brush, and y-axis all use x1,x2, width, which never changes */
  this.offsets.x1 = marginLeft;
  this.offsets.width = width - this.offsets.x1 - marginRight;

  /* The main CDSs, axis & bars use x1Narrow / widthNarrow which are the same as
  x1 / width, but accounting for some internal padding _if_ we are viewing an
  individual CDS */
  this.offsets.xMainInternalPad = 20;
  if (this.aa) {
    this.offsets.x1Narrow = this.offsets.x1 + this.offsets.xMainInternalPad
    this.offsets.widthNarrow = this.offsets.width - 2*this.offsets.xMainInternalPad;
  } else {
    this.offsets.x1Narrow = this.offsets.x1;
    this.offsets.widthNarrow = this.offsets.width;
  }
};

/**
 * Update the offsets which may change upon interaction. Currently this is just those
 * which are affected by switching from single CDS view to entire genome (chromosome) view.
 * Note this code is duplicated from _setScales()
 */
EntropyChart.prototype._updateOffsets = function _updateOffsets() {
  if (this.aa) {
    this.offsets.x1Narrow = this.offsets.x1 + this.offsets.xMainInternalPad
    this.offsets.widthNarrow = this.offsets.width - 2*this.offsets.xMainInternalPad;
    this.offsets.mainCdsY1 = this.offsets.mainAxisY1 - 
      this.offsets.tinySpace - // space above axis line before any CDS appears
      this.offsets.mainCdsRectHeight; // space only for a single rect
  } else {
    this.offsets.x1Narrow = this.offsets.x1;
    this.offsets.widthNarrow = this.offsets.width;
    this.offsets.mainCdsY1 = this.offsets.mainAxisY1 - 
      this.offsets.tinySpace - // space above axis line before any CDS appears
      this.offsets.mainCdsNegativeStrandSpace -
      this.offsets.tinySpace - // space between -ve, +ve strand CDSs
      this.offsets.mainCdsPositiveStrandSpace;
  }
  this.offsets.heightMainBars = this.offsets.mainCdsY1 - 
    this.offsets.mainY1 - 
    this.offsets.tinySpace; // space between topmost CDS + bars starting 
}

/**
 * Creates & renders the brush (the grey shaded area which we can drag to move the zoom window)
 * and custom handles (the black triangles which we can use to drag the start/end of the zoom window)
 * Adds properties `this.brush` and `this.brushHandle`
 */
EntropyChart.prototype._setUpZoomBrush = function _setUpZoomBrush() {
  this.brush = brushX()
    .extent([   // Extent viewport is relative to the <g id=navBrush> transform
      [0, 0],   // top-left 
      [this.offsets.width, this.offsets.brushHeight] // bottom-right
    ])
    .on("brush", () => { // https://github.com/d3/d3-brush#brush_on
      this._brushChanged();
    })
    .on("end", () => {
      this._brushChanged(true);
      this._dispatchZoomCoordinates();
    });

  this._groups.navBrush
    .attr("class", "brush")
    .attr("stroke-width", 0)
    .call(this.brush)
    .call(this.brush.move, () => {
      return this.zoomCoordinates.map(this.scales.xNav);
    });

  /* https://bl.ocks.org/mbostock/4349545 */
  const strokeWidth = 2;
  /* Whether the stroke width is counted as part of the path dimensions is
  browser dependent, so if we assume it's not counted then we ensure no clipping
  at the cost of a little whitespace */
  const height = this.offsets.brushHandleHeight-strokeWidth*2;
  this.brushHandle = this._groups.navBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("stroke", darkGrey)
    .attr("stroke-width", 2)
    .attr("cursor", (_, i) => this.zoomCoordinates[i]===this.zoomBounds[i] ? 
      (i===0 ? "e-resize" : "w-resize") : "ew-resize")
    .attr("d", `M0,0 -5,${height} 5,${height} Z`)
    /* see the extent x,y params in brushX() (above) */
    .attr("transform", (d) => {
      return d.type === "e" ? // end (2nd) handle
        `translate(${this.scales.xNav(this.zoomCoordinates[1])},${this.offsets.brushHeight})` :
        `translate(${this.scales.xNav(this.zoomCoordinates[0])},${this.offsets.brushHeight})`
    })

    this._setUpZoomBrushWrapping();

    // this._setUpMousewheelZooming() // TODO XXX
};


/**
 * If we have selected a wrapping CDS this function inverts the brush by
 * (i) hiding the original brush
 * (ii) adding rectangles either side of the original brush which extend to the genome bounds
 * This is safe to call in any situation - whether the selected CDS is wrapping or not.
 * 
 * The rectangles set up here must be moved by another method (e.g. this._brushChanged).
 */
EntropyChart.prototype._setUpZoomBrushWrapping = function _setUpZoomBrushWrapping() {
  /* Remove any previous wrapping brush overlay */
  this._navBrushWrappingSelection?.remove();
  this._navBrushWrappingSelection = undefined;
  // ensure the actual brush selection has its default opacity
  this._groups.navBrush.select(".selection").attr("fill-opacity", 0.3);

  /* Add a brush overlay only if needed */
  if (this.selectedCds === nucleotide_gene || this.selectedCds.isWrapping===false) {
    return;
  }

  this._navBrushWrappingSelection = this._groups.navBrushWrapping
    .selectAll(".selection-wrapping")
    .data(this.zoomCoordinates)
    .enter()
    .append("rect")
      .attr("class", "selection-wrapping")
      .attr("x", (d, i) => i===0 ? 0 : this.scales.xNav(d))
      .attr("y", 0)
      .attr("width", (d, i) => i===0 ? this.scales.xNav(d) : this.offsets.width - this.scales.xNav(d))
      .attr("height", this.offsets.brushHeight)
      .attr("fill", "#777")       // chosen to match d3's brushX default
      .attr("fill-opacity", 0.3); // chosen to match d3's brushX default

  // hide the actual brush selection (as we want to view the inverted selection)
  this._groups.navBrush.select(".selection").attr("fill-opacity", 0);
}


/**
 * Dispatches Redux actions to update the zoom coordinates in the URL (and redux
 * state). Currently this is very simple, however there are improvements we can
 * make such as:
 *   - if the zoomCoordinates are at the edges of a selected CDS, then we
 *     actually want to clear the URL queries
 */
EntropyChart.prototype._dispatchZoomCoordinates = function _dispatchZoomCoordinates() {
  this.props.dispatch(changeZoom(this.zoomCoordinates));
};

/**
 * Called when the brush position has changed, and orchestrates the updating of other
 * elements we want to keep in sync with the brush.
 * Note that the this.brush.move() (a method of d3's brushX) only handles movement of itself
 * (i.e. the grey rectangle).
 * The property `final: boolean` indicates if the brush is being moved or has finished moving
 */
EntropyChart.prototype._brushChanged = function _brushChanged(final=false) {
  /* this block called when the brush is manipulated */
  const s = d3event.selection || this.scales.xNav.range();
  const start_end = s.map(this.scales.xNav.invert, this.scales.xNav);
  this.zoomCoordinates = start_end.map(Math.round);
  
  if (this.selectedCds===nucleotide_gene) {
    this.scales.xMain.domain(this.zoomCoordinates);
  } else {
    const [cdsRangeLocal, valid] = getCdsRangeLocalFromRangeGenome(this.selectedCds, this.zoomCoordinates);
    if (valid) {
      this.scales.xMain.domain(cdsRangeLocal);
    } else {
      /* Return the zoom to the full extent of the selected CDS */
      this._setZoomCoordinates();
      this._groups.navBrush
        .call(this.brush.move, () => {
          return this.zoomCoordinates.map(this.scales.xNav);
        });
    }
  }
    
  this.axes.xMain = this.axes.xMain.scale(this.scales.xMain)
  this._groups.mainXAxis.call(this.axes.xMain);
  this._drawBars();
  this._drawMainCds();
  if (this.brushHandle) {
    this.brushHandle
      .attr("display", null)
      .attr("transform", (d, i) => `translate(${this.scales.xNav(this.zoomCoordinates[i])},${this.offsets.brushHeight})`);
    if (final) {
      this._groups.navBrush.selectAll(".handle--custom")
        .attr("cursor", (_, i) => this.zoomCoordinates[i]===this.zoomBounds[i] ? 
          (i===0 ? "e-resize" : "w-resize") : "ew-resize");
    }
  }
  if (this._navBrushWrappingSelection) {
    this._navBrushWrappingSelection
      .attr("x", (d, i) => i===0 ? 0 : this.scales.xNav(this.zoomCoordinates[1]))
      .attr("width", (d, i) => i===0 ? this.scales.xNav(this.zoomCoordinates[0]) : 
        this.offsets.width - this.scales.xNav(this.zoomCoordinates[1]))
  }
};

/**
 * Sets up mousewheel zooming when holding the 'option' or 'shift' keys.
 * On keydown a rect covering the ~entire graph is added to capture mouse events. It is removed
 * on keyup.
 *
 * NOTE: dragging the handles while these keys are pressed has the effect of moving _both_
 * handles however this is not set up by this function, it is functionality of the d3 brush
 * we are using.
 */
EntropyChart.prototype._setUpMousewheelZooming = function _setUpMousewheelZooming() {
  /* the zoom extent is the barchart region, whereas the capture area extends down to
  the include the main CDSs + axis */
  const zoomExtents = [
    [this.offsets.x1Narrow, this.offsets.mainY1],     // top-left of the viewport extent
    [this.offsets.widthNarrow,                        // bottom-right of the viewport extent
      this.offsets.heightMainBars+this.offsets.mainY1]  
  ];

  const applyMousewheelZoom = zoom()
    // .scaleExtent([1, 8]) /* seems to limit mouse scroll zooming */
    .translateExtent(zoomExtents)
    .extent(zoomExtents)
    .on("zoom", () => {
      const t = d3event.transform;
      const zoomCoordLen = this.zoomCoordinates[1] - this.zoomCoordinates[0];
      const amountZoomChange = (zoomCoordLen - (zoomCoordLen/t.k))/2;
      const tempZoomCoordinates = [Math.max(this.zoomCoordinates[0]+amountZoomChange, this.scales.xNav(0)),
        Math.min(this.zoomCoordinates[1]-amountZoomChange, this.scales.xNav.domain()[1])];
      // don't allow to zoom below a certain level - but if below that level (clicked on gene), allow zoom out
      if ((tempZoomCoordinates[1]-tempZoomCoordinates[0] < 500) && (t.k > 1)) return;
      this.zoomCoordinates = tempZoomCoordinates;
      /* rescale the x axis. Note: this is functionally equivalent to
      this.scales.xMain.domain(tempZoomCoordinates); */
      t.rescaleX(this.scales.xMain);
      /* move the brush - this will then update elements which need to be zoomed */
      this._groups.navBrush
        .call(this.brush.move, () => {
          return this.zoomCoordinates.map(this.scales.xNav); /* go wherever we're supposed to be */
        });
    });

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
      .attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainY1 + ")")
      .attr("width", this.offsets.widthNarrow)
      .attr("height", this.offsets.navCdsY1 - this.offsets.mainY1)
      .call(applyMousewheelZoom)
      .on("wheel", () => { d3event.preventDefault(); });
  }, "keydown");
  Mousetrap.bind(zoomKeys, () => {
    // key-down not captured if actively dragging the brush
    if (this._groups.keyPressOverlay) {
      this._groups.keyPressOverlay.remove();
    }
  }, "keyup");
};

/* prepare graph elements to be drawn in */
EntropyChart.prototype._createGroups = function _createGroups() {
  this._groups = {}
  this._groups.mainBars = this.svg.append("g")
    .attr("id", "mainBars")
    .attr("clip-path", "url(#clip)")
    .attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainY1 + ")");

  this._groups.navBrush = this.svg.append("g")
    .attr("id", "navBrush")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.brushY1 + ")");

  this._groups.navBrushWrapping = this.svg.append("g") // custom brush <rect> which wrap the origin
    .attr("id", "navBrushWrapping")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.brushY1 + ")");

  this._groups.navCds = this.svg.append("g")
    .attr("id", "navCds")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.navCdsY1 + ")");
  this._groups.mainCds = this.svg.append("g")
    .attr("id", "mainCds")
    .attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainCdsY1 + ")");
    
  this._groups.mainYAxis = this.svg.append("g")
    .attr("id", "entropyYAxis") // NOTE - id is referred to by tooltip
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.mainY1 + ")")

  this._groups.mainXAxis = this.svg.append("g")
    .attr("id", "mainXAxis")
    .attr("transform", "translate(" + this.offsets.x1Narrow + "," + this.offsets.mainAxisY1 + ")")

  this._groups.navXAxis = this.svg.append("g")
    .attr("id", "navXAxis")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.navAxisY1 + ")")


  this._groups.mainClip = this.svg.append("g")
    .attr("id", "mainClip")

  this._groups.mainClip.append("clipPath")
    /** The coordinates here get translated by element where we apply the clipping.
     * In our case it's this._groups.mainBars.
     * see https://bl.ocks.org/mbostock/4015254 
     */
    .attr("class", "clipPath")
    .attr("id", "clip") /* accessed by elements to be clipped via `url(#clip)` */
    .append("rect")
      .attr("id", "cliprect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", this.offsets.widthNarrow)
      .attr("height", this.offsets.heightMainBars);
}
  


EntropyChart.prototype._mainTooltipAa = function _mainTooltipAa(d) {
  const _render = function _render(t) {
    const cds = getCdsByName(this.genomeMap, this.selectedCds.name);
    if (!cds) { /* I don't see how this can happen, but better safe than sorry */
      console.error(`CDS ${this.selectedCds.name} not found in genomeMap (i.e. JSON annotations)`);
      return null;
    }
    const {frame, nucCoordinates} = getNucCoordinatesFromAaPos(cds, d.codon);
    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {t("Codon {{codon}} in protein {{protein}}", {codon: d.codon, protein: this.selectedCds.name})}
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
          {this.showCounts ? `${t("Num changes observed")}: ${d.y}` : `${t("Normalised Shannon entropy")}: ${d.y}`}
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
    const nuc = d.x;
    const aa = nucleotideToAaPosition(this.genomeMap, nuc);
    let overlaps; // JSX to convey overlapping CDS info
    if (aa) {
      overlaps = (<div>
        {`Overlaps with ${aa.length} CDS segment${aa.length>1?'s':''}:`}
        <p/>
        <table className="entropy-table">
          <tbody >
            <tr key="header">
              <td style={{minWidth: '60px'}}>CDS</td>
              <td>Nt Pos (in CDS)</td>
              <td>AA Pos</td>
            </tr>
            {aa.map((match) => (
              <tr key={match.cds.name + match.nucLocal}>
                <td>{match.cds.name}</td>
                <td>{match.nucLocal}</td>
                <td>{match.aaLocal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>)
    } else {
      overlaps = (<div>
        {t("No overlapping CDSs")}
      </div>)
    }

    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {t("Nucleotide {{nuc}}", {nuc})}
        </div>
        <p/>
        {overlaps}
        <p/>
        <div>
          {this.showCounts ? `${t("Num changes observed")}: ${d.y}` : `${t("Normalised Shannon entropy")}: ${d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
          {t("Click to color tree & map by this genotype")}
        </div>
      </div>
    );
  }
  return _render.bind(this)
}


EntropyChart.prototype._cdsTooltip = function _cdsTooltip(d) {
  const _render = function _render(t) {
    const segmented = d.cds.segments.length > 1;
    return (
      <div className={"tooltip entropy"} style={infoPanelStyles.tooltip}>
        <table className="entropy-table">
          <tbody>
            { d.cds.displayName && (
              <tr><td>Name</td><td>{d.cds.displayName}</td></tr>
            )}
            <tr><td>CDS name</td><td>{d.cds.name}</td></tr>
            { d.cds.description && (
              <tr><td>Description</td><td>{d.cds.description}</td></tr>
            )}
            {d.cds.name!==d.gene.name && (
              <tr><td>Gene name</td><td>{d.gene.name}</td></tr>
            )}
            <tr><td>CDS length</td><td>{`${d.cds.length/3} amino acids`}</td></tr>

            {segmented ? (
              <>
                <tr><td>CDS segment</td><td>{`${d.segmentNumber}/${d.cds.segments.length}`}</td></tr>
                <tr><td>Segment length</td><td>{_cdsSegmentLength(d.rangeLocal)}</td></tr>
                <tr><td>Segment coords</td><td>{d.rangeGenome.join(" - ") + " (genome coordinates)"}</td></tr>
              </>
            ) : (
              <tr><td>CDS coords</td><td>{d.rangeGenome.join(" - ") + " (genome coordinates)"}</td></tr>
            )}
            <tr><td>Strand</td><td>{d.cds.strand==='+' ? 'Positive' : 'Negative'}</td></tr>
            <tr><td>Frame</td><td>{`${d.frame} (${d.cds.strand==='+'?'F':'R'}${d.frame})`}</td></tr>
            <tr><td style={{minWidth: '100px'}}>Phase</td><td>{d.phase}</td></tr>
          </tbody>
        </table>
        
        {this.selectedCds?.name !== d.cds.name &&
          (<div style={infoPanelStyles.comment}>
            {t("Click to view this CDS in isolation")}
          </div>)}
      </div>
    )
  }
  return _render.bind(this)
}

function _cdsSegmentLength(segmentRangeNuc) {
  const numNucs = segmentRangeNuc[1]-segmentRangeNuc[0] + 1;
  const hanging = numNucs%3;
  let ret = String(Math.floor(numNucs/3));
  if (hanging) {
    ret += hanging===1 ? " ⅓" : " ⅔";
  }
  return ret + " amino acids"
}

export default EntropyChart;
