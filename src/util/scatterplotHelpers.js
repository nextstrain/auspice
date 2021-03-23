

export function collectScatterVariables(colorings, scatterVariables, validate=false) {
  // todo: genotype (special case)
  const options = Object.keys(colorings)
    .filter((key) => key!=="gt")
    .filter((key) => colorings[key].type==="continuous") // work needed to render non-continuous scales in PhyloTree
    .map((key) => ({
      value: key,
      label: colorings[key].title || key
    }));
  options.unshift({value: "div", label: "Divergence"});

  let x = options.filter((o) => o.value===scatterVariables.x)[0];
  let y = options.filter((o) => o.value===scatterVariables.y)[0];

  if (validate) {
    // if the supplied variables aren't within `options` select some that are!
    // values can be `undefined`, this results in "scatter" being selected but the user needs to select a value
    if (!x) x = _getFirstNonMatch(options, y);
    if (!y) y = _getFirstNonMatch(options, x);
  }

  const selected = {x, y};
  return {options, selected};
}

export function getStartingScatterVariables(colorings, distanceMeasure, colorBy) {
  const {selected} = collectScatterVariables(colorings, {x: distanceMeasure, y: colorBy}, true);
  return {
    x: selected.x && selected.x.value,
    y: selected.y && selected.y.value,
    showBranches: true
  };
}


function _getFirstNonMatch(options, other) {
  const availableValues = options.map((opt) => opt.value);
  const otherValue = other && other.value;
  for (let i=0; i<availableValues.length; i++) {
    if (availableValues[i]!==otherValue) {
      return options[i];
    }
  }
  return undefined;
}
