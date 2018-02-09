// import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { rgb } from "d3-color";
import { area } from "d3-shape";
// import { zoom } from "d3-zoom";
// import { brushX } from "d3-brush";
// import Mousetrap from "mousetrap";
// import { lightGrey, medGrey, darkGrey } from "../../globalStyles";
// import { computeChartGeometry, parseEncodedGenotype } from "./index";


export const calcScales = (chartGeom, ticks) => {
  const x = scaleLinear()
    .domain([ticks[0], ticks[ticks.length - 1]])
    .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
  const y = scaleLinear()
    .domain([0, 1])
    .range([chartGeom.height - chartGeom.padBottom, 10]);
  return {x, y, numTicksX: ticks.length, numTicksY: 5};
};

export const drawAxis = (svg, chartGeom, scales) => {
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(" + (chartGeom.padLeft + 15) + "," + (chartGeom.height - chartGeom.padBottom) + ")")
    .call(axisBottom(scales.x).ticks(scales.numTicksX));
  svg.append("g")
    .attr("class", "y axis")
    /* no idea why the 15 is needed here */
    .attr("transform", "translate(" + (chartGeom.padLeft + 15) + "," + 0 + ")")
    .call(axisLeft(scales.y).ticks(scales.numTicksY));
};

export const turnMatrixIntoSeries = (categories, nPivots, matrix) => {
  /*
  WHAT IS A SERIES?
  this is the data structure demanded by d3 for a stream graph.
  it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
  but it's faster to create this ourselves.

  THIS IS THE STRUCTURE:
    [x1, x2, ... xn] where n is the number of categories
      xi = [y1, y2, ..., ym] where m is the number of pivots
        yi = [z1, z2]: the (y0, y1) values of the categorie at that pivot point.

  TO DO:
  this should / could be in the reducer. But what if we want to re-order things?!?!
  */
  const series = [];
  for (let i = 0; i < categories.length; i++) {
    const x = [];
    for (let j = 0; j < nPivots; j++) {
      if (i === 0) {
        x.push([0, matrix[categories[i]][j]]);
      } else {
        const prevY1 = series[i - 1][j][1];
        x.push([prevY1, matrix[categories[i]][j] + prevY1]);
      }
    }
    series.push(x);
  }
  return series;
};

export const generateColorScaleD3 = (categories, colorScale) => (d, i) =>
  rgb(colorScale.scale(categories[i])).toString();


export const drawStream = (svg, scales, categories, pivots, series, colourer) => {
  /* https://github.com/d3/d3-shape/blob/master/README.md#areas */
  const areaObj = area()
    .x((d, i) => scales.x(pivots[i]))
    .y0((d) => scales.y(d[0]))
    .y1((d) => scales.y(d[1]));

  // console.log("SERIES", series);
  // console.log("length", series.length)
  svg.selectAll("path")
    .data(series)
    .enter()
    .append("path")
    .attr("d", areaObj)
    .attr("fill", colourer);

};


export const removeStream = (svg) => {
  svg.selectAll("path").remove();
};
