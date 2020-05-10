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

const calcEntropy = async (nodes, visibility, geneMap, isAA) => {
  const arrayOfProts = isAA ? Object.keys(geneMap) : [nucleotide_gene];
  const initialState = {};
  const counts = {}; // same struct as state, but with counts not chars
  const root = nodes[0];
  const anc_state = root.anc_state || {};
  arrayOfProts.forEach((p) => {
    initialState[p] = {};
    counts[p] = {};
    if (!root.anc_state) anc_state[p] = {};
  });
  let visibleTips = 0;

  const mutationArrToObj = (prot, mutations) => {
    const obj = {};
    for (const m of mutations) {
      const A = m.charAt(0);
      const B = m.charAt(m.length - 1);
      if (isAA) {
        if (A === "X" || B === "X") continue;
      } else if (A === "N" || A === "-" || B === "N" || B === "-") continue;
      const pos = +m.slice(1, -1);
      if (!anc_state[prot][pos]) {
        // if we don't know the ancestral state, set it via the first encountered state
        anc_state[prot][pos] = A;
      }
      obj[pos] = B;
    }
    return obj;
  };

  const recurse = async (node, state) => {
    if (!node.state) {
      // if mutation observed - do something
      const mutations = getNodeMutations(node);
      if (mutations) {
        if (isAA) {
          for (const prot of Object.keys(mutations).filter((p) => p !== "nuc")) {
            if (prot === "nuc") continue;
            state[prot] = Object.assign({}, state[prot], mutationArrToObj(prot, mutations[prot]));
          }
        } else if (mutations.nuc) {
          state[nucleotide_gene] = Object.assign({}, state[nucleotide_gene], mutationArrToObj(nucleotide_gene, mutations.nuc));
        }
      }
      node.state = state;
    }

    const nodeState = node.state;


    if (node.hasChildren) {
      const promises = [];
      for (const child of node.children) {
        const newState = child.state || Object.assign({}, state);
        promises.push(new Promise((resolve) => setImmediate(async () => resolve(await recurse(child, newState)))));
      }
      await Promise.all(promises);
    } else if (visibility[node.arrayIdx] === NODE_VISIBLE) {
      visibleTips++;
      for (const prot of arrayOfProts) {
        for (const pos of Object.keys(nodeState[prot])) {
          if (!counts[prot][pos]) {
            counts[prot][pos] = {};
            counts[prot][pos][nodeState[prot][pos]] = 1;
          } else if (!counts[prot][pos][state[prot][pos]]) {
            counts[prot][pos][nodeState[prot][pos]] = 1;
          } else {
            counts[prot][pos][nodeState[prot][pos]]++;
          }
        }
      }
    }
  };
  await recurse(root, initialState);

  root.anc_state = anc_state;

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
