// import * as scales from "./colorScales";
import createLegendMatchBound from "./createLegendMatchBounds";
import { genericDomain, colors, genotypeColors } from "./globals";
import { parseGenotype, getGenotype } from "./getGenotype"
import d3 from "d3";

/* this checks if there are more items in the tree compared
   to associated colours in the metadata JSON
*/
const getExtraVals = (nodes, colorBy, color_map) => {
  let valsInTree = []
  nodes.forEach((n)=>valsInTree.push(n.attr[colorBy]))
  valsInTree = [...new Set(valsInTree)]
  const valsInMeta = color_map.map((d) => { return d[0]})
  // only care about values in tree NOT in metadata
  return valsInTree.filter((x) => valsInMeta.indexOf(x) === -1)
}


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
   range: [a,b], the colours to go between
*/
const createListOfColors = (n, range) => {
  const scale = d3.scale.linear().domain([0, n])
      .interpolate(d3.interpolateHcl)
      .range(range);
  return d3.range(0, n).map(scale);
};

const discreteAttributeScale = (nodes, attr) => {
  const stateCount = {};
  nodes.forEach((n) => (stateCount[n.attr[attr]]
                         ? stateCount[n.attr[attr]] += 1
                         : stateCount[n.attr[attr]] = 1));
  const domain = Object.keys(stateCount);
  domain.sort((a, b) => stateCount[a] > stateCount[b]);
  // note: colors[n] has n colors
  const colorList = domain.length < colors.length ? colors[domain.length] : colors[colors.length - 1];
  return d3.scale.ordinal()
                 .domain(domain)
                 .range(colorList);
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
      let domain = colorOptions[colorBy].color_map.map((d) => { return d[0]; })
      let range = colorOptions[colorBy].color_map.map((d) => { return d[1]; })
      const extraVals = getExtraVals(tree.nodes, colorBy, colorOptions[colorBy].color_map)
      if (extraVals.length) {
        // we must add these to the domain + provide a value in the range
        domain = domain.concat(extraVals);
        const extrasColorAB = [d3.rgb(192, 192, 192), d3.rgb(32, 32, 32)]
        range = range.concat(createListOfColors(extraVals.length, extrasColorAB))
      }
      continuous = false;
      colorScale = d3.scale.ordinal()
                           .domain(domain)
                           .range(range);
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
