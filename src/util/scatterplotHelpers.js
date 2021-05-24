import { calcColorScale } from "./colorScale";
import { makeGenotypeLabel, isColorByGenotype} from "./getGenotype";

export function collectAvailableScatterVariables(colorings, colorBy) {
  let options = Object.keys(colorings)
    .filter((key) => colorings[key].type!=="boolean")
    .map((key) => ({
      value: key,
      label: colorings[key].title || key
    }));

  /* If colorBy is genotype, then we allow it to be an option, else we remove it */
  const genotypeLabel = makeGenotypeLabel(colorBy);
  if (genotypeLabel) {
    options.forEach((o) => {
      if (o.value==="gt") o.label = genotypeLabel;
    });
  } else {
    options = options.filter((o) => o.value!=="gt");
  }
  options.unshift({value: "div", label: "Divergence"});

  return options;
}

/**
 * Return a (validated) `scatterVariables` object, given any existing scatterVariables (which may themselves be invalid)
 */
export function validateScatterVariables(controls, metadata, tree, isClock) {
  const {distanceMeasure, colorBy } = controls;
  const existingScatterVariables = {...controls.scatterVariables};
  const availableOptions = collectAvailableScatterVariables(metadata.colorings, controls.colorBy);
  const scatterVariables = {};
  // default is to show branches, unless the existing state says otherwise
  scatterVariables.showBranches = Object.prototype.hasOwnProperty.call(existingScatterVariables, "showBranches") ?
    existingScatterVariables.showBranches : true;
  // default is to show regressions in clock mode, hide them for other scatterplots (unless the existing state says otherwise)
  scatterVariables.showRegression = Object.prototype.hasOwnProperty.call(existingScatterVariables, "showRegression") ?
    existingScatterVariables.showRegression : !!isClock;
  // we only validate the x & y values if we're _not_ in clock mode, as we don't use them there!
  if (!isClock) {
    // default X value is existing state, or the distanceMeasure. It should not be the existing y value (if that's set)
    const xOption = getFirstMatchingScatterVariable(availableOptions, [existingScatterVariables.x, distanceMeasure], existingScatterVariables.y);
    scatterVariables.x = xOption.value;
    scatterVariables.xLabel = xOption.label;
    // default Y value is similar, but we default to the colorBy (if available)
    const yOption = getFirstMatchingScatterVariable(availableOptions, [existingScatterVariables.y, colorBy], xOption.value);
    scatterVariables.y = yOption.value;
    scatterVariables.yLabel = yOption.label;
    for (const axis of ["x", "y"]) {
      addScatterAxisInfo(scatterVariables, axis, controls, tree, metadata);
    }
    if (!scatterVariables.xContinuous || !scatterVariables.yContinuous) scatterVariables.showRegression= false;
  }
  return scatterVariables;
}

/**
 * Given an array of `options` (in the shape that <Select> expects, i.e. each element
 * is an object with `value` and `label` props), return one option.
 * First scans through a list of values to try (`tryTheseFirst`)
 * Will not return an option whose key matches `notThisValue`
 */
export function getFirstMatchingScatterVariable(options, tryTheseFirst, notThisValue) {
  const availableValues = options.map((opt) => opt.value);
  for (let i=0; i<tryTheseFirst.length; i++) {
    if (tryTheseFirst[i] && tryTheseFirst[i]!==notThisValue) {
      const value = isColorByGenotype(tryTheseFirst[i]) ? "gt" : tryTheseFirst[i];
      const optionsIdx = availableValues.indexOf(value);
      if (optionsIdx!==-1) {
        return options[optionsIdx];
      }
    }
  }
  for (let i=0; i<availableValues.length; i++) {
    if (availableValues[i]!==notThisValue) {
      return options[i];
    }
  }
  return undefined;
}

/**
 * Given a colorBy and a scatterplot axes, calculate whether the axes is
 * continuous or not. If not, calculate the domain. For this we use the same code
 * as colour scale construction to find a domain. There are opportunities for refactoring here
 * to improve performance, as we only use two properties from the returned object.
 * Similarly, if one of the axes variables is the current colorBy, we could avoid recalculating this.
 * @param {Object} scatterVariables
 * @param {string} axis values: "x" or "y"
 * @param {Object} controls
 * @param {Object} controls
 * @param {Object} metadata
 * @returns {Object} the `scatterVariables` param with modifications
 * @sideEffects adds keys `${axis}Continuous`, `${axis}Domain` to the `scatterVariables` param.
 */
export function addScatterAxisInfo(scatterVariables, axis, controls, tree, metadata) {
  const axisVar = scatterVariables[axis];
  if (["div", "num_date"].includes(axisVar) || metadata.colorings[axisVar].type==="continuous") {
    scatterVariables[`${axis}Continuous`] = true;
    scatterVariables[`${axis}Domain`] = undefined;
    return scatterVariables;
  }
  const trait = scatterVariables[axis]==="gt" ? controls.colorBy : scatterVariables[axis];
  const colorScale = calcColorScale(trait, controls, tree, null, metadata);
  return addScatterAxisGivenColorScale(scatterVariables, colorScale, axis);
}

export function addScatterAxisGivenColorScale(scatterVariables, colorScale, axis) {
  if (colorScale.scaleType==="continuous") {
    scatterVariables[`${axis}Continuous`] = true;
    scatterVariables[`${axis}Domain`] = undefined;
    return scatterVariables;
  }
  scatterVariables[`${axis}Continuous`] = false;
  scatterVariables[`${axis}Domain`] = colorScale.domain.slice();
  return scatterVariables;
}
