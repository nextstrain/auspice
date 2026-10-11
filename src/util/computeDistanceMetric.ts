/* eslint-disable no-console */ // temporary verification scaffolding, see checkDistanceMetric
import { getDivFromNode, getTraitFromNode } from "./treeMiscHelpers";
import type { ReduxNode } from "../reducers/tree/types";

/**
 * Symbol under which the (currently selected) distance-metric value is stored on
 * each node.
 */
export const DISTANCE = Symbol("distance");

type DistanceMeasure = "div" | "num_date";

/**
 * Compute & store the distance-metric value for the currently-selected distance
 * measure onto each node, under the `DISTANCE` symbol.
 *
 * This is a stepping-stone towards allowing arbitrary (and potentially cumulative)
 * branch-length metrics: the idea is that a single traversal sets a per-node value
 * which downstream code can read without any `div` vs `num_date` conditional logic.
 *
 * NOTE: for now the values set here are intentionally *not* consumed by the layout /
 * hover code. Instead those code paths call `checkDistanceMetric` to assert that the
 * values they already compute match what we set here. Once we're confident the values
 * agree we can switch the consumers over to reading `node[DISTANCE]` directly.
 */
export function setDistanceMetric(nodes: ReduxNode[], distanceMeasure: DistanceMeasure): void {
  const getValue = distanceMeasure === "div" ?
    (n: ReduxNode): number | undefined => getDivFromNode(n) :
    (n: ReduxNode): number | undefined => getTraitFromNode(n, "num_date");
  nodes.forEach((n) => {
    n[DISTANCE] = getValue(n);
  });
}

/* -------- FOLLOWING FUNCTIONS ARE TEMPORARY ----------- */

/** Floating-point tolerant comparison which also treats `undefined === undefined` as a match */
function valuesMatch(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return Math.abs(a - b) < 1e-6;
}

/**
 * TEMPORARY verification helper. For each observation it compares the value a layout /
 * hover code path already computed (`observed`) against the precomputed `node[DISTANCE]`.
 * Logs a single line — `${funcName}::success` if every observation matches, otherwise
 * `${funcName}::mismatch` (with details of the first offending node).
 */
export function checkDistanceMetric(
  funcName: string,
  observations: {node: ReduxNode, observed: number | undefined}[],
): void {
  const mismatch = observations.find(({node, observed}) => !valuesMatch(node[DISTANCE], observed));
  if (mismatch) {
    console.log(`${funcName}::mismatch`, {
      node: mismatch.node.name,
      cached: mismatch.node[DISTANCE],
      observed: mismatch.observed,
    });
  } else {
    console.log(`${funcName}::success`);
  }
}
