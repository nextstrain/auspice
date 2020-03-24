import { sortedDomain } from "../src/util/sortedDomain";

test("sortedDomain works correctly in normal case", () => {
  const stateCount = new Map([
    ["Italy", 8],
    ["Lombardy", 9],
    ["USA", 1],
    ["Iran", 18],
    ["Comunitat Valenciana", 1],
    ["Hubei", 35],
    ["China", 2],
    ["Grand Princess", 2],
    ["Hong Kong", 1],
    ["South Korea", 1],
    ["Europe", 1],
    ["UK", 1]
  ]);
  const domain = stateCount.keys();
  const sorted = sortedDomain(domain, "", stateCount);
  expect(sorted).toMatchObject([
    "Hubei",
    "Iran",
    "Lombardy",
    "Italy",
    "China",
    "Grand Princess",
    "Comunitat Valenciana",
    "Europe",
    "Hong Kong",
    "South Korea",
    "UK",
    "USA"
  ]);
});

test("sortedDomain works correctly in special case", () => {
  const stateCount = new Map([
    ["Italy", 8],
    ["Lombardy", 9],
    ["USA", 1],
    ["Iran", 18],
    ["Comunitat Valenciana", 1],
    ["Hubei", 35],
    ["China", 2],
    ["Grand Princess", 2],
    ["Hong Kong", 1],
    ["South Korea", 1],
    ["Europe", 1],
    ["UK", 1]
  ]);
  const domain = stateCount.keys();
  const sorted = sortedDomain(domain, "clade_membership", stateCount);
  expect(sorted).toMatchObject([
    "China",
    "Comunitat Valenciana",
    "Europe",
    "Grand Princess",
    "Hong Kong",
    "Hubei",
    "Iran",
    "Italy",
    "Lombardy",
    "South Korea",
    "UK",
    "USA"
  ]);
});
