import { intersectGenes } from "../reducers/entropy";
import { genotypeColors } from "./globals";

export const calcNtMutationCounts = (nodes, visibility, geneMap) => {
  const sparse = [];
  nodes.forEach((n) => {
    if (visibility[n.arrayIdx] !== "visible") {return;}
    if (n.muts) {
      n.muts.forEach((m) => {
        const pos = parseInt(m.slice(1, m.length - 1), 10);
        sparse[pos] ? sparse[pos]++ : sparse[pos] = 1;
      });
    }
  });
  const entropyNtWithoutZeros = [];
  let j = 0;
  let m = 0;
  for (let i = 0; i < sparse.length; i++) {
    if (!sparse[i]) {continue;}
    if (sparse[i] > m) {m = sparse[i];}
    entropyNtWithoutZeros[j] = {x: i, y: sparse[i]}; /* TODO reset y scale in D3 or compute entropy */
    j++;
  }
  for (const nt of entropyNtWithoutZeros) {
    nt.prot = intersectGenes(geneMap, nt.x);
  }
  return [entropyNtWithoutZeros, m];
};

export const calcAaMutationCounts = (nodes, visibility, geneMap) => {
  const sparse = {};
  Object.keys(geneMap).forEach((n) => {sparse[n] = {};});
  nodes.forEach((n) => {
    if (visibility[n.arrayIdx] !== "visible") {return;}
    if (n.aa_muts) {
      // eslint-disable-next-line guard-for-in
      for (const prot in n.aa_muts) { // eslint-disable-line no-restricted-syntax
        n.aa_muts[prot].forEach((m) => {
          const pos = parseInt(m.slice(1, m.length - 1), 10);
          sparse[prot][pos] ? sparse[prot][pos]++ : sparse[prot][pos] = 1;
        });
      }
    }
  });
  const aminoAcidEntropyWithoutZeros = [];
  const prots = Object.keys(sparse);
  let j = 0;
  let m = 0;
  for (let i = 0; i < prots.length; i++) {
    // eslint-disable-next-line guard-for-in
    for (const k in sparse[prots[i]]) { // eslint-disable-line no-restricted-syntax
      const numK = parseInt(k, 10);
      if (sparse[prots[i]][numK] > m) {m = sparse[prots[i]][numK];}
      aminoAcidEntropyWithoutZeros[j] = {
        x: geneMap[prots[i]].start + 3 * numK - 1, // check
        y: sparse[prots[i]][numK],
        codon: numK, // check
        fill: genotypeColors[i % 10],
        prot: prots[i]
      };
      j++;
    }
  }
  // console.log(aminoAcidEntropyWithoutZeros);
  return [aminoAcidEntropyWithoutZeros, m];
};

export const calcNtEntropy = (nodes, visibility, geneMap) => {
  const counts = {};
  const root = nodes[0];
  const anc_state = {};
  let visible_tips = 0;

  const recurse = (node, state) => {
    // if mutation observed - do something
    if (node.muts && node.muts.length) {
      node.muts.forEach((m) => {
        const pos = parseInt(m.slice(1, m.length - 1), 10);
        const A = m.slice(0, 1);
        const B = m.slice(m.length - 1, m.length);
        if (pos) {
          // console.log("mut @ ", pos)
          if (!anc_state[pos]) {
            anc_state[pos] = A;
          }
          state[pos] = B;
        }
      });
    }

    // recurse!
    if (node.hasChildren) {
      for (const child of node.children) {
        recurse(child, Object.assign({}, state));
        // if (visibility[child.arrayIdx] === "visible") {
        //   recurse(child, Object.assign({}, state));
        // }TODO: return if node is visible, child is not...
        //
      }
    } else if (visibility[node.arrayIdx] === "visible") {
      // console.log('reached visibile tip!');
      // console.log(state);
      visible_tips++;
      for (const k of Object.keys(state)) {
        if (!counts[k]) {
          counts[k] = {};
          counts[k][state[k]] = 1;
        } else if (!counts[k][state[k]]) {
          counts[k][state[k]] = 1;
        } else {
          counts[k][state[k]]++;
        }
      }
    }
  };
  recurse(root, {});
  // console.log(counts);
  let m = 0;
  let i = 0;
  const entropy = [];
  for (const k of Object.keys(counts)) {
    // console.log("pos ", k, ": ", counts[k]);
    let n = 0;
    for (const kk of Object.keys(counts[k])) {
      n += counts[k][kk];
    }
    // console.log("unobserved (anc. state): ", visible_tips - n);
    if (counts[k][anc_state[k]]) {
      counts[k][anc_state[k]] += visible_tips - n;
    } else {
      counts[k][anc_state[k]] = visible_tips - n;
    }

    // console.log("computing entropy at ", k);
    const t = visible_tips + n;
    let s = 0;
    for (const kk of Object.keys(counts[k])) {
      const a = counts[k][kk] / t;
      s += (-1 * a * Math.log(a));
    }
    if (s > m) {m = s;}
    entropy[i] = {x: parseInt(k, 10), y: s.toFixed(3), prot: intersectGenes(geneMap, k)};
    i++;
  }
  return [entropy, m];
};

export const calcAaEntropy = (nodes, visibility, geneMap) => {
  const arrayOfProts = Object.keys(geneMap);
  const initialState = {};
  const anc_state = {};
  const counts = {};
  arrayOfProts.forEach((p) => {
    initialState[p] = {};
    counts[p] = {};
    anc_state[p] = {};
  });
  const root = nodes[0];
  let visible_tips = 0;

  const recurse = (node, state) => {
    // if mutation observed - do something
    if (node.aa_muts) {
      for (const prot in node.aa_muts) { // eslint-disable-line
        node.aa_muts[prot].forEach((m) => {
          const pos = parseInt(m.slice(1, m.length - 1), 10);
          const A = m.slice(0, 1);
          const B = m.slice(m.length - 1, m.length);
          // console.log("mut @ ", pos, ":", A, " -> ", B)
          if (!anc_state[prot][pos]) {
            anc_state[prot][pos] = A;
          }
          state[prot][pos] = B;
        });
      }
    }

    // recurse!
    if (node.hasChildren) {
      for (const child of node.children) {
        /* if there were no changes to the state (i.e. no aa muts)
        at the node, then we don't need to deep clone the state Object
        (i.e. can just use references). This will be much quicker,
        but increase programmatic complexity */
        const newState = {};
        arrayOfProts.forEach((p) => {
          newState[p] = Object.assign({}, state[p]);
        });
        recurse(child, newState);
        // if (visibility[child.arrayIdx] === "visible") {
        //   recurse(child, Object.assign({}, state));
        // }TODO: return if node is visible, child is not...
        //
      }
    } else if (visibility[node.arrayIdx] === "visible") {
      // console.log('reached visibile tip!');
      // console.log(state);
      // console.log(counts)
      visible_tips++;
      for (const prot of arrayOfProts) {
        for (const k of Object.keys(state[prot])) {
          // console.log(prot, k, counts[prot][k], state[prot])
          if (!counts[prot][k]) {
            counts[prot][k] = {};
            counts[prot][k][state[prot][k]] = 1;
          } else if (!counts[prot][k][state[prot][k]]) {
            counts[prot][k][state[prot][k]] = 1;
          } else {
            counts[prot][k][state[prot][k]]++;
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
      entropy[i] = {
        x: geneMap[prot].start + 3 * k - 1, // check
        y: s.toFixed(3),
        codon: parseInt(k, 10), // check
        fill: genotypeColors[i % 10],
        prot: prot
      };
      i++;
    }
  }
  // console.log(entropy)
  return [entropy, m];
};
