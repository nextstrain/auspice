import * as scales from "./colorScales";
import createLegendMatchBound from "./createLegendMatchBounds";
import { genericDomain, colors, genotypeColors } from "./globals";
import { parseGenotype, getGenotype } from "./getGenotype"
import d3 from "d3";

const genericScale = (cmin, cmax) => {
  const offset = +cmin;
  const range = cmax - cmin;
  const tmpColorScale = d3.scale.linear()
    .domain(genericDomain.map((d) => offset + d * range))
    .range(colors[10]);
  return tmpColorScale;
};


const minMaxAttributeScale = (nodes, attr) => {
  const maxAttr = d3.max(nodes.map((n) => n.attr[attr]));
  const minAttr = d3.min(nodes.map((n) => n.attr[attr]));
  return genericScale(minAttr, maxAttr);
};

const integerAttributeScale = (nodes, attr) => {
  const maxAttr = d3.max(nodes.map((n) => n.attr[attr]));
  const minAttr = d3.min(nodes.map((n) => n.attr[attr]));
  const nStates = maxAttr - minAttr;
  if (nStates < 11) {
    const domain = [];
    for (let i = minAttr; i <= maxAttr; i++) { domain.push(i); }
    return d3.scale.linear().domain(domain).range(colors[maxAttr - minAttr]);
  } else {
    return genericScale(minAttr, maxAttr);
  }
};

const discreteAttributeScale = (nodes, attr) => {
  const stateCount = {};
  nodes.forEach((n) => (stateCount[n.attr[attr]]
                         ? stateCount[n.attr[attr]] += 1
                         : stateCount[n.attr[attr]] = 1));
  const domain = Object.keys(stateCount);
  domain.sort((a, b) => stateCount[a] > stateCount[b]);
  return d3.scale.ordinal().domain(domain);
};

const getColorScale = (colorBy, tree, sequences) => {
  const cScaleTypes = {ep: "integer", ne: "integer", rb: "integer",
                       lbi: "continuous", fitness: "continuous", num_date: "continuous",
                       region: "discrete", country: "discrete"};
  let colorScale;
  let continuous = false;

  if (!tree.nodes) {
    // make a dummy color scale before the tree is in place
    continuous = true;
    colorScale = genericScale(0, 1);
  } else if (colorBy.slice(0, 2) === "gt") {
    if (!sequences.geneLength) {
      continuous = true;
      colorScale = genericScale(0, 1);
    } else if (parseGenotype(colorBy, sequences.geneLength)) {
      // genotype coloring
      const gt = parseGenotype(colorBy, sequences.geneLength);
      if (gt) {
        const stateCount = {};
        tree.nodes.forEach((n) => (stateCount[getGenotype(gt[0][0], gt[0][1], n, sequences.sequences)]
                               ? stateCount[getGenotype(gt[0][0], gt[0][1], n,   sequences.sequences)] += 1
                               : stateCount[getGenotype(gt[0][0], gt[0][1], n,   sequences.sequences)] = 1));
        const domain = Object.keys(stateCount);
        domain.sort((a, b) => stateCount[a] > stateCount[b]);
        colorScale = d3.scale.ordinal().domain(domain).range(genotypeColors);
      }
    }
  } else if (colorBy === "region") {
    continuous = false;
    colorScale = scales.regionColorScale;
  } else if (cScaleTypes[colorBy] === "continuous") {
    continuous = true;
    colorScale = minMaxAttributeScale(tree.nodes, colorBy);
  } else if (cScaleTypes[colorBy] === "integer") {
    continuous = true;
    colorScale = integerAttributeScale(tree.nodes, colorBy);
  } else if (cScaleTypes[colorBy] === "discrete") {
    continuous = false;
    colorScale = discreteAttributeScale(tree.nodes, colorBy);
  } else {
    continuous = true;
    colorScale = genericScale(0, 1);
  }
  return {"scale": colorScale, "continuous": continuous, "colorBy": colorBy,
          "legendBoundsMap": createLegendMatchBound(colorScale)};
};


export default getColorScale;
