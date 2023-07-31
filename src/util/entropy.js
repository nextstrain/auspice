import { genotypeColors, NODE_VISIBLE, nucleotide_gene } from "./globals";

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

const calcMutationCounts = (nodes, visibility, genomeMap, isAA) => {
  const cds = getCds(genomeMap)
  const sparse = isAA ? {} : [];
  if (isAA) {
    cds.forEach((d) => {sparse[d.name] = {};});
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
      for (const k in sparse[prots[i]]) {
        const numK = parseInt(k, 10);
        if (sparse[prots[i]][numK] > m) {m = sparse[prots[i]][numK];}
        counts[j] = {
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
  }
  return [counts, m];
};

const calcEntropy = (nodes, visibility, genomeMap, isAA) => {
  const cds = getCds(genomeMap)
  const arrayOfProts = isAA ? cds.map((d) => d.name) : [nucleotide_gene];
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
        y: s.toFixed(3),
        codon: parseInt(k, 10), // check
        fill: genotypeColors[i % 10],
        prot: prot
      } : {
        x: parseInt(k, 10),
        y: s.toFixed(3),
      };
      i++;
    }
  }
  // console.log(entropy)
  return [entropy, m];
};

/**
* traverse the tree and compile the entropy data for the visible branches
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes.
* @param {String} mutType - amino acid | nucleotide mutations - "aa" | "nuc"
* @param {array} genomeMap
* @param {bool} showCounts show counts or entropy values?
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
* TODO: this algorithm can be much improved, and the data structures returned improved also
*/
export const calcEntropyInView = (nodes, visibility, mutType, genomeMap, showCounts) => {
  return showCounts ?
    calcMutationCounts(nodes, visibility, genomeMap, mutType === "aa") :
    calcEntropy(nodes, visibility, genomeMap, mutType === "aa");
};

/**
 * Returns an array of all CDSs in the (first chromosome of the) genome
 */
export function getCds(genomeMap) {
  let cds = [];
  genomeMap[0].genes.forEach((gene) => {
    cds = cds.concat(gene.cds);
  })
  return cds;
}

/** returns undefined if not found */
export function getCdsByName(genomeMap, name) {
  return getCds(genomeMap).filter((cds)=>cds.name===name)[0];
}

export function getNucCoordinatesFromAaPos(cds, aaPos) {
  let frame;
  const nucCoordinates = [];
  if (cds.strand==='-') {
    frame = 'TODO'
    nucCoordinates.push("Negative strand not yet implemented");
  } else { // Any strand which is _not_ '-' is interpreted as +ve strand
    const ntCodonStart = (aaPos-1)*3 + 1; /* codon triplet starts here (inclusive, 1-based) */
    for (let i=0; i<cds.segments.length; i++) {
      let segment = cds.segments[i];
      if (segment.rangeLocal[1] < ntCodonStart) continue;
      frame = `frame ${segment.frame}`;
      let ntPosGenome = segment.rangeGenome[0] + (ntCodonStart - segment.rangeLocal[0]);
      while (ntPosGenome <= segment.rangeGenome[1] && nucCoordinates.length<3) {
        nucCoordinates.push(ntPosGenome++);
      }
      if (nucCoordinates.length!==3) {
        /* Codon bridges 2 segments */
        segment = cds.segments[i+1];
        /* rewrite "frame x" to "frames x → y" */
        frame = frame.replace('frame', 'frames') + ` → ${segment.frame}`;
        /* sanity check the phase */
        if (segment.phase!==(3-nucCoordinates.length)) {
          console.error(`Internal Error -- phase mismatch for CDS ${cds.name} when mapping codon ${aaPos}`);
          nucCoordinates.push("Internal Error!")
          break;
        }
        /* grab the necessary nucleotides -- at most there'll be two needed */
        nucCoordinates.push(segment.rangeGenome[0]);
        if (nucCoordinates.length<3) {
          nucCoordinates.push(segment.rangeGenome[0]+1);
        }
      }
      break;
    }
  }
  return {frame, nucCoordinates};
}