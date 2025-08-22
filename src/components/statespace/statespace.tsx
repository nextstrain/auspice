import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import _max from "lodash/max";
import { select, Selection } from "d3-selection";
import { interpolateNumber } from "d3-interpolate";
import { arc } from "d3-shape";
import ErrorBoundary from "../../util/errorBoundary";
import Legend from "../tree/legend/legend";
import Card from "../framework/card";
import { createOrUpdateArcs } from "../map/mapHelpersLatLong";
import { pathStringGenerator, extractLineSegmentForAnimationEffect } from "../map/mapHelpers";
import { bezier } from "../map/transmissionBezier";
import { getAverageColorFromNodes } from "../../util/colorHelpers";
import { getTraitFromNode } from "../../util/treeMiscHelpers";
import { NODE_NOT_VISIBLE, demeCountMultiplier, demeCountMinimum } from "../../util/globals";
import { ReduxNode, Visibility } from "../../reducers/tree/types";
import { AppDispatch } from "../../store";

/**
 * ------------------ RUNNING TO-DO LIST -----------------------
 * 
 * Don't depend on geo-resolutions, instead scan the tree and
 * find any trait which is defined on internal nodes. Consider relaxing
 * even this and just showing any node-attr?
 * 
 * Browser resizing
 * 
 * Force-directed deme positions (or similar)
 * 
 * Performance testing
 * 
 * Deme size selection
 * 
 * make line width (and "extend") a function of line count
 * 
 * onhover behavior to highlight nodes in tree (this is a big performance slow-down)
 * 
 * Remove dependence on 'num_date' which is hardcoded here
 * 
 * Check for "TODO XXX" comments in this file
 * 
 * Sidebar <Controls> entry for Statespace
 * 
 * URL queries
 * 
 * Allow genotypes to be used as the demes
 * 
 * Remove `any` types
 * -------------------------------------------------------------
 */

interface Props {
  nodes: ReduxNode[];
  nodeColors: string[]
  visibility: Visibility[]
  geoResolution: string
  dateMinNumeric: number
  dateMaxNumeric: number
  colorBy: string
  continuousColorScale: boolean
  legendValues: any
  width: number
  height: number
  legend: boolean
  dispatch: AppDispatch
  t: any
}

interface Arc {
  color: string
  startAngle: number
  endAngle: number
  innerRadius: number
  outerRadius: number
  parent?: Deme// Will always be present, optional just because of how the object's built
  _count?: number
}

interface Deme {
  name: string
  count?: number
  arcs?: Arc[]

  /* x-position, may be changed by d3's force calcs */
  x?: number

  /* y-position, may be changed by d3's force calcs */
  y?: number
}

interface DemeNodes {
  [key: string]: ReduxNode[]
}

type Demes = Map<string, Deme>

interface TransmissionEvent {
  originName: string
  destinationName: string
  originIdx: number
  destinationIdx: number

  /** Among transmissions of this origin to this destination, what number is this one? */
  nForThisPair: number

  originNumDate?: number
  destinationNumDate?: number
  bezierCurve?: any
  bezierDates?: number[]

  /* origin color */
  color?: string
}

type TransmissionCounts = Map<string, number>

type SelectionGroup = Selection<SVGGElement, unknown, SVGSVGElement, unknown>
type SelectionLabels = Selection<SVGTextElement, Deme, SVGGElement, unknown>
type SelectionArcs = Selection<SVGPathElement, Arc, SVGGElement, unknown>
type SelectionTransmissions = Selection<SVGPathElement, TransmissionEvent, SVGGElement, unknown>

interface Recompute {
  everything: boolean
  colors?: boolean
  visibility?: boolean
}

/* -------------------------------------------------------------------------------- */

class StateSpace extends React.Component<Props> {
  svgDomRef: SVGSVGElement | null
  data: {
    demes?: Demes
    demeMultiplier?: number
    transmissionEvents?: TransmissionEvent[]
    transmissionCounts?: TransmissionCounts
  };
  groups: {
    labels?: SelectionGroup
    demes?: SelectionGroup
    transmissions?: SelectionGroup
  }
  selections: {
    labels?: SelectionLabels
    demes?: SelectionArcs
    transmissions?: SelectionTransmissions
  }

  constructor(props: Props) {
    super(props);
    // we store data as properties of the object ("class") rather than in `this.state` because
    // we don't want react's lifecycle's to run when it's updated as we manage this ourselves
    this.svgDomRef = null;
    this.data = {};
    this.groups = {};
    this.selections = {};
  }

  /**
   * We only want to recompute data as needed (it's expensive!)
   */
  recomputeData(props, recompute: Recompute = {everything: true}): void {
    const {nodesPerDemeAll, nodesPerDemeVisible} = nodesPerDeme(props.nodes, props.visibility, props.geoResolution);

    if (recompute.everything || recompute.visibility) {
      this.data.demeMultiplier = computeDemeMultiplier(props.nodes);
    }

    if (recompute.everything) {
      this.data.demes = new Map(Object.keys(nodesPerDemeAll).map((name) => [name, {name}]));
    } else if (recompute.colors) {
      this.data.demes.forEach((value) => value.arcs = undefined); // destroy previous arcs
    }

    if (recompute.everything || recompute.visibility || recompute.colors) {
      createArcs(this.data.demes, nodesPerDemeVisible, props, this.data.demeMultiplier);
    }

    if (recompute.everything) {
      [this.data.transmissionEvents, this.data.transmissionCounts] = collectTransmissionEvents(this.props.nodes, this.props.geoResolution);
    }

    if (recompute.everything) {
      setInitialCoordinates(this.data.demes, props.width, props.height);
    }

    if (recompute.everything || recompute.visibility) {
      computeTransmissionCurves(this.data.transmissionEvents, this.data.demes, props.nodes);
    }

    if (recompute.everything || recompute.colors) {
      this.data.transmissionEvents.forEach((e) => {e.color = props.nodeColors[e.originIdx]})
    }

    console.log(this.data.demes.get('North America'), this.data.demes.get('North America').count, this.data.demes.get('North America').arcs[0].outerRadius)
    // console.log(this.data.demes, this.data.transmissionEvents, this.data.transmissionCounts)
  }

  renderData(props:Props, recompute:Recompute={everything: true}):void {
    /* Labels only render when we update everything. Possible improvement: when demes are not visible
    (i.e. due to visibility) we may want to remove the label and perhaps update the coordinates.
    Note that we also re-render when we recompute the color as the data bind needs updating */

    const demes = Array.from(this.data.demes.values());

    if (recompute.everything) {
      this.selections.labels = renderLabels({g: this.groups.labels, demes, width: this.props.width});
    }

    /* We remove & rerender demes on ∆colorBy & ∆geoRes, otherwise we update their attrs */
    if (recompute.everything || recompute.colors) {
      this.selections.demes = renderDemes({g: this.groups.demes, demes});
    } else if (recompute.visibility) {
      this.selections.demes = renderUpdatesToExistingDemes({selection: this.selections.demes});
    }

    /* we handle transmissions differently -- the visibility is computed here, not in the data construction.
    Note that it would be more performant to update existing DOM elements rather than destroying & recreating */
    if (recompute.everything || recompute.colors || recompute.visibility) {
      this.selections.transmissions = renderTransmissions({g: this.groups.transmissions, transmissions: this.data.transmissionEvents, demes: this.data.demes, visibility: props.visibility, dateMinNumeric: props.dateMinNumeric, dateMaxNumeric: props.dateMaxNumeric});
    }
  }

  override componentDidMount(): void {
    this.groups = setUpSvg(this.svgDomRef);
    this.recomputeData(this.props);
    this.renderData(this.props);
  }

  override UNSAFE_componentWillReceiveProps(nextProps: Props): void {
    const recompute = compareProps(this.props, nextProps);
    this.recomputeData(nextProps, recompute);
    this.renderData(nextProps, recompute);
  }


  override render(): JSX.Element {
    const { t } = this.props;
    return (
      <Card center title={t("Node States")}>
        {this.props.legend && (
          <ErrorBoundary>
            <Legend right width={this.props.width} />
          </ErrorBoundary>
        )}
        <svg
          id="NodeStatesGraph"
          style={{pointerEvents: "auto", cursor: "default", userSelect: "none"}}
          width={this.props.width}
          height={this.props.height}
          ref={(c):void => {this.svgDomRef = c;}}
        />
      </Card>
    );
  }

  override componentWillUnmount(): void {
    const svg = select(this.svgDomRef);
    svg.selectAll("*").remove();
  }
}

function computeDemeMultiplier(nodes: Props['nodes']):number {
  const visibleTips = nodes[0].tipCount;
  const demeMultiplier =
    demeCountMultiplier /
    Math.sqrt(_max([Math.sqrt(visibleTips * nodes.length), demeCountMinimum]));
  return demeMultiplier;
}


/**
 * Create or update arcs for each deme.
 * The presence of arcs on demes indicates whether we will create them from scratch
 * or simply update them. Updates are only valid for visibility changes, not color-by changes.
 */
function createArcs(
  demes: Demes,
  nodesPerDemeVisible: DemeNodes,
  props: Props,
  demeMultiplier: number,
):void {

  for (const [name, deme] of demes) {
    const visibleNodes = nodesPerDemeVisible[name];
    const count = visibleNodes.length;

    if (deme.arcs) { // arcs already exist, but their sizes need updating
      if (props.geoResolution===props.colorBy || props.continuousColorScale) {
        deme.arcs[0].color = getAverageColorFromNodes(visibleNodes, props.nodeColors);
      } else {
        createOrUpdateArcs(visibleNodes, props.legendValues, props.colorBy, props.nodeColors, deme.arcs);
      }
    } else { // create arcs from scratch!
      if (props.geoResolution===props.colorBy || props.continuousColorScale) {
        deme.arcs = [{innerRadius: 0, outerRadius: 0, startAngle: 0, endAngle: 2*Math.PI, color: getAverageColorFromNodes(visibleNodes, props.nodeColors)}];
      } else {
        deme.arcs = createOrUpdateArcs(visibleNodes, props.legendValues, props.colorBy, props.nodeColors);
      }
    }

    // radius size depends on visibility counts
    deme.arcs.forEach((a) => {
      a.outerRadius = Math.sqrt(count)*demeMultiplier;
      a.parent = deme;
    });
    deme.count = count;
  }
}

/**
 * Returns the mappings of demes (states / locations) to nodes for tips in the tree.
 * Returns one mapping for all tips and one for all visible tips.
 */
function nodesPerDeme(
  nodes: Props['nodes'],
  visibility: Props['visibility'],
  geoResolution: Props['geoResolution'],
): {nodesPerDemeAll: DemeNodes, nodesPerDemeVisible: DemeNodes} {
  const nodesPerDemeAll = {};
  const nodesPerDemeVisible = {};
  nodes.forEach((n, i) => {
    if (n.children) return; /* only consider terminal nodes */
    const location = getTraitFromNode(n, geoResolution);
    if (!location) return; /* ignore undefined locations */
    if (!nodesPerDemeAll[location]) nodesPerDemeAll[location]=[];
    nodesPerDemeAll[location].push(n);
    if (!nodesPerDemeVisible[location]) nodesPerDemeVisible[location]=[];
    if (visibility[i] !== NODE_NOT_VISIBLE) {
      nodesPerDemeVisible[location].push(n);
    }
  });
  return {nodesPerDemeAll, nodesPerDemeVisible};
}

function setInitialCoordinates(
  demes: Demes,
  width: number,
  height: number
): void {
  const xOffset = width/2, yOffset = height/2;
  const xScale = width*0.4, yScale = height*0.4;
  const n = demes.size;
  let i = 0;

  const orderedDemes = Array.from(demes.values()).sort((a, b) => {
    if (a.count > b.count) return 1
    if (a.count < b.count) return -1
    return 0
  })

  for (const deme of orderedDemes) {
    const theta = Math.PI * 3 * i / n;
    const r = i / n;
    i++;
    // polar to cartesian
    deme.x = xOffset + r*Math.cos(theta)*xScale;
    deme.y = yOffset + r*Math.sin(theta)*yScale;
  }
}


/**
 * Return a list of transmission events. These are conditional
 * only on the current deme selection key.
 */
function collectTransmissionEvents(
  nodes: Props['nodes'],
  geoResolution: Props['geoResolution'],
): [TransmissionEvent[], TransmissionCounts] {
  const transmissionCounts: TransmissionCounts = new Map();
  const events: TransmissionEvent[] = [];
  /* loop through (phylogeny) nodes and compare each with its own children to get A->B transmissions */
  nodes.forEach((n) => {
    const originName = getTraitFromNode(n, geoResolution);
    n.children?.forEach((child) => {
      const destinationName = getTraitFromNode(child, geoResolution);
      if (originName && destinationName && originName !== destinationName) {
        const demePair = `${originName}__${destinationName}`;
        const occurrences = (transmissionCounts.get(demePair) || 0) + 1;
        transmissionCounts.set(demePair, occurrences);
        events.push({
          originName,
          destinationName,
          originIdx: n.arrayIdx,
          destinationIdx: child.arrayIdx,
          nForThisPair: occurrences,
        })
      }
    })
  })
  return [events, transmissionCounts]
}

function computeTransmissionCurves(
  events: TransmissionEvent[],
  demes: Demes,
  nodes: Props['nodes'],
): void {
  for (const event of events) {
    const originDeme = demes.get(event.originName);
    const destinationDeme = demes.get(event.destinationName);
    const bezierCurve = bezier(
      {x: originDeme.x, y: originDeme.y},
      {x: destinationDeme.x, y: destinationDeme.y},
      event.nForThisPair
    );
    /* set up interpolator with origin and destination numdates */
    // TODO XXX - what about div trees?
    const originNumDate = getTraitFromNode(nodes[event.originIdx], "num_date");
    const destinationNumDate = getTraitFromNode(nodes[event.destinationIdx], "num_date");
    const interpolator = interpolateNumber(originNumDate, destinationNumDate);
    /* make a bezierDates array as long as bezierCurve */
    const bezierDates = bezierCurve.map((_d, i) => {
      return interpolator(i / (bezierCurve.length - 1));
    });

    event.originNumDate = originNumDate;
    event.destinationNumDate = destinationNumDate;
    event.bezierCurve = bezierCurve;
    event.bezierDates = bezierDates;
  }
}

/**
 * Create d3 selections representing groups in the SVG to hold demes, transmissions etc.
 */
function setUpSvg(svgDomRef: SVGSVGElement): StateSpace['groups'] {
  const svg = select(svgDomRef);
  return {
    transmissions: svg.append("g").attr("class", "transmissions"),
    demes: svg.append("g").attr("class", "nodes"),
    labels: svg.append("g").attr("class", "labels")
  };
}

/**
 * Given a SVG group selection (`g`), render the demes (the "circles"). Each deme is always
 * made up of arcs (i.e. a deme is always a pie chart) to simplify the code.
 */
function renderDemes(
  {g, demes}:
  {g: SelectionGroup, demes: Deme[]}
): SelectionArcs {
  g.selectAll("*").remove();
  const generateArc = arc();
  return g.selectAll("circle")
    .data(demes)
    .enter()
      .append("g")
      .attr("class", "pie")
      .selectAll("arc")
      .data((deme) => deme.arcs)
      .enter()
        .append("path")
        .attr("d", generateArc)
        .style("stroke", "none")
        .style("fill-opacity", 0.65)
        .style("fill", (d) => d.color)
        .style("pointer-events", "all")
        .attr("transform", (d) => `translate(${d.parent.x},${d.parent.y})`)
}

/**
 * Given a SVG group selection (`g`), render labels corresponding
 * to the `demes`. You could imagine a force to find the best
 * positioning taking into account surrounding demes & lines, but
 * for now it's overkill.
 */
function renderLabels(
  {g, demes, width}:
  {g: SelectionGroup, demes: Deme[], width: number}
): SelectionLabels {
  g.selectAll("*").remove();
  return g.selectAll("text")
    .data(demes)
    .enter()
      .append("text")
      .call((sel) => setLabelPosition(sel, width))
      .style("pointer-events", "none")
      .text((d) => d.name)
      .attr("class", "tipLabel")
      .style("font-size", "12px");
}

/**
 * label positioning fn intended to be called by d3's `call` method
 */
function setLabelPosition(
  selection: SelectionLabels,
  svgWidth: number
):void {
  selection
    .attr("x", (d) => d.x*2<svgWidth ? d.x+10 : d.x-10)
    .attr("y", (d) => d.y)
    .attr("text-anchor", (d) => d.x*2<svgWidth ? "start" : "end");
}

/**
 * Given a SVG group selection (`g`), render the transmissions ("curved lines").
 * Note that it is during rendering that we decide if a line is visible, or what segements of
 * the line are visibility according to the current temporal slice.
 */
function renderTransmissions(
  {g, transmissions, demes, visibility, dateMinNumeric, dateMaxNumeric}:
  {g: SelectionGroup, transmissions: TransmissionEvent[], demes: Demes, visibility: Props['visibility'], dateMinNumeric: number, dateMaxNumeric: number}
): SelectionTransmissions {
  g.selectAll("*").remove();
  return g.selectAll("transmissions")
    .data(transmissions)
    .enter()
      .append("path") /* instead of appending a geodesic path from the leaflet plugin data, we now draw a line directly between two points */
        .attr("d", (d) => renderBezier(d, demes, visibility, dateMinNumeric, dateMaxNumeric))
        .attr("fill", "none")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-linecap", "round")
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 2);
}

/**
 * Produce a SVG path ("d" attr) from a datum given temporal & visibility constraints
 */
function renderBezier(d: TransmissionEvent, demes: Demes, visibility: Props['visibility'], numDateMin: number, numDateMax: number): string {
  const originDeme = demes.get(d.originName);
  const destinationDeme = demes.get(d.destinationName);

  return pathStringGenerator(
    extractLineSegmentForAnimationEffect(
      numDateMin,
      numDateMax,
      {x: originDeme.x, y: originDeme.y},
      {x: destinationDeme.x, y: destinationDeme.y},
      d.originNumDate,
      d.destinationNumDate,
      visibility[d.destinationIdx] !== NODE_NOT_VISIBLE ? "visible" : "hidden",
      d.bezierCurve,
      d.bezierDates
    )
  );
}

/**
 * When props change, the data structures behind the data visualisation, and the d3-rendered
 * visualisation itself, must change. For performance and usability reasons, we don't want
 * to recompute & rerender everything on every prop change. This function identifies how we
 * should update the data structures & viz.
 */
function compareProps(oldProps: Props, newProps: Props): Recompute {
  const recompute: Recompute = {
    everything: false,
    colors: false,
    visibility: false,
  };
  if (oldProps.geoResolution !== newProps.geoResolution) {
    recompute.everything = true;
  } else if (oldProps.colorBy !== newProps.colorBy) {
    recompute.colors = true;
  } else {
    recompute.visibility = true;
  }
  return recompute;
}


/**
 * Given an existing d3 selection, whose bound data has been updated in-place,
 * update all of the attrs which may have changed. See `updateArcData`
 * for the properties of arcs which may have changed.
 */
function renderUpdatesToExistingDemes(
  {selection}: {selection: SelectionArcs}
): SelectionArcs {
  const generateArc = arc();
  return selection
    .attr("d", generateArc)
    .style("fill", (d) => d.color);
}


const mapStateToProps = (state: any): Omit<Props, 'width' | 'height' | 'legend' | 'dispatch' | 't'> => {
  return {
    nodes: state.tree.nodes,
    nodeColors: state.tree.nodeColors,
    visibility: state.tree.visibility,
    geoResolution: state.controls.geoResolution,
    dateMinNumeric: state.controls.dateMinNumeric,
    dateMaxNumeric: state.controls.dateMaxNumeric,
    colorBy: state.controls.colorScale.colorBy,
    continuousColorScale: state.controls.colorScale.continuous,
    legendValues: state.controls.colorScale.legendValues,
  };
};

const ConnectedStateSpace = connect(mapStateToProps)(StateSpace);
const WithTranslation = withTranslation()(ConnectedStateSpace);
export default WithTranslation;