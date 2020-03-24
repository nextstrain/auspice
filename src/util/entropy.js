import { genotypeColors, NODE_VISIBLE, nucleotide_gene } from "./globals";

const intersectGenes = function intersectGenes(geneMap, pos) {
  for (const gene of Object.keys(geneMap)) {
    if (pos >= geneMap[gene].start && pos <= geneMap[gene].end) {
      return gene;
    }
  }
  return false;
};

/**
 * Get mutations on node. Returns false if mutations not set.
 * @param {object} n node
 */
const getNodeMutations = (n) => {
  if (n.branch_attrs && n.branch_attrs.mutations && Object.keys(n.branch_attrs.mutations).length) {
    return n.branch_attrs.mutations;
  }
  return false;
};

const calcMutationCounts = (nodes, visibility, geneMap, isAA) => {

  const sparse = isAA ? {} : [];
  if (isAA) {
    Object.keys(geneMap).forEach((n) => {sparse[n] = {};});
  }
  nodes.forEach((n) => {
    if (visibility[n.arrayIdx] !== NODE_VISIBLE) {return;}
    const mutations = getNodeMutations(n);
    if (!mutations) return;
    if (isAA) {
      for (const prot of Object.keys(mutations).filter((p) => p !== "nuc")) {
        mutations[prot].forEach((m) => {
          const pos = parseInt(m.slice(1, m.length - 1), 10);
          const A = m.slice(0, 1);
          const B = m.slice(-1);
          if (A !== 'X' && B !== 'X') {
            sparse[prot][pos] ? sparse[prot][pos]++ : sparse[prot][pos] = 1;
          }
        });
      }
    } else {
      if (!mutations.nuc) return;
      mutations.nuc.forEach((m) => {
        const pos = parseInt(m.slice(1, m.length - 1), 10);
        const A = m.slice(0, 1);
        const B = m.slice(-1);
        if (A !== "N" && A !== "-" && B !== "N" && B !== "-") {
          sparse[pos] ? sparse[pos]++ : sparse[pos] = 1;
        }
      });
    }
  });
  const counts = [];
  let j = 0;
  let m = 0;
  if (isAA) {
    const prots = Object.keys(sparse);
    for (let i = 0; i < prots.length; i++) {
      for (const k in sparse[prots[i]]) { // eslint-disable-line
        const numK = parseInt(k, 10);
        if (sparse[prots[i]][numK] > m) {m = sparse[prots[i]][numK];}
        counts[j] = {
          x: geneMap[prots[i]].start + 3 * numK - 1, // check
          y: sparse[prots[i]][numK],
          codon: numK, // check
          fill: genotypeColors[i % 10],
          prot: prots[i]
        };
        j++;
      }
    }
  } else {
    for (let i = 0; i < sparse.length; i++) {
      if (!sparse[i]) {continue;}
      if (sparse[i] > m) {m = sparse[i];}
      counts[j] = {x: i, y: sparse[i]}; /* TODO reset y scale in D3 or compute entropy */
      j++;
    }
    for (const nt of counts) {
      nt.prot = intersectGenes(geneMap, nt.x);
    }
  }
  return [counts, m];
};

const calcEntropy = (nodes, visibility, geneMap, isAA) => {
  const arrayOfProts = isAA ? Object.keys(geneMap) : [nucleotide_gene];
  const initialState = {};
  const anc_state = {};
  const counts = {}; // same struct as state, but with counts not chars
  arrayOfProts.forEach((p) => {
    initialState[p] = {};
    counts[p] = {};
    anc_state[p] = {};
  });
  const root = nodes[0];
  let visibleTips = 0;

  /* assignFn is called by forEach to parse and assign the mutations at each node.
  It cannot use fat arrow as we need to access "this"
  "this" is bound to [prot, state] */
  const assignFn = function assignFn(m) {
    const prot = this[0];
    const state = this[1];
    const pos = parseInt(m.slice(1, m.length - 1), 10);
    const A = m.slice(0, 1);
    const B = m.slice(m.length - 1, m.length);
    // console.log("mut @ ", pos, ":", A, " -> ", B)
    if (isAA) {
      if (A === "X" || B === "X") return;
    } else if (A === "N" || A === "-" || B === "N" || B === "-") return;
    if (!anc_state[prot][pos]) {
      // if we don't know the ancestral state, set it via the first encountered state
      anc_state[prot][pos] = A;
    }
    state[prot][pos] = B;
  };

  const recurse = (node, state) => {
    // if mutation observed - do something
    const mutations = getNodeMutations(node);
    if (mutations) {
      if (isAA) {
        for (const prot of Object.keys(mutations).filter((p) => p !== "nuc")) {
          if (arrayOfProts.includes(prot)) {
            mutations[prot].forEach(assignFn, [prot, state]);
          }
        }
      } else if (mutations.nuc) {
        mutations.nuc.forEach(assignFn, [nucleotide_gene, state]);
      }
    }

    if (node.hasChildren) {
      for (const child of node.children) {
        /* if there were no changes to the state (i.e. no mutations )
        at the node, then we don't need to deep clone the state Object
        (i.e. can just use references). This will be much quicker,
        but increase programmatic complexity. (TODO) */
        const newState = {};
        arrayOfProts.forEach((p) => {
          newState[p] = Object.assign({}, state[p]);
        });
        recurse(child, newState);
      }
    } else if (visibility[node.arrayIdx] === NODE_VISIBLE) {
      visibleTips++;
      for (const prot of arrayOfProts) {
        for (const pos of Object.keys(state[prot])) {
          if (!counts[prot][pos]) {
            counts[prot][pos] = {};
            counts[prot][pos][state[prot][pos]] = 1;
          } else if (!counts[prot][pos][state[prot][pos]]) {
            counts[prot][pos][state[prot][pos]] = 1;
          } else {
            counts[prot][pos][state[prot][pos]]++;
          }
        }
      }
    }
  };
  recurse(root, initialState);

  let m = 0;
  let i = 0;
  const entropy = [];
  for (const prot of arrayOfProts) {
    for (const k of Object.keys(counts[prot])) {
      let nObserved = 0;
      for (const kk of Object.keys(counts[prot][k])) {
        nObserved += counts[prot][k][kk];
      }
      const nUnobserved = visibleTips - nObserved;
      // console.log("\tn(visible tips):", visibleTips, "n(unobserved):", nUnobserved);
      if (nUnobserved > 0) {
        // console.log("\tancestral state:", anc_state[prot][k]);
        if (counts[prot][k][anc_state[prot][k]]) {
          counts[prot][k][anc_state[prot][k]] += nUnobserved;
        } else {
          counts[prot][k][anc_state[prot][k]] = nUnobserved;
        }
      }
      // console.log("\tcounts (complete):", counts[prot][k], " total:", visibleTips);
      let s = 0;
      for (const kk of Object.keys(counts[prot][k])) {
        const a = counts[prot][k][kk] / visibleTips;
        s += (-1 * a * Math.log(a));
      }
      if (s > m) {m = s;}
      entropy[i] = isAA ? {
        x: geneMap[prot].start + 3 * k - 1, // check
        y: s.toFixed(3),
        codon: parseInt(k, 10), // check
        fill: genotypeColors[i % 10],
        prot: prot
      } : {
        x: parseInt(k, 10),
        y: s.toFixed(3),
        prot: intersectGenes(geneMap, k)
      };
      i++;
    }
  }
  // console.log(entropy)
  return [entropy, m];
};

/**
* traverse the tree and compile the entropy data for the visibile branches
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes.
* @param {String} mutType - amino acid | nucleotide mutations - "aa" | "nuc"
* @param {obj} geneMap used to NT fill colours. This should be imroved.
* @param {bool} showCounts show counts or entropy values?
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
* TODO: this algorithm can be much improved, and the data structures returned improved also
*/
export const calcEntropyInView = (nodes, visibility, mutType, geneMap, showCounts) => {
  return showCounts ?
    calcMutationCounts(nodes, visibility, geneMap, mutType === "aa") :
    calcEntropy(nodes, visibility, geneMap, mutType === "aa");
};
