import { unknownColor, createNonContinuousScaleFromProvidedScaleMap } from "../src/util/colorScale";

const crypto = require("crypto");

/* ---------------------------------------------------------------------- */

test("Test that a JSON-provided scale results in nodes using the correct colours", () => {
  const nodes = makeNodes(50, {country: ['A', 'B', 'D', undefined]});
  const providedScale = [['A', 'AMBER'], ['B', 'BLUE'], ['C', "CYAN"]];
  const {colorScale} = createNonContinuousScaleFromProvidedScaleMap("country", providedScale, nodes, undefined);
  expect(colorScale('A')).toEqual("AMBER");
  expect(colorScale('B')).toEqual("BLUE");
  expect(colorScale('C')).toEqual("CYAN"); // Note that 'C' is in the colorMap, even though it is not defined on tree
  expect(colorScale('D')).not.toEqual(unknownColor); // 'D' is in tree => should be given a grey color, not the unknown color
  expect(colorScale(undefined)).toEqual(unknownColor); // check `undefined` case returns the unknownColor
});

test("Test that a misformatted JSON-provided scale throws an error", () => {
  const nodes = makeNodes(50, {country: ['A', 'B', 'D', undefined]});
  const providedScale = {A: 'AMBER', B: 'BLUE', C: "CYAN"};
  expect(() => {createNonContinuousScaleFromProvidedScaleMap("country", providedScale, nodes, undefined);})
    .toThrow(/has defined a scale which wasn't an array/);
});


/** for the purposes of generating colorScales, the linking between nodes isn't used
 * so we can simply create a list of nodes with values attached.
 * If you want to skip setting a value on nodes, use `undefined` in the `values` array inside `traits`
 */
function makeNodes(n, traits) {
  const nodes = [];
  for (let i=0; i<n; i++) {
    const node = {
      name: crypto.randomBytes(5).toString('hex'),
      node_attrs: {}
    };
    Object.entries(traits).forEach(([traitName, traitValues]) => {
      const vIdx = i%traitValues.length;
      if (traitValues[vIdx]) {
        node.node_attrs[traitName] = {value: traitValues[vIdx]};
      }
    });
    nodes.push(node);
  }
  return nodes;
}
