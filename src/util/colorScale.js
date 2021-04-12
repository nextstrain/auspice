import scaleOrdinal from "d3-scale/src/ordinal";
import scaleLinear from "d3-scale/src/linear";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors, isValueValid, NODE_VISIBLE } from "./globals";
import { countTraitsAcrossTree } from "./treeCountingHelpers";
import { getExtraVals } from "./colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "./getGenotype";
import { setGenotype, orderOfGenotypeAppearance } from "./setGenotype";
import { getTraitFromNode } from "./treeMiscHelpers";
import { sortedDomain } from "./sortedDomain";

export const unknownColor = "#AAAAAA";

/**
 * calculate the color scale.
 * @param {string} colorBy - provided trait to use as color
 * @param {object} controls
 * @param {object} tree
 * @param {object} treeToo
 * @param {object} metadata
 * @return {{scale: function, continuous: string, colorBy: string, version: int, legendValues: Array, legendBounds: Array|undefined, genotype: null|object, scaleType: null|string, visibleLegendValues: Array}}
 */
export const calcColorScale = (colorBy, controls, tree, treeToo, metadata) => {
  try {
    if (colorBy === "none") {
      throw new Error("colorBy is 'none'. Falling back to a default, uninformative color scale.");
    }
    if (!tree.nodes) {
      throw new Error("calcColorScale called before tree is ready.");
    }
    const colorings = metadata.colorings;
    const treeTooNodes = treeToo ? treeToo.nodes : undefined;
    let continuous = false;
    let colorScale, legendValues, legendBounds;

    let genotype;
    if (isColorByGenotype(colorBy) && controls.geneLength) {
      genotype = decodeColorByGenotype(colorBy, controls.geneLength);
      setGenotype(tree.nodes, genotype.gene, genotype.positions, metadata.rootSequence); /* modifies nodes recursively */
    }
    const scaleType = genotype ? "categorical" : colorings[colorBy].type;

    if (genotype) {
      ({legendValues, colorScale} = createScaleForGenotype(tree.nodes, controls.mutType));
    } else if (colorings && colorings[colorBy]) {
      if (colorings[colorBy].scale) { /* scale set via JSON */
        ({continuous, legendValues, colorScale} =
          createScaleFromProvidedScaleMap(colorBy, colorings[colorBy].scale, tree.nodes, treeTooNodes));
      } else if (scaleType === "categorical") {
        legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
        colorScale = createDiscreteScale(legendValues, "categorical");
      } else if (scaleType === "ordinal") {
        ({continuous, colorScale, legendValues, legendBounds} = createOrdinalScale(colorBy, tree.nodes, treeTooNodes));
      } else if (scaleType === "boolean") {
        legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
        colorScale = booleanColorScale;
      } else if (scaleType === "continuous") {
        ({continuous, colorScale, legendBounds, legendValues} = createContinuousScale(colorBy, tree.nodes, treeTooNodes));
      } else {
        throw new Error(`ColorBy ${colorBy} invalid type -- ${scaleType}`);
      }
    } else {
      throw new Error('Error in logic for processing colorings');
    }

    const visibleLegendValues = createVisibleLegendValues({
      colorBy,
      scaleType,
      genotype,
      legendValues,
      treeNodes: tree.nodes,
      treeTooNodes,
      visibility: tree.visibility,
      visibilityToo: treeToo ? treeToo.visibility : undefined
    });

    return {
      scale: colorScale,
      continuous,
      colorBy,
      version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
      legendValues,
      legendBounds,
      genotype,
      scaleType: scaleType,
      visibleLegendValues: visibleLegendValues
    };
  } catch (err) {
    /* Catch all errors to avoid app crashes */
    console.error("Error creating color scales. Details:\n", err.message);
    return {
      scale: () => unknownColor,
      continuous: false,
      colorBy,
      version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
      legendValues: ["unknown"],
      legendBounds: createLegendBounds(["unknown"]),
      genotype: null,
      scaleType: null,
      visibleLegendValues: ["unknown"]
    };
  }
};

export function createScaleFromProvidedScaleMap(colorBy, providedScale, t1nodes, t2nodes) {
  // console.log(`calcColorScale: colorBy ${colorBy} provided us with a scale (list of [trait, hex])`);
  if (!Array.isArray(providedScale)) {
    throw new Error(`${colorBy} has defined a scale which wasn't an array`);
  }
  const colorMap = new Map(providedScale);
  let domain = providedScale.map((x) => x[0]);
  /* create shades of grey for values in the tree which weren't defined in the provided scale */
  const extraVals = getExtraVals(t1nodes, t2nodes, colorBy, domain);
  if (extraVals.length) { // we must add these to the domain + provide a color value
    domain = domain.concat(extraVals);
    const extraColors = createListOfColors(extraVals.length, [rgb(192, 192, 192), rgb(32, 32, 32)]);
    extraVals.forEach((val, idx) => {
      colorMap.set(val, extraColors[idx]);
    });
  }
  return {
    continuous: false, /* colorMaps can't (yet) be continuous */
    legendValues: domain,
    colorScale: (val) => (colorMap.get(val) || unknownColor)
  };
}

function createScaleForGenotype(t1nodes, mutType) {
  const legendValues = orderOfGenotypeAppearance(t1nodes, mutType);
  const trueValues = mutType === "nuc" ?
    legendValues.filter((x) => x !== "X" && x !== "-" && x !== "N" && x !== "") :
    legendValues.filter((x) => x !== "X" && x !== "-" && x !== "");
  const domain = [undefined, ...legendValues];
  const range = [unknownColor, ...genotypeColors.slice(0, trueValues.length)];
  // Bases are returned by orderOfGenotypeAppearance in order, unknowns at end
  if (legendValues.indexOf("-") !== -1) {
    range.push(rgb(217, 217, 217));
  }
  if (legendValues.indexOf("N") !== -1 && mutType === "nuc") {
    range.push(rgb(153, 153, 153));
  }
  if (legendValues.indexOf("X") !== -1) {
    range.push(rgb(102, 102, 102));
  }
  return {
    colorScale: scaleOrdinal().domain(domain).range(range),
    legendValues
  };
}

function createOrdinalScale(colorBy, t1nodes, t2nodes) {
  /* currently, ordinal scales are only implemented for those with integer values.
  TODO: we should be able to have non-numerical ordinal scales (e.g.
  `["small", "medium", "large"]`) however we currently cannot specify this ordering
  in the dataset JSON. Ordinal scales may also want to be used for numerical but
  non-integer values */
  let legendValues = getDiscreteValuesFromTree(t1nodes, t2nodes, colorBy);
  const allInteger = legendValues.every((x) => Number.isInteger(x));
  let continuous = false;
  let colorScale, legendBounds;

  if (allInteger) {
    const minMax = getMinMaxFromTree(t1nodes, t2nodes, colorBy);
    if (minMax[1]-minMax[0]<=colors.length) {
      legendValues = [];
      for (let i=minMax[0]; i<=minMax[1]; i++) legendValues.push(i);
      colorScale = createDiscreteScale(legendValues, "ordinal");
    } else {
      /* too many integers for the provided colours -- using continuous scale instead */
      /* TODO - when we refactor this code we can abstract into functions to stop code
      duplication, as this is identical to that of the continuous scale below */
      console.warn("Using a continous scale as there are too many values in the ordinal scale");
      continuous = true;
      const scale = scaleLinear().domain(genericDomain.map((d) => minMax[0] + d * (minMax[1] - minMax[0]))).range(colors[9]);
      colorScale = (val) => isValueValid(val) ? scale(val): unknownColor;
      const spread = minMax[1] - minMax[0];
      const dp = spread > 5 ? 2 : 3;
      legendValues = genericDomain.map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)));
      // eslint-disable-next-line no-compare-neg-zero
      if (legendValues[0] === -0) legendValues[0] = 0; /* hack to avoid bugs */
      legendBounds = createLegendBounds(legendValues);
    }
  } else {
    console.warn("Using a categorical scale as currently ordinal scales must only contain integers");
    continuous = false;
    colorScale = createDiscreteScale(legendValues, "categorical");
  }
  return {continuous, colorScale, legendValues, legendBounds};
}

function createContinuousScale(colorBy, t1nodes, t2nodes) {
  // console.log("making a continuous color scale for ", colorBy);
  let minMax;
  switch (colorBy) {
    case "lbi":
      minMax = [0, 0.7];
      break;
    case "num_date":
      break; /* minMax not needed for num_date */
    default:
      minMax = getMinMaxFromTree(t1nodes, t2nodes, colorBy);
  }

  /* make the continuous scale */
  let domain, range;
  switch (colorBy) {
    case "num_date":
      /* we want the colorScale to "focus" on the tip dates, and be spaced according to sampling */
      let rootDate = getTraitFromNode(t1nodes[0], "num_date");
      let vals = t1nodes.filter((n) => !n.hasChildren)
        .map((n) => getTraitFromNode(n, "num_date"));
      if (t2nodes) {
        const treeTooRootDate = getTraitFromNode(t2nodes[0], "num_date");
        if (treeTooRootDate < rootDate) rootDate = treeTooRootDate;
        vals.concat(
          t2nodes.filter((n) => !n.hasChildren)
            .map((n) => getTraitFromNode(n, "num_date"))
        );
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

  /* construct the legend values & their respective bounds */
  let legendValues;
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
  // eslint-disable-next-line no-compare-neg-zero
  if (legendValues[0] === -0) legendValues[0] = 0; /* hack to avoid bugs */

  return {
    continuous: true,
    colorScale: (val) => isValueValid(val) ? scale(val) : unknownColor,
    legendBounds: createLegendBounds(legendValues),
    legendValues
  };
}

function getMinMaxFromTree(nodes, nodesToo, attr) {
  const arr = nodesToo ? nodes.concat(nodesToo) : nodes.slice();
  const vals = arr.map((n) => getTraitFromNode(n, attr))
    .filter((n) => n !== undefined)
    .filter((item, i, ar) => ar.indexOf(item) === i)
    .map((v) => +v); // coerce throw new Error(to numeric
  return [min(vals), max(vals)];
}

/* this creates a (ramped) list of colours
   this is necessary as ordinal scales can't interpololate colours.
   range: [a,b], the colours to go between */
function createListOfColors(n, range) {
  const scale = scaleLinear().domain([0, n])
    .interpolate(interpolateHcl)
    .range(range);
  return d3Range(0, n).map(scale);
}

function getDiscreteValuesFromTree(nodes, nodesToo, attr) {
  const stateCount = countTraitsAcrossTree(nodes, [attr], false, false)[attr];
  if (nodesToo) {
    const stateCountSecondTree = countTraitsAcrossTree(nodesToo, [attr], false, false)[attr];
    for (const state of stateCountSecondTree.keys()) {
      const currentCount = stateCount.get(state) || 0;
      stateCount.set(state, currentCount+1);
    }
  }
  const domain = sortedDomain(Array.from(stateCount.keys()).filter((x) => isValueValid(x)), attr, stateCount);
  return domain;
}

/**
 * Dynamically create legend values based on visibility for ordinal and categorical scale types.
 */
export function createVisibleLegendValues({colorBy, scaleType, genotype, legendValues, treeNodes, treeTooNodes, visibility, visibilityToo}) {
  if (visibility) {
    // filter according to scaleType, e.g. continuous is different to categorical which is different to boolean
    // filtering will involve looping over reduxState.tree.nodes and comparing with reduxState.tree.visibility
    if (scaleType === "ordinal" || scaleType === "categorical") {
      let legendValuesObserved = treeNodes
        .filter((n, i) => (!n.hasChildren && visibility[i]===NODE_VISIBLE))
        .map((n) => genotype ? n.currentGt : getTraitFromNode(n, colorBy));
      // if the 2nd tree is enabled, compute visible legend values and merge the values.
      if (treeTooNodes && visibilityToo) {
        const legendValuesObservedToo = treeTooNodes
          .filter((n, i) => (!n.hasChildren && visibilityToo[i]===NODE_VISIBLE))
          .map((n) => genotype ? n.currentGt : getTraitFromNode(n, colorBy));
        legendValuesObserved = [...legendValuesObserved, ...legendValuesObservedToo];
      }
      legendValuesObserved = new Set(legendValuesObserved);
      const visibleLegendValues = legendValues.filter((v) => legendValuesObserved.has(v));
      return visibleLegendValues;
    }
  }
  return legendValues.slice();
}

function createDiscreteScale(domain, type) {
  // note: colors[n] has n colors
  let colorList;
  if (type==="ordinal" || type==="categorical") {
    /* TODO: use different colours! */
    colorList = domain.length <= colors.length ?
      colors[domain.length].slice() :
      colors[colors.length - 1].slice();
  }
  const scale = scaleOrdinal().domain(domain).range(colorList);
  return (val) => ((val === undefined || domain.indexOf(val) === -1)) ? unknownColor : scale(val);
}

function booleanColorScale(val) {
  if (!isValueValid(val)) return unknownColor;
  if (["true", "1", "yes"].includes(String(val).toLowerCase())) return "#4C90C0";
  return "#CBB742";
}

function createLegendBounds(legendValues) {
  const valBetween = (x0, x1) => x0 + 0.5*(x1-x0);
  const len = legendValues.length;
  const legendBounds = {};
  legendBounds[legendValues[0]] = [0, valBetween(legendValues[0], legendValues[1])];
  for (let i = 1; i < len - 1; i++) {
    legendBounds[legendValues[i]] = [valBetween(legendValues[i-1], legendValues[i]), valBetween(legendValues[i], legendValues[i+1])];
  }
  legendBounds[legendValues[len-1]] = [valBetween(legendValues[len-2], legendValues[len-1]), 10000];
  return legendBounds;
}
