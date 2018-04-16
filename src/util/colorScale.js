import { scaleLinear, scaleOrdinal } from "d3-scale";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors } from "./globals";
import { getAllValuesAndCountsOfTraitsFromTree } from "./treeCountingHelpers";
import { getExtraVals } from "./colorHelpers";
import { parseEncodedGenotype } from "./getGenotype";
import { setGenotype, orderOfGenotypeAppearance } from "./setGenotype";

const unknownColor = "#DDDDDD";

const continuousScale = (x0, x1) => {
  const scale = scaleLinear()
    .domain(genericDomain.map((d) => x0 + d * (x1 - x0)))
    .range(colors[9]);
  return (val) => (val === undefined || val === false) ? unknownColor : scale(val);
};

const getMinMaxFromTree = (nodes, nodesToo, attr) => {
  const vals = nodes.map((n) => n.attr[attr]);
  if (nodesToo) {
    nodesToo.forEach((n) => vals.push(n.attr[attr]));
  }
  vals.filter((n) => n !== undefined)
    .filter((item, i, ar) => ar.indexOf(item) === i);
  return [min(vals), max(vals)];
};

/* this creates a (ramped) list of colours
   this is necessary as ordinal scales can't interpololate colours.
   range: [a,b], the colours to go between */
const createListOfColors = (n, range) => {
  const scale = scaleLinear().domain([0, n])
    .interpolate(interpolateHcl)
    .range(range);
  return d3Range(0, n).map(scale);
};

const getDiscreteValuesFromTree = (nodes, nodesToo, attr) => {
  const stateCount = getAllValuesAndCountsOfTraitsFromTree(nodes, attr)[attr];
  if (nodesToo) {
    const sc = getAllValuesAndCountsOfTraitsFromTree(nodesToo, attr)[attr];
    for (let state in sc) { // eslint-disable-line
      if (stateCount[state]) {
        stateCount[state] += sc[state];
      } else {
        stateCount[state] = sc[state];
      }
    }
  }
  const domain = Object.keys(stateCount);
  /* sorting technique depends on the colorBy */
  if (attr === "clade_membership") {
    domain.sort();
  } else {
    domain.sort((a, b) => stateCount[a] > stateCount[b] ? -1 : 1);
  }
  return domain;
};

const createDiscreteScale = (domain) => {
  // note: colors[n] has n colors
  const colorList = domain.length <= colors.length ?
    colors[domain.length].slice() :
    colors[colors.length - 1].slice();

  /* if NA / undefined / unknown, change the colours to grey */
  for (const key of ["unknown", "undefined", "unassigned", "NA", "NaN"]) {
    if (domain.indexOf(key) !== -1) {
      colorList[domain.indexOf(key)] = unknownColor;
    }
  }
  const scale = scaleOrdinal().domain(domain).range(colorList);
  return (val) => (val === undefined || val === false) ? unknownColor : scale(val);
};

const valBetween = (x0, x1) => {
  return x0 + 0.5*(x1-x0);
};

export const calcColorScale = (colorBy, controls, tree, treeToo, metadata) => {
  // console.log(`calcColorScale for ${colorBy}. TreeToo? ${!!treeToo}`)
  let genotype;
  if (colorBy.slice(0, 3) === "gt-" && controls.geneLength) {
    genotype = parseEncodedGenotype(colorBy, controls.geneLength);
    if (genotype.length > 1) {
      console.warn("Cannot deal with multiple proteins yet - using first only.");
    }
    setGenotype(tree.nodes, genotype[0].prot || "nuc", genotype[0].positions); /* modifies nodes recursively */
  }
  const colorOptions = metadata.colorOptions;
  const treeTooNodes = treeToo ? treeToo.nodes : undefined;
  let error = false;
  let continuous = false;
  let colorScale, legendValues, legendBounds;

  if (!tree.nodes) {
    console.error("calcColorScale called before tree is ready.");
    error = true;
  } else if (genotype) { /* G E N O T Y P E */
    legendValues = orderOfGenotypeAppearance(tree.nodes);
    colorScale = scaleOrdinal()
      .domain([undefined, ...legendValues])
      .range([unknownColor, ...genotypeColors]);
  } else if (colorOptions && colorOptions[colorBy]) {
    if (colorOptions[colorBy].color_map) {
      // console.log("Sweet - we've got a color_map for ", colorBy)
      continuous = false; /* colorMaps can't be continuous */
      let domain = colorOptions[colorBy].color_map.map((d) => { return d[0]; });
      let range = colorOptions[colorBy].color_map.map((d) => { return d[1]; });
      const extraVals = getExtraVals(tree.nodes, treeTooNodes, colorBy, colorOptions[colorBy].color_map);
      if (extraVals.length) {
        // we must add these to the domain + provide a value in the range
        domain = domain.concat(extraVals);
        const extrasColorAB = [rgb(192, 192, 192), rgb(32, 32, 32)];
        range = range.concat(createListOfColors(extraVals.length, extrasColorAB));
      }
      colorScale = scaleOrdinal()
        .domain(domain)
        .range(range);
      legendValues = domain;
    } else if (colorOptions && colorOptions[colorBy].type === "discrete") {
      // console.log("making a discrete color scale for ", colorBy)
      continuous = false;
      legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
      colorScale = createDiscreteScale(legendValues);
    } else if (colorOptions && colorOptions[colorBy].type === "continuous") {
      // console.log("making a continuous color scale for ", colorBy)
      continuous = true;
      const minMax = colorBy === "lbi" ?
        [0, 0.7] :
        getMinMaxFromTree(tree.nodes, treeTooNodes, colorBy, colorOptions[colorBy]);
      colorScale = continuousScale(...minMax);
      const spread = minMax[1] - minMax[0];
      const dp = spread > 5 ? 2 : 3;
      legendValues = colorBy === "lbi" ?
        [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7] :
        genericDomain.map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)));
      /* sort out ranges */
      const len = legendValues.length;
      legendBounds = {};
      legendBounds[legendValues[0]] = [0, valBetween(legendValues[0], legendValues[1])];
      for (let i = 1; i < len - 1; i++) {
        legendBounds[legendValues[i]] = [valBetween(legendValues[i-1], legendValues[i]), valBetween(legendValues[i], legendValues[i+1])];
      }
      legendBounds[legendValues[len-1]] = [valBetween(legendValues[len-2], legendValues[len-1]), 10000];
    }
  } else {
    error = true;
  }

  if (error) {
    console.error("ColorScale fallthrough for ", colorBy);
    continuous = false;
    legendValues = ["unknown"];
    colorScale = () => unknownColor;
  }

  return {
    scale: colorScale,
    continuous: continuous,
    colorBy: colorBy,
    version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
    legendValues,
    legendBounds,
    genotype
  };
};
