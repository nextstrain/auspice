/* eslint no-underscore-dangle: off */
// import { select, event } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
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
