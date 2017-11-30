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

export const calcNtEntropy = () => {
  console.warn("to do");
};

export const calcAaEntropy = () => {
  console.warn("to do");
};
