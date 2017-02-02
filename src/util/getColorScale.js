// import * as scales from "./colorScales";
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

/* this creates a (ramped) list of colours
   this is necessary as ordinal scales can't interpololate colours.
   it would be cool to use chroma, but i couldn't import it properly :(
   http://gka.github.io/chroma.js/
*/
const createListOfColors = (n) => {
  const scale = d3.scale.linear().domain([1, n])
      .interpolate(d3.interpolateHcl)
      .range([d3.rgb("#007AFF"), d3.rgb("#FFD000")]);
  return d3.range(0, n).map(scale);
};

const discreteAttributeScale = (nodes, attr) => {
  const stateCount = {};
  nodes.forEach((n) => (stateCount[n.attr[attr]]
                         ? stateCount[n.attr[attr]] += 1
                         : stateCount[n.attr[attr]] = 1));
  const domain = Object.keys(stateCount);
  domain.sort((a, b) => stateCount[a] > stateCount[b]);
  return d3.scale.ordinal()
                 .domain(domain)
                 .range(createListOfColors(domain.length));
};

const getColorScale = (colorBy, tree, sequences, colorOptions) => {
  let colorScale;
  let continuous = false;

  if (!tree.nodes) {
    // make a dummy color scale before the tree is in place
    // console.log("tree not ready - making dummy color scale")
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
  } else if (colorOptions && colorOptions[colorBy]) {
    if (colorOptions[colorBy].color_map) {
      // console.log("Sweet - we've got a color_map for ", colorBy)
      continuous = false;
      colorScale = d3.scale.ordinal()
        .domain(colorOptions[colorBy].color_map.map((d) => { return d[0]; }))
        .range(colorOptions[colorBy].color_map.map((d) => { return d[1]; }));
    } else if (colorOptions && colorOptions[colorBy].type === "discrete") {
      // console.log("making a discrete color scale for ", colorBy)
      continuous = false;
      colorScale = discreteAttributeScale(tree.nodes, colorBy);
    } else if (colorOptions && colorOptions[colorBy].type === "integer") {
      // console.log("making an integer color scale for ", colorBy)
      continuous = false;
      colorScale = integerAttributeScale(tree.nodes, colorBy);
    } else if (colorOptions && colorOptions[colorBy].type === "continuous") {
      // console.log("making a continuous color scale for ", colorBy)
      continuous = true;
      colorScale = minMaxAttributeScale(tree.nodes, colorBy);
    }
  } else {
    // This shouldn't ever happen!
    // console.log("no colorOptions for ", colorBy, " returning minMaxAttributeScale")
    continuous = true;
    colorScale = minMaxAttributeScale(tree.nodes, colorBy);
  }
  return {
    "scale": colorScale,
    "continuous": continuous,
    "colorBy": colorBy,
    "legendBoundsMap": createLegendMatchBound(colorScale)
  };
};


export default getColorScale;
