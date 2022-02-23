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
  } else if (entropy) {
    if (node.node_attrs[trait]) return node.node_attrs[trait].entropy;
    return undefined;
  } else if (confidence) {
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
  let accession, url;
  if (node.node_attrs) {
    if (isValueValid(node.node_attrs.accession)) {
      accession = node.node_attrs.accession;
    }
    url = validateUrl(node.node_attrs.url);
  }
  return {accession, url};
};

/* see comment at top of this file */
export const getUrlFromNode = (node, trait) => {
  if (!node.node_attrs || !node.node_attrs[trait]) return undefined;
  return validateUrl(node.node_attrs[trait].url);
};

/**
 * Check if a URL seems valid & return it.
 * For historical reasons, we allow URLs to be defined as `http[s]_` and coerce these into `http[s]:`
 * URls are interpreted by `new URL()` and thus may be returned with a trailing slash
 * @param {String} url URL string to validate
 * @returns {String|undefined} potentially modified URL string or `undefined` (if it doesn't seem valid)
 */
function validateUrl(url) {
  if (url===undefined) return undefined; // urls are optional, so return early to avoid the console warning
  try {
    if (typeof url !== "string") throw new Error();
    if (url.startsWith("http_")) url = url.replace("http_", "http:"); // eslint-disable-line no-param-reassign
    if (url.startsWith("https_")) url = url.replace("https_", "https:"); // eslint-disable-line no-param-reassign
    const urlObj = new URL(url);
    return urlObj.href;
  } catch (err) {
    console.warn(`Dataset provided the invalid URL ${url}`);
    return undefined;
  }
}

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
 * Walk from the proivided node back to the root, collecting all mutations as we go.
 * Multiple mutations (e.g. root -> A<pos>B -> B<pos>C -> fromNode) will be collapsed to as A<pos>C
 * Reversions to root (e.g. root -> A<pos>B -> B<pos>A -> fromNode) will be reported as A<pos>A
 * Returned structure is <returnedObject>.<geneName>.<position> = [<from>, <to>]
 */
export const getSeqChanges = (fromNode) => {
  const mutations = {};
  const walk = (n) => {
    if (n.branch_attrs && n.branch_attrs.mutations && Object.keys(n.branch_attrs.mutations).length) {
      Object.entries(n.branch_attrs.mutations).forEach(([gene, muts]) => {
        if ((gene === "nuc") || gene !== "nuc") {
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
  return mutations;
};


/**
 * Categorise each mutation into one or more of the following categories:
 * (i) unique mutations (those which are only observed once)
 * (ii) homoplasies (mutation observed elsewhere on the tree)
 * (iii) gaps
 * (iv) Ns (only applicable for nucleotides)
 * (v) reversions to root (these will also be in (i) or (ii))
 */
export const categoriseMutations = (mutations, observedMutations, seqChangesToRoot) => {
  const categorisedMutations = {};
  for (const gene of Object.keys(mutations)) {
    const categories = { unique: [], homoplasies: [], gaps: [], reversionsToRoot: []};
    const isNuc = gene==="nuc";
    if (isNuc) categories.ns = [];
    mutations[gene].forEach((mut) => {
      const newChar = mut.slice(-1);
      if (newChar==="-") {
        categories.gaps.push(mut);
      } else if (isNuc && newChar==="N") {
        categories.ns.push(mut);
      } else if (observedMutations[`${gene}:${mut}`] > 1) {
        categories.homoplasies.push(mut);
      } else {
        categories.unique.push(mut);
      }
      // check to see if this mutation is a reversion to root
      const pos = mut.slice(1, -1);
      if (newChar!=="-" && newChar!=="N" && seqChangesToRoot[gene] &&
      seqChangesToRoot[gene][pos] && seqChangesToRoot[gene][pos][0]===seqChangesToRoot[gene][pos][1]) {
        categories.reversionsToRoot.push(mut);
      }
    });
    categorisedMutations[gene]=categories;
  }
  return categorisedMutations;
};

/**
 * Categorise each seq change into one or more of the following categories:
 * (i) changes mutations (those which are only observed once)
 * (ii) reversions to root (these will _not_ be in (i) because they're not technically a change)
 * (iii) gaps
 * (iv) Ns (only applicable for nucleotides)
 */
export const categoriseSeqChanges = (seqChangesToRoot) => {
  const categorisedSeqChanges = {};
  for (const gene of Object.keys(seqChangesToRoot)) {
    const categories = { changes: [], gaps: [], reversionsToRoot: []};
    const isNuc = gene==="nuc";
    if (isNuc) categories.ns = [];
    for (const [pos, fromTo] of Object.entries(seqChangesToRoot[gene])) {
      const mut = `${fromTo[0]}${pos}${fromTo[1]}`;
      if (fromTo[1]==="-") {
        categories.gaps.push(mut);
      } else if (isNuc && fromTo[1]==="N") {
        categories.ns.push(mut);
      } else if (fromTo[0]===fromTo[1]) {
        categories.reversionsToRoot.push(mut);
      } else {
        categories.changes.push(mut);
      }
    }
    categorisedSeqChanges[gene]=categories;
  }
  return categorisedSeqChanges;
};


/**
 * Return the mutations on the branch split into (potentially overlapping) categories
 * @param {Object} branchNode
 * @param {Object} observedMutations all observed mutations on the tree
 * @returns {Object}
 */
export const getBranchMutations = (branchNode, observedMutations) => {
  const mutations = branchNode.branch_attrs && branchNode.branch_attrs.mutations;
  if (typeof mutations !== "object") return {};
  const seqChangesToRoot = branchNode.parent===branchNode ? {} : getSeqChanges(branchNode, mutations);
  const categorisedMutations = categoriseMutations(mutations, observedMutations, seqChangesToRoot);
  return categorisedMutations;
};

/**
 * Return the changes between the terminal node and the root, split into (potentially overlapping) categories
 * @param {Object} tipNode
 * @returns {Object}
 */
export const getTipChanges = (tipNode) => {
  const mutations = tipNode.branch_attrs && tipNode.branch_attrs.mutations;
  const seqChanges = getSeqChanges(tipNode, mutations);
  const categorisedSeqChanges = categoriseSeqChanges(seqChanges);
  return categorisedSeqChanges;
};

/**
 * Returns a function which will sort a list, where each element in the list
 * is a gene name. Sorted by start position of the gene, with "nuc" first.
 */
export const sortByGeneOrder = (genomeAnnotations) => {
  if (!(genomeAnnotations instanceof Object)) {
    return (a, b) => {
      if (a==="nuc") return -1;
      if (b==="nuc") return 1;
      return 0;
    };
  }
  const geneOrder = Object.entries(genomeAnnotations)
    .sort((a, b) => {
      if (b[0]==="nuc") return 1; // show nucleotide "gene" first
      if (a[1].start < b[1].start) return -1;
      if (a[1].start > b[1].start) return 1;
      return 0;
    })
    .map(([name]) => name);

  return (a, b) => {
    if (geneOrder.indexOf(a) < geneOrder.indexOf(b)) return -1;
    if (geneOrder.indexOf(a) > geneOrder.indexOf(b)) return 1;
    return 0;
  };
};
