/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import { transition } from "d3-transition";
import { easeLinear } from "d3-ease";
import { timerStart, timerEnd } from "../../../util/perf";
import { animationInterpolationDuration } from "../../../util/globals";
import { guessAreMutationsPerSite } from "./helpers";
import { numericToDateObject, calendarToNumeric, getPreviousDate, getNextDate, dateToString, prettifyDate } from "../../../util/dateHelpers";

export const hideGrid = function hideGrid() {
  if ("majorGrid" in this.groups) {
    this.groups.majorGrid.selectAll("*").style('visibility', 'hidden');
  }
  if ("minorGrid" in this.groups) {
    this.groups.minorGrid.selectAll("*").style('visibility', 'hidden');
  }
  if ("gridText" in this.groups) {
    this.groups.gridText.selectAll("*").style('visibility', 'hidden');
  }
  if ("axisText" in this.groups) {
    this.groups.axisText.selectAll("*").style('visibility', 'hidden');
  }
};

const addSVGGroupsIfNeeded = (groups, svg) => {
  if (!("temporalWindow" in groups)) {
    groups.temporalWindow = svg.append("g").attr("id", "temporalWindow");

    // Technically rects aren't groups, but store them to avoid searching for them on each "showTemporalSlice" render.
    groups.temporalWindowStart = groups.temporalWindow.append('rect')
      .attr('class', 'temporalWindowStart');
    groups.temporalWindowEnd = groups.temporalWindow.append('rect')
      .attr('class', 'temporalWindowEnd');
  }
  if (!("majorGrid" in groups)) {
    groups.majorGrid = svg.append("g").attr("id", "majorGrid");
  }
  if (!("minorGrid" in groups)) {
    groups.minorGrid = svg.append("g").attr("id", "minorGrid");
  }
  if (!("gridText" in groups)) {
    groups.gridText = svg.append("g").attr("id", "gridText");
  }
  if (!("axisText" in groups)) {
    groups.axisText = svg.append("g").attr("id", "axisText");
  }
};

/**
 * Create the separation between major & minor grid lines for numeric scales.
 * @param {numeric} range e.g. amount of divergence (subs/site/year _or_ num mutations) present in current view
 * @param {numeric} minorTicks num of minor ticks desired between each major step
 * @returns {object}
 *  - property `majorStep` {numeric}: space between major x-axis gridlines (measure of divergence)
 *  - property `minorStep` {numeric}: space between minor x-axis gridlines (measure of divergence)
 */
const calculateNumericGridSeparation = (range, minorTicks) => {
  /* make an informed guess of the step size to start with.
  E.g. 0.07 => step of 0.01, 70 => step size of 10 */
  const logRange = Math.floor(Math.log10(range));
  let majorStep = Math.pow(10, logRange); // eslint-disable-line no-restricted-properties
  if (range/majorStep < 2) { // if step > 0.5*range then make more fine-grained steps
    majorStep /= 5;
  } else if (range/majorStep <5) { // if step > 0.2*range then make more fine grained steps
    majorStep /= 2;
  }
  let numMinorTicks = minorTicks;
  if (majorStep===5 || majorStep===10) {
    numMinorTicks = 5;
  }
  const minorStep = majorStep / numMinorTicks;
  return {majorStep, minorStep};
};

/**
 * Return `{majorGridPoints, minorGridPoints}` for numeric scales (e.g. divergence)
 */
const computeNumericGridPoints = (minVal, maxVal, layout, nMinorTicks, axis) => {
  const majorGridPoints = [];
  const minorGridPoints = [];

  /* step is the amount (same units of minVal, maxVal) of separation between major grid lines */
  const {majorStep, minorStep} = calculateNumericGridSeparation(maxVal-minVal, nMinorTicks);

  const gridMin = Math.floor(minVal/majorStep)*majorStep;
  const minVis = layout==="radial" ? minVal : gridMin;
  const maxVis = maxVal;

  for (let ii = 0; ii <= (maxVal - gridMin)/majorStep+3; ii++) {
    const pos = gridMin + majorStep*ii;
    majorGridPoints.push({
      position: pos,
      name: pos.toFixed(Math.max(0, -Math.floor(Math.log10(majorStep)))),
      visibility: ((pos<minVis) || (pos>maxVis)) ? "hidden" : "visible",
      axis
    });
    for (let minorPos=pos+minorStep; minorPos<(pos+majorStep) && minorPos<maxVal; minorPos+=minorStep) {
      minorGridPoints.push({
        position: minorPos,
        visibility: ((minorPos<minVis) || (minorPos>maxVis+minorStep)) ? "hidden" : "visible",
        axis
      });
    }
  }
  return {majorGridPoints, minorGridPoints};
};

/**
 * Calculate the spacing between Major and Minor grid points. This is computed via a
 * heuristic which takes into account (a) the available space (pixels) and (b) the
 * time range to display.
 * As major grid lines are (usually) labelled, we wish these to represent a consistent
 * spacing of time, e.g. "3 months" or "7 years". Note that this means the actual time between
 * grids may be very slightly different, as months, years etc can have different numbers of days.
 * @param {numeric} timeRange numeric date range in current view (between right-most tip & left-most node)
 * @param {numeric} pxAvailable number of pixels available
 * @returns {object}
 */
const calculateTemporalGridSeperation = (timeRange, pxAvailable) => {
  const [majorStep, minorStep] = [{unit: "DAY", n: 1}, {unit: "DAY", n: 0}];
  const minPxBetweenMajorGrid = (pxAvailable < 1000 ? 130 : 180);
  const timeBetweenMajorGrids = timeRange/(Math.floor(pxAvailable / minPxBetweenMajorGrid));
  const levels = {
    CENTURY: {t: 100, max: undefined},
    DECADE: {t: 10, max: 5}, // i.e. spacing of 50 years is ok, but 60 jumps up to 100y spacing
    FIVEYEAR: {t: 5, max: 1},
    YEAR: {t: 1, max: 3}, // 4 year spacing not allowed (will use 5 year instead)
    MONTH: {t: 1/12, max: 6}, // 7 month spacing not allowed
    WEEK: {t: 1/52, max: 1}, // 2 week spacing not allowed - prefer months
    DAY: {t: 1/365, max: 3}
  };
  const levelsKeys = Object.keys(levels);

  /* calculate the best unit of time to fit into the allowed range */
  majorStep.unit = "DAY"; // fallback value
  for (let i=0; i<levelsKeys.length-1; i++) {
    if (timeBetweenMajorGrids > levels[levelsKeys[i]].t) {
      majorStep.unit = levelsKeys[i];
      break;
    }
  }
  /* how many of those "units" should ideally fit into each major grid separation? */
  majorStep.n = Math.floor(timeBetweenMajorGrids/levels[majorStep.unit].t) || 1;
  /* if the numer of units (per major grid) is above the allowed max, use a bigger unit */
  if (levels[majorStep.unit].max && majorStep.n > levels[majorStep.unit].max) {
    majorStep.unit = levelsKeys[levelsKeys.indexOf(majorStep.unit)-1];
    majorStep.n = Math.floor(timeBetweenMajorGrids/levels[majorStep.unit].t) || 1;
  }

  /* Calculate best unit of time for the minor grid spacing */
  if (majorStep.n > 1 || majorStep.unit === "DAY") {
    minorStep.unit = majorStep.unit;
  } else {
    minorStep.unit = levelsKeys[levelsKeys.indexOf(majorStep.unit)+1];
  }
  /* how many of those "units" should form the separation of the minor grids? */
  const majorSpacing = majorStep.n * levels[majorStep.unit].t;
  minorStep.n = Math.ceil(levels[minorStep.unit].t/majorSpacing);

  return {majorStep, minorStep};
};


/**
 * Compute the major & minor temporal grid points for display.
 * @param {numeric} numDateMin numeric date of minimum value in view
 * @param {numeric} numDateMax numeric date of maximum value in view
 * @param {numeric} pxAvailable pixels in which to display the date range (xmin, xmax)
 * @param {string} axis "x" or "y"
 * @returns {Object} properties: `majorGridPoints`, `minorGridPoints`
 */
export const computeTemporalGridPoints = (numDateMin, numDateMax, pxAvailable, axis) => {
  const [majorGridPoints, minorGridPoints] = [[], []];
  const {majorStep, minorStep} = calculateTemporalGridSeperation(numDateMax-numDateMin, Math.abs(pxAvailable));

  /* Major Grid Points */
  const overallStopDate = getNextDate(majorStep.unit, numericToDateObject(numDateMax));
  let proposedDate = getPreviousDate(majorStep.unit, numericToDateObject(numDateMin));
  while (proposedDate < overallStopDate) {
    majorGridPoints.push({
      date: proposedDate,
      position: calendarToNumeric(dateToString(proposedDate)),
      name: prettifyDate(majorStep.unit, proposedDate),
      visibility: 'visible',
      axis
    });
    for (let i=0; i<majorStep.n; i++) {
      proposedDate = getNextDate(majorStep.unit, proposedDate);
    }
  }


  /* Minor Grid Points between each pair of major grid points */
  if (minorStep.n) {
    majorGridPoints.forEach((majorGridPoint, majorIdx) => {
      proposedDate = getNextDate(minorStep.unit, majorGridPoint.date);
      for (let i=0; i<minorStep.n-1; i++) {
        proposedDate = getNextDate(minorStep.unit, proposedDate);
      }
      const stopDate = majorIdx===majorGridPoints.length-1 ? overallStopDate : majorGridPoints[majorIdx+1].date;
      while (proposedDate < stopDate) {
        minorGridPoints.push({
          position: calendarToNumeric(dateToString(proposedDate)),
          visibility: 'visible',
          axis
        });
        for (let i=0; i<minorStep.n; i++) {
          proposedDate = getNextDate(minorStep.unit, proposedDate);
        }
      }
    });
  }
  return {majorGridPoints, minorGridPoints};
};

/**
 * add a grid to the svg
 * @param {layout}
 */
export const addGrid = function addGrid() {
  const layout = this.layout;
  addSVGGroupsIfNeeded(this.groups, this.svg);
  if (layout==="unrooted") return;
  timerStart("addGrid");

  /* [xmin, xmax] is the domain of the x-axis (rectangular & clock layouts) or polar-axis (radial layouts)
     [ymin, ymax] for rectangular layouts is [1, n] where n is the number of tips (in the view)
                      clock layouts is [min_divergence_in_view, max_divergence_in_view]
                      radial layouts is the radial domain (negative means "left of north") measured in radians */
  const ymin = min(this.yScale.domain());
  const ymax = max(this.yScale.domain());
  const xmin = layout==="radial" ? this.nodes[0].depth : this.xScale.domain()[0];
  const xmax = layout==="radial" ?
    xmin + max([this.xScale.domain()[1], this.yScale.domain()[1], -this.xScale.domain()[0], -this.yScale.domain()[0]]) :
    this.xScale.domain()[1];
  const xAxisPixels = this.xScale.range()[1] - this.xScale.range()[0];

  /* determine grid points (i.e. on the x/polar axis where lines/circles will be drawn through)
  Major grid points are thicker and have text
  Minor grid points have no text */
  let xGridPoints;
  if (
    (this.layout==="scatter" && this.scatterVariables.x==="num_date") ||
    this.layout==="clock" ||
    (this.layout!=="scatter" && this.distance==="num_date")
  ) {
    xGridPoints = computeTemporalGridPoints(xmin, xmax, xAxisPixels, "x");
  } else if (this.layout==="scatter" && !this.scatterVariables.xContinuous) {
    xGridPoints = {
      majorGridPoints: this.xScale.domain().map((name) => ({
        name, visibility: "visible", axis: "x", position: name
      })),
      minorGridPoints: []
    };
  } else {
    xGridPoints = computeNumericGridPoints(xmin, xmax, layout, this.params.minorTicks, "x");
  }
  const {majorGridPoints, minorGridPoints} = xGridPoints;

  /* HOF, which returns the fn which constructs the SVG path string
  to draw the axis lines (circles for radial trees).
  "gridPoint" is an element from majorGridPoints or minorGridPoints */
  const gridline = (xScale, yScale, layoutShadow) => (gridPoint) => {
    let svgPath="";
    if (gridPoint.axis === "x") {
      if (layoutShadow==="rect" || layoutShadow==="clock" || layoutShadow==="scatter") {
        const xPos = xScale(gridPoint.position);
        svgPath = 'M'+xPos.toString() +
          " " +
          yScale.range()[1].toString() +
          " L " +
          xPos.toString() +
          " " +
          yScale.range()[0].toString();
      } else if (layoutShadow==="radial") {
        const xPos = xScale(gridPoint.position-xmin);
        svgPath = 'M '+xPos.toString() +
          "  " +
          yScale(0).toString() +
          " A " +
          (xPos - xScale(0)).toString() +
          " " +
          (yScale(gridPoint.position) - yScale(xmin)).toString() +
          " 0 1 0 " +
          xPos.toString() +
          " " +
          (yScale(0)+0.001).toString();
      }
    } else if (gridPoint.axis === "y") {
      const yPos = yScale(gridPoint.position);
      svgPath = `M${xScale(xmin) + 20} ${yPos} L ${xScale(xmax)} ${yPos}`;
    }
    return svgPath;
  };

  /* add text labels to the major grid points */

  /* HOF which returns a function which calculates the x position of text labels */
  const xTextPos = (xScale, layoutShadow) => (gridPoint) => {
    if (gridPoint.axis === "x") { // "normal" labels on the x-axis / polar-axis
      return layoutShadow==="radial" ? xScale(0) : xScale(gridPoint.position);
    }
    // clock layout y positions (which display divergence)
    return xScale.range()[0]-15;
  };

  /* same as xTextPos HOF, but for y-values */
  const yTextPos = (yScale, layoutShadow) => (gridPoint) => {
    if (gridPoint.axis === "x") {
      return layoutShadow === "radial" ? yScale(gridPoint.position-xmin)-5 : yScale.range()[1] + 18;
    }
    return yScale(gridPoint.position);
  };

  /* HOF which returns a function which calculates the text anchor string */
  const textAnchor = (layoutShadow) => (gridPoint) => {
    if (gridPoint.axis === "x") {
      return layoutShadow === "radial" ? "end" : "middle";
    }
    return "start";
  };

  /* for scatterplot-like layouts, add grid points for the y-axis (rendered as horizontal lines) */
  if (this.layout==="clock" || this.layout==="scatter") {
    if (this.layout==="scatter" && this.scatterVariables.y==="num_date") {
      const yAxisPixels = this.yScale.range()[1] - this.yScale.range()[0];
      const temporalGrid = computeTemporalGridPoints(ymin, ymax, yAxisPixels, "y");
      majorGridPoints.push(...temporalGrid.majorGridPoints);
    } else if (this.layout==="scatter" && !this.scatterVariables.yContinuous) {
      majorGridPoints.push(...this.yScale.domain().map((name) => ({
        name, visibility: "visible", axis: "y", position: name
      })));
    } else {
      const numericGrid = computeNumericGridPoints(ymin, ymax, layout, 1, "y");
      majorGridPoints.push(...numericGrid.majorGridPoints);
    }
  }

  /* Add grid lines (horizontal & vertical) to the DOM + text for major lines
  Note that the groups were created the first time this function was called */
  // add major grid to svg
  this.groups.majorGrid.selectAll("*").remove();
  this.groups.majorGrid
    .selectAll('.majorGrid')
    .data(majorGridPoints)
    .enter()
      .append("path")
        .attr("d", gridline(this.xScale, this.yScale, layout))
        .attr("class", "majorGrid")
        .style("fill", "none")
        .style("visibility", (d) => d.visibility)
        .style("stroke", this.params.majorGridStroke)
        .style("stroke-width", this.params.majorGridWidth);
  // add minor grid to SVG
  this.groups.minorGrid.selectAll("*").remove();
  this.svg.selectAll(".minorGrid").remove();
  this.groups.minorGrid
    .selectAll('.minorGrid')
    .data(minorGridPoints)
    .enter()
      .append("path")
        .attr("d", gridline(this.xScale, this.yScale, layout))
        .attr("class", "minorGrid")
        .style("fill", "none")
        .style("visibility", (d) => d.visibility)
        .style("stroke", this.params.minorGridStroke)
        .style("stroke-width", this.params.minorGridWidth);
  /* draw the text labels for majorGridPoints */
  this.groups.gridText.selectAll("*").remove();
  this.svg.selectAll(".gridText").remove();
  this.groups.gridText
    .selectAll('.gridText')
    .data(majorGridPoints)
    .enter()
      .append("text")
        .text((d) => d.name)
        .attr("class", "gridText")
        .style("font-size", this.params.tickLabelSize)
        .style("font-family", this.params.fontFamily)
        .style("fill", this.params.tickLabelFill)
        .style("text-anchor", textAnchor(layout))
        .style("visibility", (d) => d.visibility)
        .attr("x", xTextPos(this.xScale, layout))
        .attr("y", yTextPos(this.yScale, layout));

  /* add axis labels */
  this.groups.axisText.selectAll("*").remove();
  this.svg.selectAll(".axisText").remove();
  let yAxisLabel, xAxisLabel; // not all views define axes labels. `undefined` => don't draw.
  if (layout==="clock") {
    xAxisLabel = "Date";
    yAxisLabel = guessAreMutationsPerSite(this.yScale) ? "Divergence" : "Mutations";
  } else if (layout==="scatter") {
    xAxisLabel = this.scatterVariables.xLabel;
    if (xAxisLabel==="div") xAxisLabel = guessAreMutationsPerSite(this.xScale) ? "Divergence" : "Mutations";
    yAxisLabel = this.scatterVariables.yLabel;
    if (yAxisLabel==="div") yAxisLabel = guessAreMutationsPerSite(this.yScale) ? "Divergence" : "Mutations";
  } else if (layout==="rect") {
    xAxisLabel = this.distance === "num_date" ? "Date" :
      guessAreMutationsPerSite(this.xScale) ? "Divergence" : "Mutations";
  }
  if (xAxisLabel) {
    this.groups.axisText
      .append("text")
        .text(xAxisLabel)
        .attr("class", "gridText")
        .style("font-size", this.params.tickLabelSize)
        .style("font-family", this.params.fontFamily)
        .style("fill", this.params.tickLabelFill)
        .style("text-anchor", "middle")
        .attr("x", Math.abs(this.xScale.range()[1]-this.xScale.range()[0]) / 2)
        .attr("y", this.yScale.range()[1] + this.params.margins.bottom - 6);
  }
  if (yAxisLabel) {
    this.groups.axisText
      .append("text")
        .text(yAxisLabel)
        .attr("class", "gridText")
        .style("font-size", this.params.tickLabelSize)
        .style("font-family", this.params.fontFamily)
        .style("fill", this.params.tickLabelFill)
        .style("text-anchor", "middle")
        .attr('transform', 'translate(' + 10 + ',' + (this.yScale.range()[1] / 2) + ') rotate(-90)');
  }

  this.grid=true;
  timerEnd("addGrid");
};

export const hideTemporalSlice = function hideTemporalSlice() {
  this.groups.temporalWindowStart.attr('opacity', 0);
  this.groups.temporalWindowEnd.attr('opacity', 0);
};

// d3-transition to ensure both rectangles move at the same rate
export const temporalWindowTransition = transition('temporalWindowTransition')
  .duration(animationInterpolationDuration)
  .ease(easeLinear); // the underlying animation uses linear interpolation, let's override the default easeCubic

/**
 * add background grey rectangles to demarcate the temporal slice
 */
export const showTemporalSlice = function showTemporalSlice() {
  if (this.layout !== "rect" || this.distance !== "num_date") {
    this.hideTemporalSlice();
    return;
  }

  const xWindow = [this.xScale(this.dateRange[0]), this.xScale(this.dateRange[1])];
  const height = this.yScale.range()[1];
  const fill = "#EEE"; // this.params.minorGridStroke
  const minPxThreshold = 30;
  const rightHandTree = this.params.orientation[0] === -1;
  const rootXPos = this.xScale(this.nodes[0].x);
  let totalWidth = rightHandTree ? this.xScale.range()[0] : this.xScale.range()[1];
  totalWidth += (this.params.margins.left + this.params.margins.right);

  /* the gray region between the root (ish) and the minimum date */
  if (Math.abs(xWindow[0]-rootXPos) > minPxThreshold) { /* don't render anything less than this num of px */
    let width_startRegion = xWindow[0];
    let translateX_startRegion = 0;

    // With right hand tree, the coordinate system flips (right to left)
    if (rightHandTree) {
      width_startRegion = totalWidth - xWindow[0];
      translateX_startRegion = xWindow[0];
    }

    const wasStartRegionVisible = this.groups.temporalWindowStart.attr('opacity') === '1';

    this.groups.temporalWindowStart
      .attr('opacity', 1)
      .attr("height", height)
      .attr("transform", `translate(${translateX_startRegion},0)`)
      .attr("fill", fill);

    // Only apply animation if rectangle was already visible in the previous frame.
    if (wasStartRegionVisible) {
      this.groups.temporalWindowStart.transition('temporalWindowTransition')
        .attr("width", width_startRegion);
    } else {
      this.groups.temporalWindowStart
        .attr("width", width_startRegion);
    }
  } else {
    this.groups.temporalWindowStart.attr('opacity', 0);
  }

  /* the gray region between the maximum selected date and the last tip */
  let xStart_endRegion = xWindow[1]; // starting X coordinate of the "end" rectangle
  let width_endRegion = totalWidth - this.params.margins.right - xWindow[1];

  let transform_endRegion = `translate(${totalWidth - this.params.margins.right},0) scale(-1,1)`;
  // With a right hand tree, the coordinate system flips (right to left)
  if (rightHandTree) {
    xStart_endRegion = this.params.margins.right;
    width_endRegion = xWindow[1] - this.params.margins.right;
    transform_endRegion = `translate(${xStart_endRegion},0)`;
  }

  if (width_endRegion > minPxThreshold) {
    const wasEndRegionVisible = this.groups.temporalWindowEnd.attr('opacity') === '1';

    this.groups.temporalWindowEnd
      .attr('opacity', 1)
      .attr("height", height)
      .attr("fill", fill)
      .attr("transform", transform_endRegion);


    // Only apply animation if rectangle was already visible in the previous frame.
    // Unlike the startingRegion, this panel cannot depend
    // on letting the SVG boundaries clip part of the rectangle.
    // As a result, we'll have to animate width instead of position
    // If performance becomes an issue, try add a custom clip-path with
    // a fixed-width region instead.
    if (wasEndRegionVisible) {
      this.groups.temporalWindowEnd
        .transition('temporalWindowTransition')
        .attr("width", width_endRegion);
    } else {
      this.groups.temporalWindowEnd
        .attr("width", width_endRegion);
    }
  } else {
    this.groups.temporalWindowEnd.attr('opacity', 0);
  }
};
