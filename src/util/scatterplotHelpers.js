

export function collectAvailableScatterVariables(colorings) {
  // todo: genotype (special case)
  const options = Object.keys(colorings)
    .filter((key) => key!=="gt")
    .filter((key) => colorings[key].type==="continuous") // work needed to render non-continuous scales in PhyloTree
    .map((key) => ({
      value: key,
      label: colorings[key].title || key
    }));
  options.unshift({value: "div", label: "Divergence"});
  return options;
}

/**
 * Return a (validated) `scatterVariables` object, given any existing scatterVariables (which may themselves be invalid)
 */
export function validateScatterVariables(existingScatterVariables={}, colorings, distanceMeasure, colorBy, isClock) {
  const availableOptions = collectAvailableScatterVariables(colorings);
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
    const xOption = _getFirstMatchingOption(availableOptions, [existingScatterVariables.x, distanceMeasure], existingScatterVariables.y);
    scatterVariables.x = xOption.value;
    scatterVariables.xLabel = xOption.label;
    // default Y value is similar, but we default to the colorBy (if available)
    const yOption = _getFirstMatchingOption(availableOptions, [existingScatterVariables.y, colorBy], xOption.value);
    scatterVariables.y = yOption.value;
    scatterVariables.yLabel = yOption.label;
  }
  return scatterVariables;
}

/**
 * Given an array of `options` (in the shape that <Select> expects, i.e. each element
 * is an object with `value` and `label` props), return one option.
 * First scans through a list of values to try (`tryTheseFirst`)
 * Will not return an option whose key matches `notThisValue`
 */
function _getFirstMatchingOption(options, tryTheseFirst, notThisValue) {
  const availableValues = options.map((opt) => opt.value);
  for (let i=0; i<tryTheseFirst.length; i++) {
    if (tryTheseFirst[i] && tryTheseFirst[i]!==notThisValue) {
      const optionsIdx = availableValues.indexOf(tryTheseFirst[i]);
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
