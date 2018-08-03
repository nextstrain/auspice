/* eslint-disable space-infix-ops */
import { max } from "d3-array";
import { timerStart, timerEnd } from "../../../util/perf";

export const hideGrid = function hideGrid() {
  this.svg.selectAll(".majorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".minorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".gridTick").style('visibility', 'hidden');
};

/**
 * add a grid to the svg
 * @param {layout}
 */
export const addGrid = function addGrid(layout, yMinView, yMaxView) {
  if (typeof layout==="undefined") {layout=this.layout;} // eslint-disable-line no-param-reassign
  if (layout==="unrooted"){return;}

  timerStart("addGrid");
  const ymin = this.yScale.domain()[1];
  const ymax = this.yScale.domain()[0];

  const xmin = layout==="radial" ? this.nodes[0].depth : this.xScale.domain()[0];
  const xmax = layout==="radial" ?
    xmin + max([this.xScale.domain()[1], this.yScale.domain()[1], -this.xScale.domain()[0], -this.yScale.domain()[0]]) :
    this.xScale.domain()[1];

  //needed for rectangular or clock layout -- defines the ends of vertical lines
  const viewTop = yMaxView ? yMaxView+this.params.margins.top : this.yScale.range()[0];
  const viewBottom = yMinView ? yMinView-this.params.margins.bottom : this.yScale.range()[1];

  /* yes - redraw and update gridParams */
  this.gridParams = [xmin, xmax, ymin, ymax, viewTop, viewBottom, layout];

  // determine grid step
  const range = xmax - xmin;
  const logRange = Math.floor(Math.log10(range));
  let step = Math.pow(10, logRange); // eslint-disable-line no-restricted-properties
  if (range/step < 2){
    step = step/5;
  }else if (range/step <5){
    step = step/2
  }

  // determine major grid points
  const gridMin = Math.floor(xmin/step)*step;
  const gridPoints = [];
  const minVis = layout==="radial" ? xmin : gridMin;
  const maxVis = xmax;
  for (let ii = 0; ii <= (xmax - gridMin)/step+3; ii++) {
    const pos = gridMin + step*ii;
    gridPoints.push([pos, ((pos<minVis)||(pos>maxVis))?"hidden":"visible", "x"]);
  }

  //determine minor grid points
  const minorStep = step /
    (this.distanceMeasure === "num_date"? this.params.minorTicksTimeTree : this.params.minorTicks);
  const minorGridPoints = [];
  for (let ii = 0; ii <= (xmax - gridMin)/minorStep+30; ii++) {
    const pos = gridMin + minorStep*ii;
    minorGridPoints.push([pos, ((pos<minVis)||(pos>maxVis+minorStep))?"hidden":"visible", "x"]);
  }

  // function that draws grid lines are circles
  const gridline = function gridline(xScale, yScale, layoutShadow) {
    return (x) => {
      let tmp_d="";
      if (layoutShadow==="rect" || layoutShadow==="clock") {
        const xPos = xScale(x[0]);
        tmp_d = 'M'+xPos.toString() +
          " " +
          viewBottom.toString() +
          " L " +
          xPos.toString() +
          " " +
          viewTop.toString();
      } else if (layoutShadow==="radial") {
        const xPos = xScale(x[0]-xmin);
        tmp_d = 'M '+xPos.toString() +
          "  " +
          yScale(0).toString() +
          " A " +
          (xPos - xScale(0)).toString() +
          " " +
          (yScale(x[0]) - yScale(xmin)).toString() +
          " 0 1 0 " +
          xPos.toString() +
          " " +
          (yScale(0)+0.001).toString();
      }
      return tmp_d;
    };
  };


  // add major grid to svg
  const majorGrid = this.svg.selectAll('.majorGrid').data(gridPoints);

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



  const xTextPos = (xScale, layoutShadow) => (x) => {
    if (x[2] === "x") {
      if (layoutShadow==="radial"){
        return xScale(0);
      }else{
        return xScale(x[0]);
      }
    }else{ // clock layout y ticks
      return xScale.range()[0]-15;
    }
  };
  const yTextPos = (yScale, layoutShadow) => (x) => {
    if (x[2] === "x") {
      return layoutShadow === "radial" ? yScale(x[0]-xmin)-5 : viewBottom + 18;
    }
    return yScale(x[0]);
  };

  const textAnchor = (layoutShadow) => (x) => {
    if (x[2] === "x") {
      return layoutShadow === "radial" ? "end" : "middle";
    }
    return "start";
  };

  let yStep = 0;
  if (this.layout==="clock") {
    const yRange = ymax-ymin;
    const logRangeY = Math.floor(Math.log10(yRange));
    yStep = Math.pow(10, logRangeY);
    if (yRange/yStep < 2){
      yStep = yStep/5;
    }else if (yRange/yStep <5){
      yStep = yStep/2
    }
    const minYVis = gridYMin;
    const maxYVis = ymax;
    const gridYMin = Math.floor(ymin/yStep)*yStep;
    for (let ii = 1; ii <= (ymax - gridYMin)/yStep+10; ii++) {
      const pos = gridYMin + yStep*ii;
      gridPoints.push([pos, ((pos<minYVis)||(pos>maxYVis))?"hidden":"visible", "y"]);
    }
  }

  const gridLabels = this.svg.selectAll('.gridTick').data(gridPoints);
  const precision = Math.max(0, -Math.floor(Math.log10(step)));
  const precisionY = Math.max(0, -Math.floor(Math.log10(yStep)));
  gridLabels.exit().remove(); // EXIT
  gridLabels.enter().append("text") // ENTER
    .merge(gridLabels) // ENTER + UPDATE
    .text((d) => d[0].toFixed(d[2]==='y' ? precisionY : precision))
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
