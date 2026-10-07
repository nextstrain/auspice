import { getTipLabelPadding } from "../src/components/tree/phyloTree/layouts";
import { createDefaultParams } from "../src/components/tree/phyloTree/defaultParams";

const tips = (names) => names.map((name) => ({n: {name}}));

/** The default tip label is the strain name, i.e. the label rendered for `tipLabelKey === strainSymbol` */
const strainNameLabel = (d) => d.n.name;

/**
 * The right margin reserves space for the widest tip label, estimated from the longest label.
 * Fewer than `tipLabelBreakL3` tips in view use `tipLabelFontSizeL3`.
 */
test.each([
  ["shorter name first", ["A/Texas/50/2012", "A/Hong_Kong/H090_695_V10/2009", "A/1"]],
  ["longest name first", ["A/Hong_Kong/H090_695_V10/2009", "A/Texas/50/2012", "A/1"]],
  ["longest name last", ["A/1", "A/Texas/50/2012", "A/Hong_Kong/H090_695_V10/2009"]],
])("Tip label padding fits the longest name (%s)", (_order, names) => {
  const params = createDefaultParams();
  expect(getTipLabelPadding(params, tips(names), strainNameLabel)).toBe(0.65 * "A/Hong_Kong/H090_695_V10/2009".length * params.tipLabelFontSizeL3);
});

test("Tip label padding is sized from the labels consulted, not the strain names", () => {
  const params = createDefaultParams();
  /* strain names are short, but the chosen label key resolves to a much longer value */
  const nodes = [{n: {name: "A/1"}}, {n: {name: "A/2"}}];
  const longLabel = "2024-01-15 (a very long tip label)";
  const tipLabel = () => longLabel;
  expect(getTipLabelPadding(params, nodes, tipLabel)).toBe(0.65 * longLabel.length * params.tipLabelFontSizeL3);
});

test("Tip label padding treats missing labels as empty", () => {
  const params = createDefaultParams();
  const nodes = [{n: {name: "A/1"}}, {n: {name: "A/2"}}];
  expect(getTipLabelPadding(params, nodes, () => undefined)).toBe(0);
});

test("Tip label padding is zero when too many tips are in view for labels", () => {
  const params = createDefaultParams();
  const names = Array.from({length: params.tipLabelBreakL1}, (_, i) => `tip_${i}`);
  expect(getTipLabelPadding(params, tips(names), strainNameLabel)).toBe(0);
});
