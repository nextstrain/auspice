import * as scales from "./colorScales";
import { genericDomain, colors } from "./globals";
import d3 from "d3";

const genericScale = (cmin,cmax) => {
  const offset = +cmin;
  const range = cmax-cmin;
  const tmpColorScale = d3.scale.linear()
    .domain(genericDomain.map((d) => offset + d * range))
    .range(colors[10]);
  return tmpColorScale;
}

const getColorScale = (colorBy, currentState) => {
  let colorScale;
  let continuous=false;
  if (colorBy === "ep") {
    colorScale = genericScale(0, 15);
    continuous = true;
  } else if (colorBy === "ne") {
    colorScale = genericScale(0, 25);
    continuous = true;
  } else if (colorBy === "rb") {
    colorScale = genericScale(0, 6);
    continuous = true;
  } else if (colorBy === "lbi") {
    colorScale = scales.lbiColorScale;
    // todo, discuss
    // adjust_coloring_by_date();
    continuous = true;
  } else if (colorBy === "dfreq") {
    colorScale = scales.dfreqColorScale;
    continuous = true;
  } else if (colorBy === "region") {
    colorScale = scales.regionColorScale;
  } else if (colorBy === "cHI") {
    colorScale = scales.cHIColorScale;
    continuous = true;
  } else if (colorBy === "num_date") {
    colorScale = genericScale(2012,2017);
    continuous = true;
  } else if (colorBy === "fitness") {
    colorScale = scales.fitnessColorScale;
    continuous = true;
  }
  return {"scale": colorScale, "continuous": continuous};
}


export default getColorScale;
