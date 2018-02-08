/* eslint no-underscore-dangle: off */
// import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { rgb } from "d3-color";
import { stack, area, stackOffsetNone, stackOrderNone, stackOffsetWiggle } from "d3-shape"
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

const turnMatrixIntoSeries = (categories, matrix) => {
  /* make this part of the reducer ?!?! */
  /* https://github.com/d3/d3-shape/blob/master/README.md#_stack */

  const nPivots = matrix[categories[0]].length;
  const data = [];
  for (let j = 0; j < nPivots; j++) data[j] = {};
  for (let i = 0; i < categories.length; i++) {
    for (let j = 0; j < nPivots; j++) {
      data[j][categories[i]] = matrix[categories[i]][j];
    }
  }
  const stackObj = stack()
    .keys(categories)
    .offset(stackOffsetNone); /* no idea */
  const series = stackObj(data);
  // console.log("data", data)
  // console.log("series", series)
  return series;
};

const colourHOF = (categories, colorScale) => {
  return (d, i) => {
    console.log("getting color for i", i, "->", categories[i]);
    return rgb(colorScale.scale(categories[i])).toString();
  };
};

export const drawStream = (svg, scales, matrix, colorScale, pivots) => {
  const categories = Object.keys(matrix);
  console.log("CATEGORIES", categories)
  const series = turnMatrixIntoSeries(categories, matrix);
  const colourFn = colourHOF(categories, colorScale);

  /* https://github.com/d3/d3-shape/blob/master/README.md#areas */
  const areaObj = area()
    .x((d, i) => scales.x(pivots[i]))
    .y0((d) => scales.y(d[0]))
    .y1((d) => scales.y(d[1]));

  console.log("SERIES", series);

  svg.selectAll("path")
    .data(series)
    .enter()
    .append("path")
    .attr("d", areaObj)
    .attr("fill", colourFn);

};
