import { getDivFromNode, getTraitFromNode } from "./treeMiscHelpers";
import type { ReduxNode } from "../reducers/tree/types";
import { parseMutation, validMutation } from "../util/entropy";
import type { GenomeMap } from "../util/entropyCreateStateFromJsons";

/**
 * Symbol under which the (currently selected) distance-metric value is stored on
 * each node.
 */
export const DISTANCE = Symbol("distance");

/**
 * Prefix used to namespace mutation-count distance measures. The suffix is the
 * gene/CDS key within `branch_attrs.mutations` (e.g. "nuc", or a CDS name).
 * We namespace these because e.g. "nuc" is both a valid gene key and would otherwise
 * collide with other distance-measure identifiers.
 */
export const MUTATION_COUNT_PREFIX = "mutationCount:";

/** A cumulative count of the mutations observed on a given gene/CDS, e.g. "mutationCount:nuc" */
export type MutationCountMeasure = `${typeof MUTATION_COUNT_PREFIX}${string}`;

export type DistanceMeasure = "div" | "num_date" | MutationCountMeasure;

export function isMutationCountBranchLength(metric: string): metric is MutationCountMeasure {
  return metric.startsWith(MUTATION_COUNT_PREFIX)
}

/** A lookup of node name → distance-metric value, as returned by `setDistanceMetric` when `inPlace` is false */
export type DistanceLookup = Record<string, number | undefined>;

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
export function setDistanceMetric(nodes: ReduxNode[], distanceMeasure: DistanceMeasure, inPlace: true): void;
export function setDistanceMetric(nodes: ReduxNode[], distanceMeasure: DistanceMeasure, inPlace: false): DistanceLookup;
export function setDistanceMetric(nodes: ReduxNode[], distanceMeasure: DistanceMeasure, inPlace = true): void | DistanceLookup {
  /* When `inPlace` we mutate each node (the default / existing behaviour). Otherwise we build &
   * return a `name -> value` lookup, leaving the nodes untouched. The latter lets callers (e.g.
   * the scatterplot) obtain a second distance measure without clobbering the active `DISTANCE`. */
  const lookup: DistanceLookup = {};
  function assign(node: ReduxNode, value: number | undefined): void {
    if (inPlace) {
      node[DISTANCE] = value;
    } else {
      lookup[node.name] = value;
    }
  }

  if (isMutationCountBranchLength(distanceMeasure)) {
    const gene = distanceMeasure.slice(MUTATION_COUNT_PREFIX.length);
    setCumulativeMutationCount(nodes, gene, assign);
  } else {
    const getValue = distanceMeasure === "div" ?
      (n: ReduxNode): number | undefined => getDivFromNode(n) :
      (n: ReduxNode): number | undefined => getTraitFromNode(n, "num_date");
    nodes.forEach((n) => assign(n, getValue(n)));
  }

  return lookup;
}

/**
 * Pre-order traversal (root → tips) which computes the cumulative number of mutations observed on
 * the given gene/CDS between the root and each node, calling `assign(node, value)` for each.
 * For now we simply use the length of the per-branch mutations array; no attempt is made
 * to collapse reversions/homoplasies etc.
 */
function setCumulativeMutationCount(
  nodes: ReduxNode[],
  gene: string,
  assign: (node: ReduxNode, value: number) => void,
): void {
  if (!nodes.length) return;
  const isAA = gene !== 'nuc';
  const recurse = (node: ReduxNode, parentCount: number): void => {

    const branchCount = (node.branch_attrs?.mutations?.[gene] || [])
      .filter((m) => {
        const { from, to } = parseMutation(m);
        return validMutation(from, to, isAA)
      })
      .length;
    const cumulativeCount = parentCount + branchCount;
    assign(node, cumulativeCount);
    if (node.children) {
      for (const child of node.children) recurse(child, cumulativeCount);
    }
  };
  recurse(nodes[0], 0);
}

export function findAvailableDistanceMeasures(nodes: ReduxNode[], genomeMap: GenomeMap | undefined): DistanceMeasure[] {
  const numDateAtRoot = getTraitFromNode(nodes[0], "num_date") !== undefined;
  const divAtRoot = getDivFromNode(nodes[0]) !== undefined;

  const availableDistanceMeasures: DistanceMeasure[] = [
    ...(numDateAtRoot ? ['num_date' as const] : []),
    ...(divAtRoot ? ['div' as const] : []),
  ];

  const chromosome = genomeMap?.[0];
  if (chromosome) {
    if (!chromosome.proteinOnly) availableDistanceMeasures.push(`${MUTATION_COUNT_PREFIX}nuc`);
    for (const gene of chromosome.genes) {
      for (const cds of gene.cds) {
        availableDistanceMeasures.push(`${MUTATION_COUNT_PREFIX}${cds.name}`)
      }
    }
  }
  
  return availableDistanceMeasures
}
