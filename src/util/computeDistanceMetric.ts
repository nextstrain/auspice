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
 * It is run on load/reset (recomputeReduxState) and on the `changeDistanceMeasure`
 * thunk, and the value is consumed by `setDistance` in the phylotree layout code.
 */
export function setDistanceMetric(nodes: ReduxNode[], distanceMeasure: DistanceMeasure): void {
  const getValue = distanceMeasure === "div" ?
    (n: ReduxNode): number | undefined => getDivFromNode(n) :
    (n: ReduxNode): number | undefined => getTraitFromNode(n, "num_date");
  nodes.forEach((n) => {
    n[DISTANCE] = getValue(n);
  });
}
