import { intersectGenes } from "../reducers/entropy";
import { genotypeColors } from "./globals";

export const calcMutationCounts = (nodes, visibility, geneMap, isAA) => {
  const sparse = isAA ? {} : [];
  if (isAA) {
    Object.keys(geneMap).forEach((n) => {sparse[n] = {};});
  }
  nodes.forEach((n) => {
    if (visibility[n.arrayIdx] !== "visible") {return;}
    if (isAA) {
      if (n.aa_muts) {
        for (const prot in n.aa_muts) { // eslint-disable-line
          n.aa_muts[prot].forEach((m) => {
            const pos = parseInt(m.slice(1, m.length - 1), 10);
            sparse[prot][pos] ? sparse[prot][pos]++ : sparse[prot][pos] = 1;
          });
        }
      }
    } else {
      if (n.muts) {
        n.muts.forEach((m) => {
          const pos = parseInt(m.slice(1, m.length - 1), 10);
          sparse[pos] ? sparse[pos]++ : sparse[pos] = 1;
        });
      }
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

export const calcEntropy = (nodes, visibility, geneMap, isAA) => {
  const arrayOfProts = isAA ? Object.keys(geneMap) : ["nuc"];
  const initialState = {};
  const anc_state = {};
  const counts = {}; // same struct as state, but with counts not chars
  arrayOfProts.forEach((p) => {
    initialState[p] = {};
    counts[p] = {};
    anc_state[p] = {};
  });
  const root = nodes[0];
  let visible_tips = 0;

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
    if (!anc_state[prot][pos]) {
      // if we don't know the ancestral state, set it via the first encountered state
      anc_state[prot][pos] = A;
    }
    state[prot][pos] = B;
  }

  const recurse = (node, state) => {
    // if mutation observed - do something
    if (isAA) {
      if (node.aa_muts) {
        for (const prot in node.aa_muts) { // eslint-disable-line
          node.aa_muts[prot].forEach(assignFn, [prot, state]);
        }
      }
    } else {
      if (node.muts && node.muts.length) {
        node.muts.forEach(assignFn, ["nuc", state]);
      }
    }

    if (node.hasChildren) {
      for (const child of node.children) {
        /* if there were no changes to the state (i.e. no aa_muts / muts )
        at the node, then we don't need to deep clone the state Object
        (i.e. can just use references). This will be much quicker,
        but increase programmatic complexity. (TODO) */
        const newState = {};
        arrayOfProts.forEach((p) => {
          newState[p] = Object.assign({}, state[p]);
        });
        recurse(child, newState);
      }
    } else if (visibility[node.arrayIdx] === "visible") {
      visible_tips++;
      for (const prot of arrayOfProts) {
        for (const pos of Object.keys(state[prot])) {
          // console.log(prot, k, counts[prot][k], state[prot])
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
  // console.log(counts);
  let m = 0;
  let i = 0;
  const entropy = [];
  for (const prot of arrayOfProts) {
    for (const k of Object.keys(counts[prot])) {
      // console.log("pos ", k, ": ", counts[prot][k]);
      let n = 0;
      for (const kk of Object.keys(counts[prot][k])) {
        n += counts[prot][k][kk];
      }
      const unobserved = visible_tips - n;
      if (unobserved > 0) {
        if (counts[prot][k][anc_state[prot][k]]) {
          counts[prot][k][anc_state[prot][k]] += unobserved;
        } else {
          counts[prot][k][anc_state[prot][k]] = unobserved;
        }
      }
      // console.log("computing entropy at ", k);
      const t = visible_tips + n;
      let s = 0;
      for (const kk of Object.keys(counts[prot][k])) {
        const a = counts[prot][k][kk] / t;
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
