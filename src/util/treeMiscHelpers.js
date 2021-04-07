import { isValueValid, strainSymbol } from "./globals";

/* --- TO IMPROVE -----
These "getter" functions for node-related data require knowledge of
the semantics of how data is stored on a node. For instance, you need
to know that `num_date` is stored in a different structure to `div`.
This logic should be encapsulated within `getTraitFromNode` so we
don't need separate `getDivFromNode` functions etc.
james hadfield, nov 2019.
*/

/**
 * Given a coloring key or a geographic resolution key
 * (sometimes referred to as a "trait")
 * e.g. "author", "country" etc, extract it's value from a node.
 *
 * If `entropy` is truthy, then extract the entropy value instead
 * If `confidence` is truthy, then extract the confidence value instead
 *
 * Returns `undefined` if not set OR if the value is not valid.
 *
 * NOTE: this only accesses `node_attrs` -- if you want the name or a branch
 * attr then this function is not the one you are looking for.
 *
 * NOTE: do not use this for "div", "vaccine" or other traits set on `node_attrs`
 * which don't share the same structure as traits. See the JSON spec for more details.
 */
export const getTraitFromNode = (node, trait, {entropy=false, confidence=false}={}) => {
  if (!node.node_attrs) return undefined;

  if (!entropy && !confidence) {
    if (!node.node_attrs[trait]) {
      if (trait === strainSymbol) return node.name;
      return undefined;
    }
    const value = node.node_attrs[trait].value;
    if (!isValueValid(value)) return undefined;
    return value;
  } if (entropy) {
    if (node.node_attrs[trait]) return node.node_attrs[trait].entropy;
    return undefined;
  } if (confidence) {
    if (node.node_attrs[trait]) return node.node_attrs[trait].confidence;
    return undefined;
  }
  return undefined;
};

export const getDivFromNode = (node) => {
  /* see comment at top of this file */
  if (node.node_attrs && node.node_attrs.div !== undefined) {
    return node.node_attrs.div;
  }
  return undefined;
};

export const getVaccineFromNode = (node) => {
  /* see comment at top of this file */
  if (node.node_attrs && node.node_attrs.vaccine) {
    return node.node_attrs.vaccine;
  }
  return undefined;
};

export const getFullAuthorInfoFromNode = (node) =>
  (node.node_attrs && node.node_attrs.author && node.node_attrs.author.value) ?
    node.node_attrs.author :
    undefined;

export const getAccessionFromNode = (node) => {
  /* see comment at top of this file */
  if (node.node_attrs && node.node_attrs.accession) {
    return node.node_attrs.accession;
  }
  return undefined;
};

export const getAttributeFromNodeByName = (node, attr) => {
  if (node.node_attrs && Object.keys().includes(attr)) {
    return node.node_attrs[attr];
  }
  return undefined;
};

export const getAllAttributesFromNode = (node) => {
  if (node.node_attrs) {
    return Object.entries(node.node_attrs);
  }
  return [];
};

/* see comment at top of this file */
export const getUrlFromNode = (node) =>
  (node.node_attrs && node.node_attrs.url) ? node.node_attrs.url : undefined;

/**
 * Traverses the tree and returns a set of genotype states such as
 * {"nuc:123A", "S:418K"}.
 * Note 1: Only variable sites are considered.
 * Note 2: Basal states are included in the returned value.
 */
export function collectGenotypeStates(nodes) {
  const observedStates = new Set();
  nodes.forEach((n) => {
    if (n.branch_attrs && n.branch_attrs.mutations && Object.keys(n.branch_attrs.mutations).length) {
      Object.entries(n.branch_attrs.mutations).forEach(([gene, mutations]) => {
        mutations.forEach((m) => {
          const [from, pos, to] = [m.slice(0, 1), m.slice(1, -1), m.slice(-1)];
          observedStates.add(`${gene} ${pos}${to}`);
          observedStates.add(`${gene} ${pos}${from}`); // ancestral state, relative to this node
        });
      });
    }
  });
  return observedStates;
}

/**
 * Collect mutations from node `fromNode` to the root.
 * Reversions (e.g. root -> A<pos>B -> B<pos>A -> fromNode) will not be reported
 * Multiple mutations (e.g. root -> A<pos>B -> B<pos>C -> fromNode) will be represented as A<pos>C
 * We may want to expand this function to take a second argument as the "stopping node"
 * @param {TreeNode} fromNode
 */
export const collectMutations = (fromNode, include_nuc=false) => {
  const mutations = {};
  const walk = (n) => {
    if (n.branch_attrs && n.branch_attrs.mutations && Object.keys(n.branch_attrs.mutations).length) {
      Object.entries(n.branch_attrs.mutations).forEach(([gene, muts]) => {
        if ((gene === "nuc" && include_nuc) || gene !== "nuc") {
          if (!mutations[gene]) mutations[gene] = {};
          muts.forEach((m) => {
            const [from, pos, to] = [m.slice(0, 1), m.slice(1, -1), m.slice(-1)]; // note: `pos` is a string
            if (mutations[gene][pos]) {
              mutations[gene][pos][0] = from; // mutation already seen => update ancestral state.
            } else {
              mutations[gene][pos] = [from, to];
            }
          });
        }
      });
    }
    const nIdx = n.arrayIdx;
    const parent = n.parent;
    if (parent && parent.arrayIdx !== nIdx) {
      walk(parent);
    }
  };
  walk(fromNode);
  // update structure to be returned
  Object.keys(mutations).forEach((gene) => {
    mutations[gene] = Object.entries(mutations[gene])
      .map(([pos, [from, to]]) => {
        if (from===to) return undefined; // reversion to ancestral (root) state
        return `${from}${pos}${to}`;
      })
      .filter((value) => !!value);
  });
  return mutations;
};
