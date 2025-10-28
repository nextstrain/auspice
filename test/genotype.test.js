import { encodeGenotypeFilters, decodeGenotypeFilters, encodeColorByGenotypeCumulative } from "../src/util/getGenotype";
import { sortConstellationLongFn } from "../src/util/treeVisibilityHelpers";

const filtersToQuery = [
  [[{active: true, value: "NS3 572L"}], "NS3.572L"],
  [[{active: true, value: "NS3 572L"}, {active: true, value: "NS3 40I"}], "NS3.572L,40I"],
  [[{active: true, value: "NS3 572L"}, {active: false, value: "NS3 40I"}], "NS3.572L"],
  [[{active: true, value: "g1 a"}, {active: true, value: "g1 b"}, {active: true, value: "g2 c"}], "g1.a,b,g2.c"]
];

test("Genotype filters are correctly encoded for the URL", () => {
  filtersToQuery.forEach(([filterValues, expectedQuery]) => {
    expect(encodeGenotypeFilters(filterValues)).toStrictEqual(expectedQuery);
  });
});

test("Genotype URL queries are correctly decoded", () => {
  filtersToQuery.forEach(([filterValues, expectedQuery]) => {
    const activeFilterValues = filterValues.filter((v) => v.active); // URLs only encode the active filters
    expect(decodeGenotypeFilters(expectedQuery)).toStrictEqual(activeFilterValues);
  });
});


const constellationsToSort = [
  [ // singleton
    [["HA1", "186", "D"]],
    [["HA1", "186", "D"]]
  ],
  [ // residues are alphabetical
    [["HA1", "186", "S"], ["HA1", "186", "D"]],
    [["HA1", "186", "D"], ["HA1", "186", "S"]]
  ],
  [ // bases are numerically sorted
    [["HA1", "186", "S"], ["HA1", "91", "X"]],
    [["HA1", "91", "X"], ["HA1", "186", "S"]]
  ],
  [ // genes are sorted alphabetically, with "nuc" last
    [["BBB", "1", "B"], ["nuc", "0", "N"], ["AAA", "2", "A"]],
    [["AAA", "2", "A"], ["BBB", "1", "B"], ["nuc", "0", "N"]]
  ]
];

test("Genotype sorting function", () => {
  constellationsToSort.forEach(([unsorted, sorted]) => {
    expect(unsorted.sort(sortConstellationLongFn)).toStrictEqual(sorted);
  });
});

/* -----------------  encodeColorByGenotypeCumulative  ----------------- */
test("encodeColorByGenotypeCumulative replaces a non-genotype color-by", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'foo', gene: 'NS3', position: 584})
  ).toStrictEqual("gt-NS3_584");
});
test("encodeColorByGenotypeCumulative handles positions supplied as strings", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'foo', gene: 'NS3', position: 584})
  ).toStrictEqual("gt-NS3_584");
});

test("encodeColorByGenotypeCumulative returns the existing color-by for a malformed position argument", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'foo', gene: 'NS3', position: 'bad!'})
  ).toStrictEqual("foo");
});

test("encodeColorByGenotypeCumulative replaces a genotype color-by of a different gene", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'gt-NS3_584', gene: 'nuc', position: 123})
  ).toStrictEqual("gt-nuc_123");
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'gt-nuc_123', gene: 'NS3', position: 584})
  ).toStrictEqual("gt-NS3_584");
});

test("encodeColorByGenotypeCumulative adds positions (and orders them)", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'gt-NS3_584', gene: 'NS3', position: 123})
  ).toStrictEqual("gt-NS3_123,584");
});

test("encodeColorByGenotypeCumulative removes existing positions", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'gt-NS3_123,584', gene: 'NS3', position: 123})
  ).toStrictEqual("gt-NS3_584");
});

test("encodeColorByGenotypeCumulative doesn't remove a single existing position", () => {
  expect(
    encodeColorByGenotypeCumulative({currentColorBy: 'gt-NS3_123', gene: 'NS3', position: 123})
  ).toStrictEqual("gt-NS3_123");
});
