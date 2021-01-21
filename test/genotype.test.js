import { encodeGenotypeFilters, decodeGenotypeFilters } from "../src/util/getGenotype";

const filtersToQuery = [
  [[{active: true, value: "NS3:572L"}], "NS3:572L"],
  [[{active: true, value: "NS3:572L"}, {active: true, value: "NS3:40I"}], "NS3:572L,40I"],
  [[{active: true, value: "NS3:572L"}, {active: false, value: "NS3:40I"}], "NS3:572L"],
  [[{active: true, value: "g1:a"}, {active: true, value: "g1:b"}, {active: true, value: "g2:c"}], "g1:a,b,g2:c"]
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
