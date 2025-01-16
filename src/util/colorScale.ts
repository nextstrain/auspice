import { scaleLinear, scaleOrdinal } from "d3-scale";
import { min, max, range as d3Range } from "d3-array";
import { rgb } from "d3-color";
import { interpolateHcl } from "d3-interpolate";
import { genericDomain, colors, genotypeColors, isValueValid, NODE_VISIBLE } from "./globals";
import { countTraitsAcrossTree } from "./treeCountingHelpers";
import { getExtraVals, numDate } from "./colorHelpers";
import { isColorByGenotype, decodeColorByGenotype } from "./getGenotype";
import { setGenotype, orderOfGenotypeAppearance } from "./setGenotype";
import { getTraitFromNode } from "./treeMiscHelpers";
import { sortedDomain } from "./sortedDomain";
import { ColoringInfo, Legend, Metadata } from "../metadata";
import { ColorScale, ControlsState, Genotype, LegendBounds, LegendLabels, LegendValues, ScaleType } from "../reducers/controls";
import { ReduxNode, TreeState, TreeTooState, Visibility } from "../reducers/tree/types";

export const unknownColor = "#ADB1B3";

/**
 * calculate the color scale.
 */
export const calcColorScale = (
  /** provided trait to use as color */
  colorBy: string,

  controls: ControlsState,
  tree: TreeState,
  treeToo: TreeTooState,
  metadata: Metadata,
): ColorScale => {
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
    let colorScale: (val: any) => string;
    let legendValues: LegendValues;
    let legendBounds: LegendBounds;
    let legendLabels: LegendLabels;
    let domain: unknown[];

    let genotype: Genotype;
    if (isColorByGenotype(colorBy)) {
      genotype = decodeColorByGenotype(colorBy);
      setGenotype(tree.nodes, genotype.gene, genotype.positions, metadata.rootSequence); /* modifies nodes recursively */
      if (treeToo && metadata.identicalGenomeMapAcrossBothTrees) {
        setGenotype(treeToo.nodes, genotype.gene, genotype.positions, metadata.rootSequenceSecondTree);
      }
    }
    const scaleType: ScaleType = genotype ? "categorical" : colorings[colorBy].type;
    if (genotype) {
      ({legendValues, colorScale} = createScaleForGenotype(tree.nodes, treeToo?.nodes, genotype.aa));
      domain = [...legendValues];
    } else if (colorings && colorings[colorBy]) {
      if (scaleType === "temporal" || colorBy === "num_date") {
        ({continuous, colorScale, legendBounds, legendValues} =
          createTemporalScale(colorBy, colorings[colorBy].scale, tree.nodes, treeTooNodes));
      } else if (scaleType === "continuous") {
        ({continuous, colorScale, legendBounds, legendValues} =
          createContinuousScale(colorBy, colorings[colorBy].scale, tree.nodes, treeTooNodes));
      } else if (colorings[colorBy].scale) { /* scale set via JSON */
        ({continuous, legendValues, colorScale} =
          createNonContinuousScaleFromProvidedScaleMap(colorBy, colorings[colorBy].scale, tree.nodes, treeTooNodes));
      } else if (scaleType === "categorical") {
        legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
        colorScale = createDiscreteScale(legendValues, "categorical");
      } else if (scaleType === "ordinal") {
        ({continuous, colorScale, legendValues, legendBounds} = createOrdinalScale(colorBy, tree.nodes, treeTooNodes));
      } else if (scaleType === "boolean") {
        legendValues = getDiscreteValuesFromTree(tree.nodes, treeTooNodes, colorBy);
        colorScale = booleanColorScale;
      } else {
        throw new Error(`ColorBy ${colorBy} invalid type -- ${scaleType}`);
      }

      /* We store a copy of the `domain`, which for non-continuous scales is a ordered list of values for this colorBy,
      for future list */
      if (scaleType !== 'continuous') domain = legendValues.slice();

      /* Use user-defined `legend` data (if any) to define custom legend elements */
      const legendData = parseUserProvidedLegendData(colorings[colorBy].legend, legendValues, scaleType);
      if (legendData) {
        ({legendValues, legendLabels, legendBounds} = legendData);
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
      legendLabels,
      genotype,
      domain,
      scaleType: scaleType,
      visibleLegendValues: visibleLegendValues
    };
  } catch (err) {
    /* Catch all errors to avoid app crashes */
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error creating color scales. Details:\n", errorMessage);
    return {
      scale: () => unknownColor,
      continuous: false,
      colorBy,
      version: controls.colorScale === undefined ? 1 : controls.colorScale.version + 1,
      legendValues: ["unknown"],
      legendBounds: {unknown: [-Infinity, Infinity]},
      genotype: null,
      scaleType: null,
      domain: [],
      visibleLegendValues: ["unknown"]
    };
  }
};

export function createNonContinuousScaleFromProvidedScaleMap(
  colorBy: string,
  providedScale: [string | number, string][],
  t1nodes: ReduxNode[],
  t2nodes: ReduxNode[] | undefined,
): {
  continuous: boolean
  legendValues: LegendValues
  colorScale: ColorScale["scale"]
} {
  // console.log(`calcColorScale: colorBy ${colorBy} provided us with a scale (list of [trait, hex])`);
  if (!Array.isArray(providedScale)) {
    throw new Error(`${colorBy} has defined a scale which wasn't an array`);
  }
  /* The providedScale may have duplicate names (not ideal, but it happens). In this case we should
  filter out duplicates (taking the first of the duplicates is fine) & print a console warning */
  const colorMap = new Map<string | number, string>();
  for (const [name, colorHex] of providedScale) {
    if (colorMap.has(name)) {
      console.warn(`User provided color scale contained a duplicate entry for ${colorBy}→${name} which is ignored.`);
    } else {
      colorMap.set(name, colorHex);
    }
  }
  let domain = Array.from(colorMap).map((x) => x[0]);

  /* create shades of grey for values in the tree which weren't defined in the provided scale */
  const extraVals: string[] = getExtraVals(t1nodes, t2nodes, colorBy, domain);
  if (extraVals.length) { // we must add these to the domain + provide a color value
    domain = domain.concat(extraVals);
    const extraColors = createListOfColors(extraVals.length, ["#BDC3C6", "#868992"]);
    extraVals.forEach((val, idx) => {
      colorMap.set(val, extraColors[idx]);
    });
  }
  return {
    continuous: false, /* colorMaps can't (yet) be continuous */
    legendValues: domain,
    colorScale: (val: string) => (colorMap.get(val) || unknownColor)
  };
}

function createScaleForGenotype(
  t1nodes: ReduxNode[],
  t2nodes: ReduxNode[],
  aaGenotype: boolean,
): {
  colorScale: ColorScale["scale"]
  legendValues: LegendValues
} {
  const legendValues = orderOfGenotypeAppearance(t1nodes, t2nodes, aaGenotype);
  const trueValues = aaGenotype ?
    legendValues.filter((x) => x !== "X" && x !== "-" && x !== "") :
    legendValues.filter((x) => x !== "X" && x !== "-" && x !== "N" && x !== "");
  const domain = [undefined, ...legendValues];
  const range = [unknownColor, ...genotypeColors.slice(0, trueValues.length)];
  // Bases are returned by orderOfGenotypeAppearance in order, unknowns at end
  if (legendValues.indexOf("-") !== -1) {
    range.push(rgb(217, 217, 217).formatHex());
  }
  if (legendValues.indexOf("N") !== -1 && !aaGenotype) {
    range.push(rgb(153, 153, 153).formatHex());
  }
  if (legendValues.indexOf("X") !== -1) {
    range.push(rgb(102, 102, 102).formatHex());
  }
  return {
    colorScale: scaleOrdinal<string>().domain(domain).range(range),
    legendValues
  };
}

function createOrdinalScale(
  colorBy: string,
  t1nodes: ReduxNode[],
  t2nodes: ReduxNode[],
): {
  continuous: boolean
  colorScale: ColorScale["scale"]
  legendValues: LegendValues
  legendBounds: LegendBounds
} {
  /* currently, ordinal scales are only implemented for those with integer values.
  TODO: we should be able to have non-numerical ordinal scales (e.g.
  `["small", "medium", "large"]`) however we currently cannot specify this ordering
  in the dataset JSON. Ordinal scales may also want to be used for numerical but
  non-integer values */
  let legendValues = getDiscreteValuesFromTree(t1nodes, t2nodes, colorBy);
  const allInteger = legendValues.every((x) => Number.isInteger(x));
  let continuous = false;
  let colorScale: ColorScale["scale"];
  let legendBounds: Record<number, [number, number]>;

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
      const scale = scaleLinear<string>().domain(genericDomain.map((d) => minMax[0] + d * (minMax[1] - minMax[0]))).range(colors[9]);
      colorScale = (val) => isValueValid(val) ? scale(val): unknownColor;
      const spread = minMax[1] - minMax[0];
      const dp = spread > 5 ? 2 : 3;
      legendValues = genericDomain.map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)));
      // Hack to avoid a bug: https://github.com/nextstrain/auspice/issues/540
      if (Object.is(legendValues[0], -0)) legendValues[0] = 0;
      legendBounds = createLegendBounds(legendValues);
    }
  } else {
    console.warn("Using a categorical scale as currently ordinal scales must only contain integers");
    continuous = false;
    colorScale = createDiscreteScale(legendValues, "categorical");
  }
  return {continuous, colorScale, legendValues, legendBounds};
}

function createContinuousScale(
  colorBy: string,
  providedScale,
  t1nodes: ReduxNode[],
  t2nodes: ReduxNode[],
): {
  continuous: boolean
  colorScale: ColorScale["scale"]
  legendBounds: LegendBounds
  legendValues: LegendValues
} {

  const minMax = getMinMaxFromTree(t1nodes, t2nodes, colorBy);

  /* user-defined anchor points across the scale */
  const anchorPoints = _validateAnchorPoints(providedScale, (val) => typeof val==="number");

  /* make the continuous scale */
  let domain: number[];
  let range: string[];
  if (anchorPoints) {
    domain = anchorPoints.map((pt) => pt[0]);
    range = anchorPoints.map((pt) => pt[1]);
  } else {
    range = colors[9];
    domain = genericDomain.map((d) => minMax[0] + d * (minMax[1] - minMax[0]));
  }
  const scale = scaleLinear<string>().domain(domain).range(range);

  const spread = minMax[1] - minMax[0];
  const dp = spread > 5 ? 2 : 3;
  /* if legend values are identical (for the specified number of decimal places) then we
  should filter them out */
  const legendValues = genericDomain
    .map((d) => parseFloat((minMax[0] + d*spread).toFixed(dp)))
    .filter((el, idx, values) => values.indexOf(el)===idx);

  // Hack to avoid a bug: https://github.com/nextstrain/auspice/issues/540
  if (Object.is(legendValues[0], -0)) legendValues[0] = 0;

  return {
    continuous: true,
    colorScale: (val: number) => isValueValid(val) ? scale(val) : unknownColor,
    legendBounds: createLegendBounds(legendValues),
    legendValues
  };
}


function createTemporalScale(
  colorBy: string,
  providedScale,
  t1nodes: ReduxNode[],
  t2nodes: ReduxNode[],
): {
  continuous: boolean
  colorScale: ColorScale["scale"]
  legendBounds: LegendBounds
  legendValues: LegendValues
} {

  let domain: number[];
  let range: string[];
  const anchorPoints = _validateAnchorPoints(providedScale, (val) => numDate(val)!==undefined);
  if (anchorPoints) {
    domain = anchorPoints.map((pt) => numDate(pt[0]));
    range = anchorPoints.map((pt) => pt[1]);
  } else {
    /* construct a domain / range which "focuses" on the tip dates, and be spaced according to sampling */
    let rootDate = numDate(getTraitFromNode(t1nodes[0], colorBy));
    let vals = t1nodes.filter((n) => !n.hasChildren)
      .map((n) => numDate(getTraitFromNode(n, colorBy)));
    if (t2nodes) {
      const treeTooRootDate = numDate(getTraitFromNode(t2nodes[0], colorBy));
      if (treeTooRootDate < rootDate) rootDate = treeTooRootDate;
      vals.concat(
        t2nodes.filter((n) => !n.hasChildren)
          .map((n) => numDate(getTraitFromNode(n, colorBy)))
      );
    }
    vals = vals.sort();
    domain = [rootDate];
    const n = 10;
    const spaceBetween = Math.trunc(vals.length / (n - 1));
    for (let i = 0; i < (n-1); i++) domain.push(vals[spaceBetween*i]);
    domain.push(vals[vals.length-1]);
    domain = [...new Set(domain)]; /* filter to unique values only */
    range = colors[domain.length]; /* use the right number of colours */
  }

  const scale = scaleLinear<string>().domain(domain).range(range);

  const legendValues = anchorPoints ? domain.slice() : domain.slice(1);

  // Hack to avoid a bug: https://github.com/nextstrain/auspice/issues/540
  if (Object.is(legendValues[0], -0)) legendValues[0] = 0;

  const colorScale = (val) => {
    const d = numDate(val);
    return d===undefined ? unknownColor : scale(d);
  };

  return {
    continuous: true,
    colorScale,
    legendBounds: createLegendBounds(legendValues),
    legendValues
  };
}


function getMinMaxFromTree(
  nodes: ReduxNode[],
  nodesToo: ReduxNode[],
  attr: string,
): [number, number] {
  const arr = nodesToo ? nodes.concat(nodesToo) : nodes.slice();
  const vals: number[] = arr.map((n) => getTraitFromNode(n, attr))
    .filter((n) => n !== undefined)
    .filter((item, i, ar) => ar.indexOf(item) === i)
    .map((v) => +v); // coerce throw new Error(to numeric
  return [min(vals), max(vals)];
}

/**
 * this creates a (ramped) list of colours
 * this is necessary as ordinal scales can't interpolate colours.
 */
function createListOfColors(
  n: number,

  /** the colours to go between */
  range: [string, string],
) {
  const scale = scaleLinear<string>().domain([0, n])
    .interpolate(interpolateHcl)
    .range(range);
  return d3Range(0, n).map(scale);
}

function getDiscreteValuesFromTree(
  nodes: ReduxNode[],
  nodesToo: ReduxNode[] | undefined,
  attr: string,
): LegendValues {
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
 * A helper function for when we wish to know the order a trait's values _would_ be displayed.
 * The trait does not need to be the current colouring.
 * This code is in this file to help future refactors, as the colorScale code has grown a lot
 * and could be greatly improved.                                             james, dec 2021
 */
export function getLegendOrder(
  attr: string,
  coloringInfo: ColoringInfo,
  nodesA: ReduxNode[],
  nodesB: ReduxNode[] | undefined,
): LegendValues {
  if (isColorByGenotype(attr)) {
    console.warn("legend ordering for genotypes not yet implemented");
    return [];
  }
  if (coloringInfo.type === "continuous") {
    console.warn("legend ordering for continuous scales not yet implemented");
    return [];
  }
  if (coloringInfo.scale) {
    return createNonContinuousScaleFromProvidedScaleMap(attr, coloringInfo.scale, nodesA, nodesB).legendValues;
  }
  return getDiscreteValuesFromTree(nodesA, nodesB, attr);
}

/**
 * Dynamically create legend values based on visibility for ordinal and categorical scale types.
 */
export function createVisibleLegendValues({
  colorBy,
  scaleType,
  genotype,
  legendValues,
  treeNodes,
  treeTooNodes,
  visibility,
  visibilityToo,
}: {
  colorBy: string
  scaleType: ScaleType
  genotype: Genotype
  legendValues: LegendValues
  treeNodes: ReduxNode[]
  treeTooNodes?: ReduxNode[] | null
  visibility: Visibility[]
  visibilityToo?: Visibility[]
}): LegendValues {
  if (visibility) {
    // filter according to scaleType, e.g. continuous is different to categorical which is different to boolean
    // filtering will involve looping over reduxState.tree.nodes and comparing with reduxState.tree.visibility
    if (scaleType === "ordinal" || scaleType === "categorical") {
      let legendValuesObserved: LegendValues = treeNodes
        .filter((n, i) => (!n.hasChildren && visibility[i]===NODE_VISIBLE))
        .map((n) => genotype ? n.currentGt : getTraitFromNode(n, colorBy));
      // if the 2nd tree is enabled, compute visible legend values and merge the values.
      if (treeTooNodes && visibilityToo) {
        const legendValuesObservedToo: LegendValues = treeTooNodes
          .filter((n, i) => (!n.hasChildren && visibilityToo[i]===NODE_VISIBLE))
          .map((n) => genotype ? n.currentGt : getTraitFromNode(n, colorBy));
        legendValuesObserved = [...legendValuesObserved, ...legendValuesObservedToo];
      }
      const legendValuesObservedSet = new Set(legendValuesObserved);
      const visibleLegendValues = legendValues.filter((v) => legendValuesObservedSet.has(v));
      return visibleLegendValues;
    }
  }
  return legendValues.slice();
}

function createDiscreteScale(domain: string[], type: ScaleType) {
  // note: colors[n] has n colors
  let colorList: string[];
  if (type==="ordinal" || type==="categorical") {
    /* TODO: use different colours! */
    colorList = domain.length < colors.length ?
      colors[domain.length].slice() :
      colors[colors.length - 1].slice();
  }
  const scale = scaleOrdinal<string>().domain(domain).range(colorList);
  return (val) => ((val === undefined || domain.indexOf(val) === -1)) ? unknownColor : scale(val);
}

function booleanColorScale(val: unknown): string {
  if (!isValueValid(val)) return unknownColor;
  if (["true", "1", "yes"].includes(String(val).toLowerCase())) return "#4C90C0";
  return "#CBB742";
}

function createLegendBounds(legendValues: number[]): LegendBounds {
  const valBetween = (x0: number, x1: number) => x0 + 0.5*(x1-x0);
  const len = legendValues.length;
  const legendBounds: LegendBounds = {};
  legendBounds[legendValues[0]] = [-Infinity, valBetween(legendValues[0], legendValues[1])];
  for (let i = 1; i < len - 1; i++) {
    legendBounds[legendValues[i]] = [valBetween(legendValues[i-1], legendValues[i]), valBetween(legendValues[i], legendValues[i+1])];
  }
  legendBounds[legendValues[len-1]] = [valBetween(legendValues[len-2], legendValues[len-1]), Infinity];
  return legendBounds;
}

function _validateAnchorPoints(
  providedScale: unknown[],
  validator: (val: unknown) => boolean,
): unknown[] | false {
  if (!Array.isArray(providedScale)) return false;
  const ap = providedScale.filter((item) =>
    Array.isArray(item) && item.length===2 &&
    validator(item[0]) &&
    typeof item[1]==="string" && item[1].match(/#[0-9A-Fa-f]{6}/) // schema demands full-length colour hexes
  );
  if (ap.length<2) return false; // need at least 2 valid points
  return ap;
}

/**
 * Parse the user-defined `legend` for a given coloring to produce legendValues, legendLabels and legendBounds.
 */
function parseUserProvidedLegendData(
  providedLegend: Legend | undefined,

  /** Dynamically generated legendValues (via traversal of tree(s)). */
  currentLegendValues: LegendValues,

  scaleType: ScaleType,
): {
  legendValues: LegendValues
  legendLabels: LegendLabels
  legendBounds: LegendBounds
} | false {
  if (!Array.isArray(providedLegend)) return false;
  if (scaleType==='temporal') {
    console.error("Auspice currently doesn't allow a JSON-provided 'legend' for temporal colorings, "+
      "however all provided 'scale' entries will be shown in the legend");
    return false;
  }

  const data = scaleType==="continuous" ?
    providedLegend.filter((d) => typeof d.value === "number") : // continuous scales _must_ have numeric stops
    providedLegend.filter((d) => currentLegendValues.includes(d.value)); // other scales require the value to exist
  if (!data.length) {
    console.warn("Provided legend info for this coloring doesn't match any values in the tree!");
    return false;
  }

  const legendValues: LegendValues = data.map((d) => d.value);

  const legendLabels: LegendLabels = new Map(
    data.map((d) => {
      return (typeof d.display === "string" || typeof d.display === "number") ? [d.value, d.display] : [d.value, d.value];
    })
  );

  let legendBounds: LegendBounds = {};
  if (scaleType==="continuous") {
    const boundArrays = data.map((d) => d.bounds)
      .filter((b) => Array.isArray(b) && b.length === 2 && typeof b[0] === "number" && typeof b[1] === "number")
      .map(([a, b]): [number, number] => a > b ? [b, a] : [a, b]) // ensure each bound is correctly ordered
      .filter(([a, b], idx, arr) => { // ensure no overlap with previous bounds.
        for (let i=0; i<idx; i++) {
          const previousBound = arr[i];
          if ((a < previousBound[1] && a > previousBound[0]) || (b < previousBound[1] && b > previousBound[0])) {
            console.warn(`Legend bounds must not overlap. Check [${a}, ${b}] and [${previousBound[0]}, ${previousBound[1]}]. Auspice will create its own bounds.`);
            return false;
          }
        }
        return true;
      });
    if (boundArrays.length===legendValues.length) {
      legendValues.forEach((v, i) => {legendBounds[v]=boundArrays[i];});
    } else {
      legendBounds = createLegendBounds(legendValues);
    }
  }
  return {legendValues, legendLabels, legendBounds};
}
