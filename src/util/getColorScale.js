import * as scales from "./colorScales";
import { genericDomain, colors } from "./globals";

const getColorScale = (colorBy) => {

  let colorScale = d3.scale.linear()
    .domain(genericDomain)
    .range(colors[10]);

  if (colorBy === "ep") {
    colorScale = scales.epitopeColorScale;
  } else if (colorBy === "ne") {
    colorScale = scales.nonepitopeColorScale;
  } else if (colorBy === "rb") {
    colorScale = scales.receptorBindingColorScale;
  } else if (colorBy === "lbi") {
    colorScale = scales.lbiColorScale;
    // todo, discuss
    // adjust_coloring_by_date();
  } else if (colorBy === "dfreq") {
    colorScale = scales.dfreqColorScale;
  } else if (colorBy === "region") {
    colorScale = scales.regionColorScale;
  } else if (colorBy === "cHI") {
    colorScale = scales.cHIColorScale;
  } else if (colorBy === "num_date") {

    colorScale.domain(genericDomain.map((d) => Math.round(offset + range*d)));
  } else if (colorBy === "fitness") {
    colorScale = scales.fitnessColorScale;
  }

  return colorScale;

};

/* else if (colorBy === "HI_dist") {
newFocus();
return;
} */

export default getColorScale;
