/**
 * @jest-environment jsdom
 */

import { computeTemporalGridPoints } from "../src/components/tree/phyloTree/grid";

/**
 * An axis narrower than the minimum separation between major grid lines (130px)
 * fits no complete grid interval. The grid must still span the date range with a
 * single interval instead of stepping forever (https://github.com/nextstrain/auspice/issues/1363).
 * For a 19 year range one interval selects decades as the major unit and five years as the minor unit.
 */
test.each([0, 1, 100, 129, 130])("Temporal grid on a %ipx axis returns decade major lines", (pxAvailable) => {
  const {majorGridPoints, minorGridPoints} = computeTemporalGridPoints(2000.5, 2019.5, pxAvailable, "x");
  expect(majorGridPoints.map((d) => d.name)).toStrictEqual(["2000", "2010", "2020"]);
  expect(minorGridPoints.map((d) => Math.floor(d.position))).toStrictEqual([2005, 2015, 2025]);
});
