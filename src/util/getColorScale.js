import { scaleLinear, scaleOrdinal } from "d3-scale";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors, reallySmallNumber, reallyBigNumber } from "./globals";
import { parseGenotype } from "./getGenotype";
import { getAllValuesAndCountsOfTraitsFromTree } from "./treeTraversals";
import { setLBI } from "./localBranchingIndex";

/**
* what values (for colorBy) are present in the tree and not in the color_map?
* @param {Array} nodes - list of nodes
* @param {string} colorBy -
* @param {Array} color_map - list of colorBy values with colours
* @return {list}
*/
const getExtraVals = (nodes, colorBy, color_map) => {
  let valsInTree = [];
  nodes.forEach((n) => valsInTree.push(n.attr[colorBy]));
  valsInTree = [...new Set(valsInTree)];
  const valsInMeta = color_map.map((d) => { return d[0];});
  // console.log("here", valsInMeta, valsInTree, valsInTree.filter((x) => valsInMeta.indexOf(x) === -1))
  // only care about values in tree NOT in metadata
  return valsInTree.filter((x) => valsInMeta.indexOf(x) === -1);
};

const createLegendMatchBound = (colorScale) => {
  const lower_bound = {};
  const upper_bound = {};
  lower_bound[colorScale.domain()[0]] = reallySmallNumber;
  upper_bound[colorScale.domain()[0]] = colorScale.domain()[0];

  for (let i = 1; i < colorScale.domain().length; i++) {
    lower_bound[colorScale.domain()[i]] = colorScale.domain()[i - 1];
    upper_bound[colorScale.domain()[i]] = colorScale.domain()[i];
  }

  upper_bound[colorScale.domain()[colorScale.domain().length - 1]] = reallyBigNumber;

  return {
    lower_bound,
    upper_bound
  };
};

const genericScale = (cmin, cmax, vals = false) => {
  if (vals && vals.length <= 9) {
    return scaleLinear()
      .domain(vals)
      .range(colors[vals.length]);
  }
  /* if we have more than 9 values to display
  (and the scale is continuous at this point)
  create an evenly spaced 9-item domain (this is genericDomain) */
  const offset = +cmin;
  const range = cmax - cmin;
  return scaleLinear()
    .domain(genericDomain.map((d) => offset + d * range))
    .range(colors[9]);
};


const minMaxAttributeScale = (nodes, attr, options) => {
  if (options.vmin && options.vmax) {
    return genericScale(options.vmin, options.vmax);
  }
  const vals = nodes.map((n) => n.attr[attr])
    .filter((n) => n !== undefined)
    .filter((item, i, ar) => ar.indexOf(item) === i);
  return genericScale(min(vals), max(vals), vals);
};

const integerAttributeScale = (nodes, attr) => {
  const maxAttr = max(nodes.map((n) => n.attr[attr]));
  const minAttr = min(nodes.map((n) => n.attr[attr]));
  const nStates = maxAttr - minAttr;
  if (nStates < 11) {
    const domain = [];
    for (let i = minAttr; i <= maxAttr; i++) { domain.push(i); }
    return scaleLinear().domain(domain).range(colors[maxAttr - minAttr]);
  }
  return genericScale(minAttr, maxAttr);
};

/* this creates a (ramped) list of colours
   this is necessary as ordinal scales can't interpololate colours.
   it would be cool to use chroma, but i couldn't import it properly :(
   http://gka.github.io/chroma.js/
   range: [a,b], the colours to go between
*/
const createListOfColors = (n, range) => {
  const scale = scaleLinear().domain([0, n])
    .interpolate(interpolateHcl)
    .range(range);
  return d3Range(0, n).map(scale);
};

const discreteAttributeScale = (nodes, attr) => {
  const stateCount = getAllValuesAndCountsOfTraitsFromTree(nodes, attr)[attr];
  const domain = Object.keys(stateCount);
  domain.sort((a, b) => stateCount[a] > stateCount[b]);
  // note: colors[n] has n colors
  const colorList = domain.length < colors.length ? colors[domain.length] : colors[colors.length - 1];

  /* if NA / undefined / unknown, change the colours to grey */
  for (const key of ["unknown", "undefined", "NA", "NaN"]) {
    if (domain.indexOf(key) !== -1) {
      colorList[domain.indexOf(key)] = "#DDDDDD";
    }
  }
  return scaleOrdinal()
    .domain(domain)
    .range(colorList);
};

const getColorScale = (colorBy, tree, geneLength, colorOptions, version, absoluteDateMaxNumeric) => {
  let colorScale;
  let continuous = false;
  let error = false;

  if (!tree.nodes) {
    // make a dummy color scale before the tree is in place
    continuous = true;
    colorScale = genericScale(0, 1);
  } else if (colorBy.slice(0, 2) === "gt") {
    if (!geneLength) {
      continuous = true;
      colorScale = genericScale(0, 1);
    } else if (parseGenotype(colorBy, geneLength)) {
      // genotype coloring
      const gt = parseGenotype(colorBy, geneLength);
      if (gt) {
        const stateCount = {};
        tree.nodes.forEach((n) => {
          stateCount[n.currentGt] ? stateCount[n.currentGt]++ : stateCount[n.currentGt] = 1;
        });
        const domain = Object.keys(stateCount);
        domain.sort((a, b) => stateCount[a] > stateCount[b]);
        colorScale = scaleOrdinal().domain(domain).range(genotypeColors);
      }
    }
  } else if (colorBy === "lbi") {
    console.log("lbi", colorOptions[colorBy])
    try {
      setLBI(tree.nodes, absoluteDateMaxNumeric, colorOptions.lbi.tau, colorOptions.lbi.timeWindow);
      colorScale = minMaxAttributeScale(tree.nodes, "lbi", colorOptions.lbi);
      continuous = true;
    } catch (e) {
      console.error("Setting LBI failed.", e);
      error = true;
    }
  } else if (colorOptions && colorOptions[colorBy]) {
    if (colorOptions[colorBy].color_map) {
      // console.log("Sweet - we've got a color_map for ", colorBy)
      let domain = colorOptions[colorBy].color_map.map((d) => { return d[0]; });
      let range = colorOptions[colorBy].color_map.map((d) => { return d[1]; });
      const extraVals = getExtraVals(tree.nodes, colorBy, colorOptions[colorBy].color_map);
      if (extraVals.length) {
        // we must add these to the domain + provide a value in the range
        domain = domain.concat(extraVals);
        const extrasColorAB = [rgb(192, 192, 192), rgb(32, 32, 32)];
        range = range.concat(createListOfColors(extraVals.length, extrasColorAB));
      }
      continuous = false;
      colorScale = scaleOrdinal()
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
      colorScale = minMaxAttributeScale(tree.nodes, colorBy, colorOptions[colorBy]);
    }
  } else {
    error = true;
  }

  if (error) {
    console.error("no colorOptions for ", colorBy, " returning minMaxAttributeScale");
    continuous = true;
    colorScale = minMaxAttributeScale(tree.nodes, colorBy, colorOptions[colorBy]);
  }

  return {
    scale: colorScale,
    continuous: continuous,
    colorBy: colorBy, // this should be removed
    legendBoundsMap: createLegendMatchBound(colorScale),
    version
  };
};


export default getColorScale;
