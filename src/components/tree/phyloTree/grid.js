/* eslint-disable space-infix-ops */
import { max } from "d3-array";
import { timerStart, timerEnd } from "../../../util/perf";

export const removeGrid = function removeGrid() {
  this.svg.selectAll(".majorGrid").remove();
  this.svg.selectAll(".minorGrid").remove();
  this.svg.selectAll(".gridTick").remove();
  this.grid = false;
};

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
  timerStart("addGrid");
  if (typeof layout==="undefined") {layout=this.layout;} // eslint-disable-line no-param-reassign

  const xmin = (this.xScale.domain()[0]>0)?this.xScale.domain()[0]:0.0;
  const ymin = this.yScale.domain()[1];
  const ymax = this.yScale.domain()[0];
  const xmax = layout === "radial" ?
    max([this.xScale.domain()[1], this.yScale.domain()[1], -this.xScale.domain()[0], -this.yScale.domain()[0]]) :
    this.xScale.domain()[1];

  const offset = layout==="radial"?this.nodes[0].depth:0.0;
  const viewTop = yMaxView ? yMaxView+this.params.margins.top : this.yScale.range()[0];
  const viewBottom = yMinView ? yMinView-this.params.margins.bottom : this.yScale.range()[1];

  /* should we re-draw the grid? */
  if (!this.gridParams) {
    this.gridParams = [xmin, xmax, ymin, ymax, viewTop, viewBottom, layout];
  } else if (xmin === this.gridParams[0] && xmax === this.gridParams[1] &&
        ymin === this.gridParams[2] && ymax === this.gridParams[3] &&
        viewTop === this.gridParams[4] && viewBottom === this.gridParams[5] &&
        layout === this.gridParams[6]) {
    // console.log("bailing - no difference");
    return;
  }

  /* yes - redraw and update gridParams */
  this.gridParams = [xmin, xmax, ymin, ymax, viewTop, viewBottom, layout];


  const gridline = function gridline(xScale, yScale, layoutShadow) {
    return (x) => {
      const xPos = xScale(x[0]-offset);
      let tmp_d="";
      if (layoutShadow==="rect" || layoutShadow==="clock") {
        tmp_d = 'M'+xPos.toString() +
          " " +
          viewBottom.toString() +
          " L " +
          xPos.toString() +
          " " +
          viewTop.toString();
      } else if (layoutShadow==="radial") {
        tmp_d = 'M '+xPos.toString() +
          "  " +
          yScale(0).toString() +
          " A " +
          (xPos - xScale(0)).toString() +
          " " +
          (yScale(x[0]) - yScale(offset)).toString() +
          " 0 1 0 " +
          xPos.toString() +
          " " +
          (yScale(0)+0.001).toString();
      }
      return tmp_d;
    };
  };

  const logRange = Math.floor(Math.log10(xmax - xmin));
  const roundingLevel = Math.pow(10, logRange); // eslint-disable-line no-restricted-properties
  const gridMin = Math.floor((xmin+offset)/roundingLevel)*roundingLevel;
  const gridPoints = [];
  for (let ii = 0; ii <= (xmax + offset - gridMin)/roundingLevel+10; ii++) {
    const pos = gridMin + roundingLevel*ii;
    if (pos>offset) {
      gridPoints.push([pos, pos-offset>xmax?"hidden":"visible", "x"]);
    }
  }

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

  const xTextPos = (xScale, layoutShadow) => (x) => {
    if (x[2] === "x") {
      return layoutShadow === "radial" ? xScale(0) : xScale(x[0]);
    }
    return xScale.range()[1];
  };
  const yTextPos = (yScale, layoutShadow) => (x) => {
    if (x[2] === "x") {
      return layoutShadow === "radial" ? yScale(x[0]-offset) : viewBottom + 18;
    }
    return yScale(x[0]);
  };


  let logRangeY = 0;
  if (this.layout==="clock") {
    const roundingLevelY = Math.pow(10, logRangeY); // eslint-disable-line no-restricted-properties
    logRangeY = Math.floor(Math.log10(ymax - ymin));
    const offsetY=0;
    const gridMinY = Math.floor((ymin+offsetY)/roundingLevelY)*roundingLevelY;
    for (let ii = 0; ii <= (ymax + offsetY - gridMinY)/roundingLevelY+10; ii++) {
      const pos = gridMinY + roundingLevelY*ii;
      if (pos>offsetY) {
        gridPoints.push([pos, pos-offsetY>ymax ? "hidden" : "visible", "y"]);
      }
    }
  }

  const minorRoundingLevel = roundingLevel /
    (this.distanceMeasure === "num_date"? this.params.minorTicksTimeTree : this.params.minorTicks);
  const minorGridPoints = [];
  for (let ii = 0; ii <= (xmax + offset - gridMin)/minorRoundingLevel+50; ii++) {
    const pos = gridMin + minorRoundingLevel*ii;
    if (pos>offset) {
      minorGridPoints.push([pos, pos-offset>xmax+minorRoundingLevel?"hidden":"visible"]);
    }
  }
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

  const gridLabels = this.svg.selectAll('.gridTick').data(gridPoints);
  const precision = Math.max(0, 1-logRange);
  const precisionY = Math.max(0, 1-logRangeY);
  gridLabels.exit().remove(); // EXIT
  gridLabels.enter().append("text") // ENTER
    .merge(gridLabels) // ENTER + UPDATE
    .text((d) => d[0].toFixed(d[2]==='y' ? precisionY : precision))
    .attr("class", "gridTick")
    .style("font-size", this.params.tickLabelSize)
    .style("font-family", this.params.fontFamily)
    .style("fill", this.params.tickLabelFill)
    .style("text-anchor", this.layout==="radial" ? "end" : "middle")
    .style("visibility", (d) => d[1])
    .attr("x", xTextPos(this.xScale, layout))
    .attr("y", yTextPos(this.yScale, layout));

  this.grid=true;
  timerEnd("addGrid");
};
