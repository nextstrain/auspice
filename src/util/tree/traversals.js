import { intersectGenes } from "../../reducers/entropy";
/**
* traverse the tree and get the values -> counts for a single
* attr. Visibility of the node is ignored. Terminal nodes only.
* @param {Array} nodes - list of nodes
* @param {Array | string} attrs - string (for a single attr), or list of attrs to scan the tree for their values & counts
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
*/
export const getAllValuesAndCountsOfTraitsFromTree = (nodes, attrs) => {
  const stateCount = {};
  if (typeof attrs === "string") {
    const attr = attrs;
    stateCount[attr] = {};
    nodes.forEach((n) => {
      if (n.hasChildren) {return;}
      if (!n.attr[attr] || n.attr[attr] === "undefined" || n.attr[attr] === "?") {return;}
      stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
    });
  } else {
    for (const attr of attrs) {
      stateCount[attr] = {};
    }
    nodes.forEach((n) => {
      if (n.hasChildren) {return;}
      for (const attr of attrs) {
        if (!n.attr[attr] || n.attr[attr] === "undefined" || n.attr[attr] === "?") {return;}
        // attr is "country" or "author" etc
        // n.attr[attr] is "USA", "Black et al", "USVI", etc
        stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
      }
    });
  }
  return stateCount;
};

/**
* traverse the tree and get the values -> counts for each attr in attrs
* only examine terminal nodes which are visible
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes. Value: "visibile" or ""
* @param {Array} attrs - list of attrs to scan the tree for their values & counts
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
*/
export const getValuesAndCountsOfVisibleTraitsFromTree = (nodes, visibility, attrs) => {
  const stateCount = {};
  for (const attr of attrs) {
    stateCount[attr] = {};
  }
  nodes.forEach((n) => {
    if (n.hasChildren) {return;}
    if (visibility[n.arrayIdx] !== "visible") {return;}
    for (const attr of attrs) {
      // attr is "country" or "author" etc
      // n.attr[attr] is "USA", "Black et al", "USVI", etc
      stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
    }
  });
  return stateCount;
};


/**
* traverse the tree and compile the entropy data for the visibile branches
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes. Value: "visibile" or ""
* @param {String} mutType - amino acid | nucleotide mutations - "aa" | "nuc"
* @param {obj} geneMap used to NT fill colours. This should be imroved.
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
*/
export const calcEntropyInView = (nodes, visibility, mutType, geneMap) => {
  if (mutType === "nuc") {
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
    for (let i = 0; i < sparse.length; i++) {
      if (!sparse[i]) {continue;}
      entropyNtWithoutZeros[j] = {x: i, y: sparse[i] / 5}; /* TODO reset y scale in D3 or compute entropy */
      j++;
    }
    for (const nt of entropyNtWithoutZeros) {
      nt.prot = intersectGenes(geneMap, nt.x);
    }
    return entropyNtWithoutZeros;
  }
  /* AMINO ACID ENTROPY */
  return undefined;

};

// const getBars = (jsonData, geneMap, mutType) => {
//   console.log("getting ", mutType, " bars")
//   if (mutType === "nuc") {
//     const entropyNt = jsonData["nuc"]["val"].map((s, i) => ({x: jsonData["nuc"]["pos"][i], y: s}));
//     const entropyNtWithoutZeros = _filter(entropyNt, (e) => { return e.y !== 0; }); // formerly entropyNtWithoutZeros
//     for (const nt of entropyNtWithoutZeros) {
//       nt.prot = intersectGenes(geneMap, nt.x);
//     }
//     return entropyNtWithoutZeros;
//   }
//   // TO DO - improve the code here...
//   let aminoAcidEntropyWithoutZeros = [];
//   let aaCount = 0;
//   for (const prot of Object.keys(jsonData)) {
//     if (prot !== "nuc") {
//       const tmpProt = jsonData[prot];
//       aaCount += 1;
//       const tmpEntropy = tmpProt["val"].map((s, i) => ({ // eslint-disable-line no-loop-func
//         x: tmpProt["pos"][i],
//         y: s,
//         codon: tmpProt["codon"][i],
//         fill: genotypeColors[aaCount % 10],
//         prot: prot
//       }));
//       aminoAcidEntropyWithoutZeros = aminoAcidEntropyWithoutZeros.concat(
//         tmpEntropy.filter((e) => e.y !== 0)
//       );
//     }
//   }
//   return aminoAcidEntropyWithoutZeros;
// };
