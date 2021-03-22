

export function collectScatterVariables(colorings, scatterVariables) {

  // todo: genotype (special case)
  const options = Object.keys(colorings)
    .filter((key) => key!=="gt")
    .map((key) => ({
      value: key,
      label: colorings[key].title || key
    }));
  options.unshift({value: "div", label: "Divergence"});

  const selected = {
    x: options.filter((o) => o.value===scatterVariables.x)[0] || undefined,
    y: options.filter((o) => o.value===scatterVariables.y)[0] || undefined
  };

  return {options, selected};
}
