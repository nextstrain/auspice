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
import { getCdsByName, isCdsWrapping } from "../../util/entropy";

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
  this.selectedCdsIsWrapping = isCdsWrapping(this.selectedCds);
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
  this._setZoomCoordinates(props.zoomMin, props.zoomMax)
  console.log(`\trender() Zoom coordinates are now`, this.zoomCoordinates)
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
    this.selectedCdsIsWrapping = isCdsWrapping(this.selectedCds);
    this._setUpZoomBrushWrapping(!this.selectedCdsIsWrapping); // destroy if not wrapping, create if wrapping
    this.aa = this.selectedCds !== 'nuc';
  }

  if (newBars || selectedPositions!==undefined) {
    if (showCounts!==undefined) this.showCounts = showCounts;
    if (newBars) {
      this.bars = newBars[0];
      this._updateOffsets();
      this._updateMainScaleAndAxis(newBars[1]);
      this._drawNavCds(); // only for CDS opacity changes
    }
    if (selectedPositions !== undefined) {
      this.selectedPositions = selectedPositions;
    }
    if (selectedCds || selectedPositions !== undefined) {
      this._setZoomCoordinates(zoomMin, zoomMax, !!selectedCds);
      console.log(`\tupdate() Zoom coordinates are now`, this.zoomCoordinates)
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
  }
}

  

  // TEMPORARY XXX - following commented section controls zooming
  // if (gene !== undefined && start !== undefined && end !== undefined) {
  //   /* move the brush */
  //   const geneLength = end-start;
  //   const multiplier = gene === nucleotide_gene ? 0 : 1*geneLength; /* scale genes to decent size, don't scale nucs */
  //   this._groups.navBrush
  //     .call(this.brush.move, () => {  /* scale so genes are a decent size. stop brushes going off graph */
  //       return [Math.max(this.scales.xNav(start-multiplier), this.scales.xNav(0)),
  //         Math.min(this.scales.xNav(end+multiplier), this.scales.xNav(this.scales.xNav.domain()[1]))];
  //     });
  // }
  // if (zoomMin !== undefined || zoomMax !== undefined) {
  //   const zMin = zoomMin === undefined ? 0 : zoomMin;
  //   const zMax = zoomMax === undefined ? this.scales.xNav.domain()[1] : zoomMax;
  //   this._groups.navBrush
  //     .call(this.brush.move, () => {
  //       return [this.scales.xNav(zMin), this.scales.xNav(zMax)];
  //     });
  // }
// };

/* "PRIVATE" PROTOTYPES */

/**
 * Given the selectedCds + selectedPositions we want to choose the appropriate zoom
 * coordinates. This is decided in conjunction with any existing zoom coordinates - we
 * don't always want to change the zoom.
 * Called from:
 *  - initial render
 *  - update
 */
EntropyChart.prototype._setZoomCoordinates = function _setZoomCoordinates(overrideMin, overrideMax, cdsChanged) {

  console.log(`_setZoomCoordinates. current zoom is: ${this.zoomCoordinates || 'not yet set'}`);
  if (overrideMin || overrideMax) {
    console.log(`\tRedux-specified zoom bounds: ${overrideMin}, ${overrideMax}`)
  }

  if (cdsChanged && this.zoomCoordinates) {
    console.log("\tDestroying previous zoom state, because we've changed CDS");
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
      // console.log(`\tAround ${posMin}-${posMax} with 5% either side (${desiredSurroundingSpace}nt)`)
    } else {
      // console.log("\tZoom : entire genome")
      this.zoomCoordinates = this.scales.xNav.domain();
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
    if (!this.selectedCdsIsWrapping) {
      /**
       * The approach for (non-wrapping) selected CDSs is much easier -- we show the entire gene unless
       * there's overrides
       */
      this.zoomCoordinates = [
        segments[0].rangeGenome[0],
        segments[segments.length-1].rangeGenome[1]
      ]
      if (overrideMin && overrideMin>this.zoomCoordinates[0] && overrideMin<this.zoomCoordinates[1]) {
        this.zoomCoordinates[0] = overrideMin;
      }
      if (overrideMax && overrideMax>this.zoomCoordinates[0] && overrideMax<this.zoomCoordinates[1]) {
        this.zoomCoordinates[1] = overrideMax;
      }
    } else {
      /* We want to show the entire CDS, it's just a bit more work for wrapping CDSs */
      this.zoomCoordinates = [
        segments[segments.length-1].rangeGenome[1],
        segments[0].rangeGenome[0]
      ]
      // offsets? Probably the same as above?

    }
  }
};


/**
 * Given this.zoomCoordinates (nucleotides in genome space), we want to return
 * the appropriate zoom coordinates in rangeLocal space (nucleotides) for the
 * selected CDS. If either of the zoom handles (i.e. zoomCoordinates) are beyond
 * the selected CDS, then we reset the zoomCoordinates to a sensible state &
 * return false.
 */
EntropyChart.prototype._rangeLocalZoomCoordinates = function _rangeLocalZoomCoordinates() {
  const segments = this.selectedCds.segments
  let localA, localB;

  if (!this.selectedCdsIsWrapping) {
    // If the current genome zoom is outside the CDS, then clamp the zoom &
    // return false, otherwise set the local zoom coordinates via the
    // genome zoom
    const [genomeA, genomeB] = [Math.min(...this.zoomCoordinates), Math.max(...this.zoomCoordinates)];
    if (genomeA < segments[0].rangeGenome[0]) {
      this.zoomCoordinates[0] = segments[0].rangeGenome[0];
      return false;
    } else {
      for (const s of segments) {
        if (s.rangeGenome[0]<=genomeA && s.rangeGenome[1]>=genomeA) {
          const advance = genomeA - s.rangeGenome[0]; // number nt to shift rangeLocal forward by
          localA = s.rangeLocal[0] + advance;
          break;
        }
      }
    }
    if (genomeB > segments[segments.length-1].rangeGenome[1]) {
      this.zoomCoordinates[1] = segments[segments.length-1].rangeGenome[1];
      return false;
    } else {
      for (const s of segments) {
        if (s.rangeGenome[0]<=genomeB && s.rangeGenome[1]>=genomeB) {
          const advance = genomeB - s.rangeGenome[0]; // number nt to shift rangeLocal forward by
          localB = s.rangeLocal[0] + advance;
          break;
        }
      }
    }
  } else {
    // selected gene is wrapping. We apply the same approach, it's just somewhat
    // round the other way. Remember genomeStart > genomeEnd, and that the zoom
    // _must_ wrap the origin (i.e. there is currently no way to change from a
    // warpped zoom to a non-wrapped zoom, even though it may be useful)
    const [genomeEnd, genomeStart] = [Math.min(...this.zoomCoordinates), Math.max(...this.zoomCoordinates)];
    if (genomeStart < segments[0].rangeGenome[0]) {
      this.zoomCoordinates[1] = segments[0].rangeGenome[0];
      return false;
    } else {
      for (const s of segments) {
        if (s.rangeGenome[0]<=genomeStart && s.rangeGenome[1]>=genomeStart) {
          const advance = genomeStart - s.rangeGenome[0]; // number nt to shift rangeLocal forward by
          localA = s.rangeLocal[0] + advance;
          break;
        }
      }
    }
    if (genomeEnd > segments[segments.length-1].rangeGenome[1]) {
      this.zoomCoordinates[0] = segments[segments.length-1].rangeGenome[1];
      return false;
    } else {
      for (const s of segments) {
        if (s.rangeGenome[0]<=genomeEnd && s.rangeGenome[1]>=genomeEnd) {
          const advance = s.rangeGenome[1] - genomeEnd; // number nt remove from the end
          localB = s.rangeLocal[1] - advance;
          break;
        }
      }
    }
  }

  return [localA, localB]
}


EntropyChart.prototype._setSelectedNodes = function _setSelectedNodes() {
  this.selectedNodes = [];
  if (!this.selectedPositions.length) return;
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
  this._groups.mainCds.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill", "#31a354"); // TMP XXX

  const [inViewNucA, inViewNucB] = this.scales.xMain.domain();

  if (this.selectedCds!==nucleotide_gene) {
    this._groups.mainCds.selectAll(".cds")
      .data(this.selectedCds.segments)
      .enter()
      .append("rect")
        .attr("class", "gene")
        .attr("x", (d) => this.scales.xMain(Math.max(d.rangeLocal[0]-0.5, inViewNucA)))
        .attr("y", 0)
        .attr("width", (d) => {
          return this.scales.xMain(Math.min(d.rangeLocal[1]+0.5, inViewNucB)) -
          this.scales.xMain(Math.max(d.rangeLocal[0]-0.5, inViewNucA))
        })
        .attr("height", this.offsets.mainCdsHeight)
        .style("fill", this.selectedCds.color)
        .style("stroke", "#fff")
        .style("stroke-width", 2)
        .style('opacity', 1) // Segments _can't_ overlap when viewing an individual CDS
        .on("mouseover", (d) => {
          this.callbacks.onHover({d3event, tooltip: this._cdsTooltip({displayName: this.selectedCds?.displayName, ...d})})
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
        .style("font-size", `${this.offsets.mainCdsHeight-2}px`)
        .text(() => this.selectedCds.name);

    return;
  }

  const cdsSegments = this._cdsSegments()
    .map((s) => {
      if (s.rangeGenome[1] < inViewNucA || s.rangeGenome[0] > inViewNucB) {
        return false; // CDS is beyond the current zoom domain
      }
      /* The benefit of recalculating the range like this as opposed to a clip mask is
      that the text can be easily centered on the visible pixels */
      s.rangePx = [
        /* the range is modified by 0.5 so that the start/end of the CDS lines up between
        two d3 ticks when zoomed in such that each tick represents one nucleotide */
        this.scales.xMain(Math.max(s.rangeGenome[0]-0.5, inViewNucA)),
        this.scales.xMain(Math.min(s.rangeGenome[1]+0.5, inViewNucB))
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
      .style('opacity', 0.7)
      .on("mouseover", (d) => { // note that the last-rendered CDS (rect) captures
        this.callbacks.onHover({d3event, tooltip: this._cdsTooltip(d)})
      })
      .on("mouseout", (d) => {
        this.callbacks.onLeave(d);
      })
      .on("click", this.callbacks.onCdsClick)
      .style("cursor", "pointer");

  this._groups.mainCds.selectAll(".cdsText")
    .data(cdsSegments)
    .enter()
    .append("text")
      .attr("x", (d) => d.rangePx[0] + 0.5*(d.rangePx[1]-d.rangePx[0]))
      .attr("y", (d) => d.yOffset+2)
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")        // horizontal axis
      .attr("dominant-baseline", "hanging") // vertical axis
      .style("font-size", `${this.offsets.mainCdsHeight-2}px`)
      .style("fill", "white")
      .text((d) => textIfSpaceAllows(d.name, d.rangePx[1] - d.rangePx[0], 10));
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

  this._groups.navCds.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill", "#31a354"); // TMP XXX


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
      .style('fill-opacity', (d) => d.name===this.selectedCds?.name ? 1 : 0.7)
      .style('stroke', (d) => d.name===this.selectedCds?.name ? '#000' : '#fff')
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
      .attr("y", (d) => d.yOffset+2)
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")        // horizontal axis
      .attr("dominant-baseline", "hanging") // vertical axis
      .style("font-size", `${this.offsets.navCdsHeight-2}px`)
      .style("fill", (d) => d.name===this.selectedCds?.name ? '#000' : '#fff')
      .text((d) => textIfSpaceAllows(d.name, d.rangePx[1] - d.rangePx[0], 30/4));
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
          if (cds.displayName) s.displayName=cds.displayName;
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
    // TODO -- following needs updating once we reinstate CDS intersection
    const id = this.aa ? `#cds-${this.selectedCds.name}-${d.codon}` : `#nt${d.x}`;
    select(id).style("fill", "red");
  }
};

/* draw the bars (for each base / aa) */
EntropyChart.prototype._drawBars = function _drawBars() {
  if (!this.okToDrawBars) {return;}
  this._groups.mainBars.selectAll("*").remove();
  this._groups.mainBars.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 5).attr("fill", "#bcbddc"); // TMP XXX

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
  this._groups.mainXAxis.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill", "#ff962e"); // TMP XXX orange
  this._groups.mainYAxis.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill", "#000"); // TMP XXX black
  this._groups.navXAxis.append("circle").attr("cx", 0).attr("cy", 0).attr("r", 3).attr("fill", "#2c7fb8"); // TMP XXX

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
    this._groups.mainClip.select("#cliprect").attr("width", this.offsets.widthNarrow)      

    /* update the scales & rerender x-axis */
    this.scales.xMain.domain([0, mainAxisLength])
      .range([0, this.offsets.widthNarrow]); // origin is shifted via transform on <g>
    this.scales.xMainUpperLimit = mainAxisLength;
    this._groups.mainXAxis.call(this.axes.xMain);
  }

  this.scales.y.domain([0, yMax])
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

  const spaceBetweenBarsAndHighestCds = 5;
  const tickSpace = 20; // ad-hoc TODO XXX
  const negStrand = false; // TODO XXX - probably in initial render / constructor?

  /* The general approach is to calculate spacings from the bottom up, with the barchart
  occupying the remaining space */
  this.offsets = {};

  /* nav (navigation) is the fixed axis, with a brush overlay (to zoom) + CDS annotations */
  this.offsets.navCdsHeight = 13;
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
    0;
  this.offsets.mainY1 = marginTop;
  this.offsets.heightMainBars = this.offsets.mainCdsY1 - this.offsets.mainY1 - spaceBetweenBarsAndHighestCds;
  
  /* The Nav, Brush, and y-axis all use x1,x2, width */
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
  } else {
    this.offsets.x1Narrow = this.offsets.x1;
    this.offsets.widthNarrow = this.offsets.width;
  }
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
      this._brushChanged();
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
  this.brushHandle = this._groups.navBrush.selectAll(".handle--custom")
    .data([{type: "w"}, {type: "e"}])
    .enter().append("path")
    .attr("class", "handle--custom")
    .attr("fill", darkGrey)
    .attr("cursor", "ew-resize")
    .attr("d", "M0,0 0,0 -5,11 5,11 0,0 Z")
    /* see the extent x,y params in brushX() (above) */
    .attr("transform", (d) => {
      return d.type === "e" ? // end (2nd) handle
        `translate(${this.scales.xNav(this.zoomCoordinates[1])},${this.offsets.brushHeight})` :
        `translate(${this.scales.xNav(this.zoomCoordinates[0])},${this.offsets.brushHeight})`
    })

    if (this.selectedCdsIsWrapping) this._setUpZoomBrushWrapping();

    // this._setUpMousewheelZooming() // TODO XXX
};


/**
 * Adds rectangles to mimic the zoom brush, but they are inverted. This function
 * should be run whenever we have a wrapped CDS. If not, then it's safe to call
 * it with destroy = true. While this adds the rectangles, they must be kept in
 * sync with the brush position (done via this._brushChanged)
 */
EntropyChart.prototype._setUpZoomBrushWrapping = function _setUpZoomBrushWrapping(destroy=false) {
  if (destroy) {
    this._navBrushWrappingSelection?.remove();
    this._navBrushWrappingSelection = undefined;
    // ensure the actual brush selection has its default opacity
    this._groups.navBrush.select(".selection").attr("fill-opacity", 0.3);
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
 * (i.e. the grey rectangle)
 */
EntropyChart.prototype._brushChanged = function _brushChanged() {
  /* this block called when the brush is manipulated */
  const s = d3event.selection || this.scales.xNav.range();
  const start_end = s.map(this.scales.xNav.invert, this.scales.xNav);
  this.zoomCoordinates = start_end.map(Math.round);
  
  if (this.selectedCds===nucleotide_gene) {
    this.scales.xMain.domain(this.zoomCoordinates);
  } else {
    const domainLocal = this._rangeLocalZoomCoordinates(); // nucleotides
    if (domainLocal) {
      this.scales.xMain.domain(this._rangeLocalZoomCoordinates());
    } else {
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

  this._groups.navBrush = this.svg.append("g")
    .attr("id", "navBrush")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.brushY1 + ")");

  this._groups.navBrushWrapping = this.svg.append("g") // custom brush <rect> which wrap the origin
    .attr("id", "navBrushWrapping")
    .attr("transform", "translate(" + this.offsets.x1 + "," + this.offsets.brushY1 + ")");

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
  


EntropyChart.prototype._mainTooltip = function _mainTooltip(d) {
  const _render = function _render(t) {

    /**
     * This code needs a bunch of testing, so this is a TODO XXX
     * I'm not convinced we've ever actually supported negative strand nuc (i.e. genome)
     * (some of the code is written as if we do, some of it is not)
     */
    let codonNucleotides = [];
    let strand = '';
    if (this.aa) {
      const cds = getCdsByName(this.genomeMap, this.selectedCds.name);
      if (!cds) {
        console.error(`CDS ${this.selectedCds.name} not found in genomeMap (i.e. JSON annotations)`);
        return null;
      }
      if (cds.strand==='-') {
        strand = t("Negative strand")
        codonNucleotides = ["Negative strand not yet implemented"];
      } else {
        /* default is + strand */
        strand = cds.strand==="+" ? t("Positive strand") : t("Positive strand (assumed)");
        for (const segment of cds.segments) {
          if (segment.rangeLocal[1] < (d.codon-1)*3) continue;
          if (codonNucleotides.length===0) {
            /* RangeLocal represents the nucleotide coords of the amino acids in this segment, relative to the CDS
            so find the offset required for that to get to the 1st base of this codon, then map that to the rangeGenome */
            const x = (d.codon-1)*3+1 - segment.rangeLocal[0];
            let pos = segment.rangeGenome[0] + x;
            codonNucleotides.push(pos++); // Nuc 1 of the codon
            if (pos>segment.rangeGenome[1]) continue;
            codonNucleotides.push(pos++); // nuc 2 of the codon
            if (pos>segment.rangeGenome[1]) continue;
            codonNucleotides.push(pos++); // nuc 3 of the codon
            break;
          } else {
            /* remaining nucleotides from the beginning of the segment */
            if (segment.phase!==(3-codonNucleotides.length)) {
              console.error(`Internal Error -- phase mismatch for CDS ${cds.name} when mapping codon ${d.codon}`);
              codonNucleotides.push("Error!")
              break;
            }
            codonNucleotides.push(segment.rangeGenome[0])
            if (codonNucleotides.length===2) {
              codonNucleotides.push(segment.rangeGenome[0]+1)
            }
            break;
          }
        }
      }
    }
    return (
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {
            this.aa ?
              t("Codon {{codon}} in protein {{protein}}", {codon: d.codon, protein: this.selectedCds.name}) :
              t("Nucleotide {{nuc}}", {nuc: d.x})
          }
        </div>
        <p/>
        <div>
          {this.aa ? t("Nuc positions {{positions}}", {positions: codonNucleotides.join(", ")}) : ``}
        </div>
        <p/>
        <div>
          {strand ? strand : "Strand: unknown (todo)"}
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


EntropyChart.prototype._cdsTooltip = function _cdsTooltip(d) {
  const _render = function _render(t) {
    return (
      <div className={"tooltip entropy"} style={infoPanelStyles.tooltip}>
        <table>
          <tbody>
            { d.displayName && (
              <tr><td>Name</td><td>{d.displayName}</td></tr>
            )}
            <tr><td>CDS</td><td>{d.name}</td></tr>
            <tr><td>Parent Gene</td><td>{d.geneName}</td></tr>
            <tr><td>Range (genome)</td><td>{d.rangeGenome.join(" - ")}</td></tr>
            <tr><td>Range (local)</td><td>{d.rangeLocal.join(" - ")}</td></tr>
            <tr><td>CDS Segment</td><td>{d.segmentNumber}</td></tr>
            <tr><td>Frame</td><td>{d.frame}</td></tr>
            <tr><td>Phase</td><td>{d.phase}</td></tr>
          </tbody>
        </table>

        <div style={infoPanelStyles.comment}>
          {t("Click to view this CDS in isolation")}
        </div>
      </div>
    )
  }
  return _render.bind(this)
}



export default EntropyChart;
