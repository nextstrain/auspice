import { scaleLinear, scaleOrdinal } from "d3-scale";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors } from "./globals";
import { countTraitsAcrossTree } from "./treeCountingHelpers";
import { getExtraVals } from "./colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "./getGenotype";
import { setGenotype, orderOfGenotypeAppearance } from "./setGenotype";
import { getTraitFromNode } from "./treeMiscHelpers";

const unknownColor = "#AAAAAA";

const getMinMaxFromTree = (nodes, nodesToo, attr) => {
  const arr = nodesToo ? nodes.concat(nodesToo) : nodes.slice();
  const vals = arr.map((n) => getTraitFromNode(n, attr));
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
  const stateCount = countTraitsAcrossTree(nodes, [attr], false, false)[attr];
  if (nodesToo) {
    const sc = countTraitsAcrossTree(nodesToo, [attr], false, false)[attr];
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

const createLegendBounds = (legendValues) => {
  const valBetween = (x0, x1) => x0 + 0.5*(x1-x0);
  const len = legendValues.length;
  const legendBounds = {};
  legendBounds[legendValues[0]] = [0, valBetween(legendValues[0], legendValues[1])];
  for (let i = 1; i < len - 1; i++) {
    legendBounds[legendValues[i]] = [valBetween(legendValues[i-1], legendValues[i]), valBetween(legendValues[i], legendValues[i+1])];
  }
  legendBounds[legendValues[len-1]] = [valBetween(legendValues[len-2], legendValues[len-1]), 10000];
  return legendBounds;
};

/**
 * calculate the color scale.
 * @param {string} colorBy - provided trait to use as color
 * @param {object} controls
 * @param {object} tree
 * @param {object} treeToo
 * @param {object} metadata
 * @return {{scale: function, continuous: string, colorBy: string, version: int, legendValues: Array, legendBounds: Array, genotype: null|object}}
 */
export const calcColorScale = (colorBy, controls, tree, treeToo, metadata) => {
  if (colorBy === "none") {
    console.warn("ColorScale fallthrough for colorBy set to none");
    return {
      scale: () => unknownColor,
      continuous: false,
      colorBy: colorBy,
      version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
      legendValues: ["unknown"],
      legendBounds: createLegendBounds(["unknown"]),
      genotype: null
    };
  }

  let genotype;
  if (isColorByGenotype(colorBy) && controls.geneLength) {
    genotype = decodeColorByGenotype(colorBy, controls.geneLength);
    setGenotype(tree.nodes, genotype.gene, genotype.positions); /* modifies nodes recursively */
  }
  // const colorOptions = metadata.colorOptions;
  const colorings = metadata.colorings;
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
  } else if (colorings && colorings[colorBy]) {
    /* Is the scale set in the provided colorings object? */
    if (colorings[colorBy].scale) {
      // console.log(`calcColorScale: colorBy ${colorBy} provided us with a scale (traits -> hexes)`);
      continuous = false; /* colorMaps can't be continuous */
      let domain = Object.keys(colorings[colorBy].scale);
      let range = domain.map((key) => colorings[colorBy].scale[key]);
      const extraVals = getExtraVals(tree.nodes, treeTooNodes, colorBy, colorings[colorBy].scale);
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
    } else if (colorings && (colorings[colorBy].type === "categorical" || colorings[colorBy].type === "ordinal")) {
      // console.log("making a categorica / ordinal color scale for ", colorBy);
      // TODO ordinal should use a different scale...
      continuous = false;
      legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
      colorScale = createDiscreteScale(legendValues);
    } else if (colorings && colorings[colorBy].type === "continuous") {
      // console.log("making a continuous color scale for ", colorBy);
      continuous = true;
      let minMax;
      switch (colorBy) {
        case "lbi":
          minMax = [0, 0.7];
          break;
        case "num_date":
          break; /* minMax not needed for num_date */
        default:
          minMax = getMinMaxFromTree(tree.nodes, treeTooNodes, colorBy, colorings[colorBy]);
      }

      /* make the continuous scale */
      let domain, range;
      switch (colorBy) {
        case "num_date":
          /* we want the colorScale to "focus" on the tip dates, and be spaced according to sampling */
          let rootDate = tree.nodes[0].num_date.value;
          let vals = tree.nodes.filter((n) => !n.hasChildren).map((n) => n.num_date.value);
          if (treeTooNodes) {
            if (treeTooNodes[0].num_date.value < rootDate) rootDate = treeTooNodes[0].num_date.value;
            vals.concat(treeTooNodes.filter((n) => !n.hasChildren).map((n) => n.num_date.value));
          }
          vals = vals.sort();
          domain = [rootDate];
          const n = 10;
          const spaceBetween = parseInt(vals.length / (n - 1), 10);
          for (let i = 0; i < (n-1); i++) domain.push(vals[spaceBetween*i]);
          domain.push(vals[vals.length-1]);
          domain = [...new Set(domain)]; /* filter to unique values only */
          range = colors[domain.length]; /* use the right number of colours */
          break;
        default:
          range = colors[9];
          domain = genericDomain.map((d) => minMax[0] + d * (minMax[1] - minMax[0]));
      }
      const scale = scaleLinear().domain(domain).range(range);
      colorScale = (val) => (val === undefined || val === false) ? unknownColor : scale(val);

      /* construct the legend values & their respective bounds */
      switch (colorBy) {
        case "lbi":
          legendValues = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
          break;
        case "num_date":
          legendValues = domain.slice(1);
          break;
        default:
          const spread = minMax[1] - minMax[0];
          const dp = spread > 5 ? 2 : 3;
          legendValues = genericDomain.map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)));
      }
      if (legendValues[0] === -0) legendValues[0] = 0; /* hack to avoid bugs */
      legendBounds = createLegendBounds(legendValues);
    } else {
      console.error("ColorBy", colorBy, "invalid type --", colorings[colorBy].type);
      error = true;
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
