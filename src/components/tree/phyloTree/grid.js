/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import { timerStart, timerEnd } from "../../../util/perf";
import { months } from "../../../util/globals";
import { numericToCalendar } from "../../../util/dateHelpers";

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
};

const addSVGGroupsIfNeeded = (groups, svg) => {
  if (!("temporalWindow" in groups)) {
    groups.temporalWindow = svg.append("g").attr("id", "temporalWindow");
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
};

/**
 * Create the major-grid-line separation for divergence scales.
 * @param {numeric} range num years or amount of divergence present in current view
 * @param {numeric} minorTicks num of minor ticks desired between each major step
 * @returns {array} [0] {numeric} space between major x-axis gridlines (measure of divergence)
 *                  [1] {numeric} space between minor x-axis gridlines (measure of divergence)
 */
const calculateMajorGridSeperationForDivergence = (range, minorTicks) => {
  /* make an informed guess of the step size to start with.
  E.g. 0.07 => step of 0.01, 70 => step size of 10 */
  const logRange = Math.floor(Math.log10(range));
  let step = Math.pow(10, logRange); // eslint-disable-line no-restricted-properties

  if (range/step < 2) { // if step > 0.5*range then make more fine-grained steps
    step /= 5;
  } else if (range/step <5) { // if step > 0.2*range then make more fine grained steps
    step /= 2;
  }

  let numMinorTicks = minorTicks;
  if (step===5 || step===10) {
    numMinorTicks = 5;
  }
  const minorStep = step / numMinorTicks;

  return [step, minorStep];
};

/**
 * Create the major-grid-line separation for temporal view.
 * @param {numeric} timeRange num years in current view
 * @param {numeric} pxAvailable number of pixels available for the x axis
 * @returns {array} [0] {numeric} space between major x-axis gridlines (measure of time)
 *                  [1] {numeric} space between minor x-axis gridlines (measure of time)
 */
const calculateMajorGridSeperationForTime = (timeRange, pxAvailable) => {

  const rountToNearest = (n, p) => Math.ceil(n/p)*p;

  const getMinorSpacing = (majorTimeStep) => {
    const timesToTry = [1/365.25, 1/52, 1/12, 1, 10, 100, 1000];
    for (const t of timesToTry) {
      const n = majorTimeStep / t;
      // max number we allow is 12 (so that a major grid of a year can have minor grids of a month)
      if (n <= 12) return t;
    }
    return majorTimeStep; // fallthrough. Only happens for _very_ large trees
  };

  /* in general, we find that 1 major point for every ~100px works well
  for wider displays we shift up to 150px then 200px */
  const nSteps = Math.floor(pxAvailable / (pxAvailable < 1200 ? 100 : 150)) || 1;

  let majorTimeStep = timeRange / nSteps;

  /* For time views, it's nicer if the spacing is meaningful.
  There's probably a better way to do this than cascading through levels */
  if (majorTimeStep > 100) {
    majorTimeStep = rountToNearest(majorTimeStep, 100);
  } else if (majorTimeStep > 10) {
    majorTimeStep = rountToNearest(majorTimeStep, 10);
  } else if (majorTimeStep > 1) {
    majorTimeStep = rountToNearest(majorTimeStep, 1);
  } else if (majorTimeStep > (1/12)) {
    /* each step is longer than a month, but shorter than a year */
    majorTimeStep = rountToNearest(majorTimeStep, 1/12);
  } else if (majorTimeStep > (1/52)) {
    /* each step is longer than a week, but shorter than a month */
    majorTimeStep = rountToNearest(majorTimeStep, 1/52);
  } else if (majorTimeStep > (1/365.25)) {
    /* each time step is longer than a day, but shorter than a week */
    majorTimeStep = rountToNearest(majorTimeStep, 1/365.25);
  } else {
    majorTimeStep = 1/365.25;
  }
  const minorTimeStep = getMinorSpacing(majorTimeStep);
  return [majorTimeStep, minorTimeStep];
};

/**
 * Format the date to be displayed below major gridlines
 * @param {numeric} step num years between each major gridline. Can be decimal.
 * @param {numeric} numDate date in decimal format
 * @returns {string} date to be displayed below major gridline
 */
const createDisplayDate = (step, numDate) => {
  if (step >= 1) {
    return numDate.toFixed(Math.max(0, -Math.floor(Math.log10(step))));
  }
  const [year, month, day] = numericToCalendar(numDate).split("-");
  if (step >= 1/12) {
    return `${year}-${months[month]}`;
  }
  return `${year}-${months[month]}-${day}`;
};


const computeXGridPoints = (xmin, xmax, layout, distanceMeasure, minorTicks, pxAvailable) => {
  const majorGridPoints = [];
  const minorGridPoints = [];

  /* step is the amount (same units of xmax, xmin) of seperation between major grid lines */
  const [step, minorStep] = distanceMeasure === "num_date" ?
    calculateMajorGridSeperationForTime(xmax-xmin, Math.abs(pxAvailable)) :
    calculateMajorGridSeperationForDivergence(xmax-xmin, minorTicks);
  const gridMin = Math.floor(xmin/step)*step;
  const minVis = layout==="radial" ? xmin : gridMin;
  const maxVis = xmax;

  for (let ii = 0; ii <= (xmax - gridMin)/step+3; ii++) {
    const pos = gridMin + step*ii;
    majorGridPoints.push({
      position: pos,
      name: distanceMeasure === "num_date" ?
        createDisplayDate(step, pos) :
        pos.toFixed(Math.max(0, -Math.floor(Math.log10(step)))),
      visibility: ((pos<minVis) || (pos>maxVis)) ? "hidden" : "visible",
      axis: "x"
    });
    for (let minorPos=pos+minorStep; minorPos<(pos+step) && minorPos<xmax; minorPos+=minorStep) {
      minorGridPoints.push({
        position: minorPos,
        visibility: ((minorPos<minVis) || (minorPos>maxVis+minorStep)) ? "hidden" : "visible",
        axis: "x"
      });
    }

  }
  return {majorGridPoints, minorGridPoints};
};

const computeYGridPoints = (ymin, ymax) => {
  const majorGridPoints = [];
  let yStep = 0;
  yStep = calculateMajorGridSeperationForDivergence(ymax-ymin)[0];
  const precisionY = Math.max(0, -Math.floor(Math.log10(yStep)));
  const gridYMin = Math.floor(ymin/yStep)*yStep;
  const maxYVis = ymax;
  const minYVis = gridYMin;
  for (let ii = 1; ii <= (ymax - gridYMin)/yStep+10; ii++) {
    const pos = gridYMin + yStep*ii;
    majorGridPoints.push({
      position: pos,
      name: pos.toFixed(precisionY),
      visibility: ((pos<minYVis)||(pos>maxYVis)) ? "hidden" : "visible",
      axis: "y"
    });
  }
  return {majorGridPoints};
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
  const {majorGridPoints, minorGridPoints} = computeXGridPoints(
    xmin, xmax, layout, this.distance, this.params.minorTicks, xAxisPixels
  );

  /* HOF, which returns the fn which constructs the SVG path string
  to draw the axis lines (circles for radial trees).
  "gridPoint" is an element from majorGridPoints or minorGridPoints */
  const gridline = (xScale, yScale, layoutShadow) => (gridPoint) => {
    let svgPath="";
    if (gridPoint.axis === "x") {
      if (layoutShadow==="rect" || layoutShadow==="clock") {
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

  /* for clock layouts, add y-points to the majorGridPoints array
  Note that these don't have lines drawn, only text */
  if (this.layout==="clock") {
    majorGridPoints.push(...computeYGridPoints(ymin, ymax).majorGridPoints);
  }

  /* D3 commands to add grid + text to the DOM
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

  this.grid=true;
  timerEnd("addGrid");
};


export const removeTemporalSlice = function removeTemporalSlice() {
  this.groups.temporalWindow.selectAll("*").remove();
};

/**
 * add background grey rectangles to demarcate the temporal slice
 */
export const addTemporalSlice = function addTemporalSlice() {
  this.removeTemporalSlice();
  if (this.layout !== "rect" || this.distance !== "num_date") return;

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
    this.groups.temporalWindow.append("rect")
      .attr("x", rightHandTree ? xWindow[0] : 0)
      .attr("width", rightHandTree ? totalWidth-xWindow[0]: xWindow[0])
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", fill);
  }

  /* the gray region between the maximum selected date and the last tip */
  const startingX = rightHandTree ? this.params.margins.right : xWindow[1];
  const rectWidth = rightHandTree ?
    xWindow[1]-this.params.margins.right :
    totalWidth-this.params.margins.right-xWindow[1];
  if (rectWidth > minPxThreshold) {
    this.groups.temporalWindow.append("rect")
      .attr("x", startingX)
      .attr("width", rectWidth)
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", fill);
  }
};
