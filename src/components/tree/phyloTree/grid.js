/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import { timerStart, timerEnd } from "../../../util/perf";

export const hideGrid = function hideGrid() {
  this.svg.selectAll(".majorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".minorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".gridTick").style('visibility', 'hidden');
};

const calculateMajorGridSeperation = (range) => {
  const logRange = Math.floor(Math.log10(range));
  let step = Math.pow(10, logRange); // eslint-disable-line no-restricted-properties
  if (range/step < 2) {
    step /= 5;
  } else if (range/step <5) {
    step /= 2;
  }
  return step;
};

/**
 * add a grid to the svg
 * @param {layout}
 */
export const addGrid = function addGrid(layout) {
  if (typeof layout==="undefined") {layout=this.layout;} // eslint-disable-line no-param-reassign
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

  /* step is the amount (same units of xmax, xmin) of seperation between major grid lines */
  const step = calculateMajorGridSeperation(xmax-xmin);

  /* determine grid points (i.e. on the x/polar axis where lines/circles will be drawn through)
  Major grid points are thicker and have text
  Minor grid points have no text */
  const majorGridPoints = [];
  const minorGridPoints = [];
  determineGridPoints: {
    const gridMin = Math.floor(xmin/step)*step;
    const minVis = layout==="radial" ? xmin : gridMin;
    const maxVis = xmax;
    for (let ii = 0; ii <= (xmax - gridMin)/step+3; ii++) {
      const pos = gridMin + step*ii;
      majorGridPoints.push([pos, ((pos<minVis)||(pos>maxVis))?"hidden":"visible", "x"]);
    }
    const numMinorTicks = this.distanceMeasure === "num_date" ? this.params.minorTicksTimeTree : this.params.minorTicks;
    const minorStep = step / numMinorTicks;
    for (let ii = 0; ii <= (xmax - gridMin)/minorStep+30; ii++) {
      const pos = gridMin + minorStep*ii;
      minorGridPoints.push([pos, ((pos<minVis)||(pos>maxVis+minorStep))?"hidden":"visible", "x"]);
    }
  }

  /* HOF, which returns the fn which constructs the SVG path string
  to draw the axis lines (circles for radial trees).
  "gridPoint" is an element from majorGridPoints or minorGridPoints */
  const gridline = (xScale, yScale, layoutShadow) => (gridPoint) => {
    let svgPath="";
    if (gridPoint[2] === "x") {
      if (layoutShadow==="rect" || layoutShadow==="clock") {
        const xPos = xScale(gridPoint[0]);
        svgPath = 'M'+xPos.toString() +
          " " +
          yScale.range()[1].toString() +
          " L " +
          xPos.toString() +
          " " +
          yScale.range()[0].toString();
      } else if (layoutShadow==="radial") {
        const xPos = xScale(gridPoint[0]-xmin);
        svgPath = 'M '+xPos.toString() +
          "  " +
          yScale(0).toString() +
          " A " +
          (xPos - xScale(0)).toString() +
          " " +
          (yScale(gridPoint[0]) - yScale(xmin)).toString() +
          " 0 1 0 " +
          xPos.toString() +
          " " +
          (yScale(0)+0.001).toString();
      }
    } else if (gridPoint[2] === "y") {
      const yPos = yScale(gridPoint[0]);
      svgPath = `M${xScale(xmin) + 20} ${yPos} L ${xScale(xmax)} ${yPos}`;
    }
    return svgPath;
  };

  /* add text labels to the major grid points */

  /* HOF which returns a function which calculates the x position of text labels */
  const xTextPos = (xScale, layoutShadow) => (gridPoint) => {
    if (gridPoint[2] === "x") { // "normal" labels on the x-axis / polar-axis
      return layoutShadow==="radial" ? xScale(0) : xScale(gridPoint[0]);
    }
    // clock layout y positions (which display divergence)
    return xScale.range()[0]-15;
  };

  /* same as xTextPos HOF, but for y-values */
  const yTextPos = (yScale, layoutShadow) => (gridPoint) => {
    if (gridPoint[2] === "x") {
      return layoutShadow === "radial" ? yScale(gridPoint[0]-xmin)-5 : yScale.range()[1] + 18;
    }
    return yScale(gridPoint[0]);
  };

  /* HOF which returns a function which calculates the text anchor string */
  const textAnchor = (layoutShadow) => (gridPoint) => {
    if (gridPoint[2] === "x") {
      return layoutShadow === "radial" ? "end" : "middle";
    }
    return "start";
  };

  /* for clock layouts, add y-points to the majorGridPoints array
  Note that these don't have lines drawn, only text */
  let yStep = 0;
  if (this.layout==="clock") {
    yStep = calculateMajorGridSeperation(ymax-ymin);
    const gridYMin = Math.floor(ymin/yStep)*yStep;
    const maxYVis = ymax;
    const minYVis = gridYMin;
    for (let ii = 1; ii <= (ymax - gridYMin)/yStep+10; ii++) {
      const pos = gridYMin + yStep*ii;
      majorGridPoints.push([pos, ((pos<minYVis)||(pos>maxYVis))?"hidden":"visible", "y"]);
    }
  }

  /* D3 commands to add grid + text to the DOM */

  // add major grid to svg
  const majorGrid = this.svg.selectAll('.majorGrid').data(majorGridPoints);
  majorGrid.exit().remove(); // EXIT
  majorGrid.enter().append("path") // ENTER
    .merge(majorGrid) // ENTER + UPDATE
    .attr("d", gridline(this.xScale, this.yScale, layout))
    .attr("class", "majorGrid")
    .style("fill", "none")
    .style("visibility", (d) => d[1])
    .style("stroke", this.params.majorGridStroke)
    .style("stroke-width", this.params.majorGridWidth);

  // add minor grid to SVG
  const minorGrid = this.svg.selectAll('.minorGrid').data(minorGridPoints);
  minorGrid.exit().remove(); // EXIT
  minorGrid.enter().append("path") // ENTER
    .merge(minorGrid) // ENTER + UPDATE
    .attr("d", gridline(this.xScale, this.yScale, layout))
    .attr("class", "minorGrid")
    .style("fill", "none")
    .style("visibility", (d) => d[1])
    .style("stroke", this.params.minorGridStroke)
    .style("stroke-width", this.params.minorGridWidth);


  /* draw the text labels for majorGridPoints */
  const gridLabels = this.svg.selectAll('.gridTick').data(majorGridPoints);
  const precisionX = Math.max(0, -Math.floor(Math.log10(step)));
  const precisionY = Math.max(0, -Math.floor(Math.log10(yStep)));
  gridLabels.exit().remove(); // EXIT
  gridLabels.enter().append("text") // ENTER
    .merge(gridLabels) // ENTER + UPDATE
    .text((d) => d[0].toFixed(d[2]==='y' ? precisionY : precisionX))
    .attr("class", "gridTick")
    .style("font-size", this.params.tickLabelSize)
    .style("font-family", this.params.fontFamily)
    .style("fill", this.params.tickLabelFill)
    .style("text-anchor", textAnchor(layout))
    .style("visibility", (d) => d[1])
    .attr("x", xTextPos(this.xScale, layout))
    .attr("y", yTextPos(this.yScale, layout));

  this.grid=true;
  timerEnd("addGrid");
};
