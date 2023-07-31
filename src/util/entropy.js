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

const calcMutationCounts = (nodes, visibility, selectedCds) => {
  const isAA = selectedCds!==nucleotide_gene;
  const sparse = [];
  const cdsName = isAA ? selectedCds.name : nucleotide_gene;

  nodes.forEach((n) => {
    if (visibility[n.arrayIdx] !== NODE_VISIBLE) {return;}
    const mutations = getNodeMutations(n);
    mutations?.[cdsName]?.forEach((m) => {
      const pos = parseInt(m.slice(1, m.length - 1), 10);
      const A = m.slice(0, 1);
      const B = m.slice(-1);
      if (valid(A, B, isAA)) {
        sparse[pos] ? sparse[pos]++ : sparse[pos] = 1;
      }
    });
  });
  const counts = [];
  let j = 0; /* length of the counts array */
  let m = 0; /* maximum observed count */
  for (let i = 0; i < sparse.length; i++) {
    if (!sparse[i]) {continue;}
    if (sparse[i] > m) {m = sparse[i];}
    counts[j] = isAA ? 
      {codon: parseInt(i, 10), y: sparse[i]} :
      {x: i, y: sparse[i]}; /* TODO reset y scale in D3 or compute entropy */
    j++;
  }
  return [counts, m];
};

const calcEntropy = (nodes, visibility, selectedCds) => {
  const isAA = selectedCds!==nucleotide_gene;
  const name = isAA ? selectedCds.name : nucleotide_gene;
  /* anc_state: the ancestral (root) nuc/aa for each position, known once we see the 1st mutation */
  const anc_state = {};
  const counts = {}; /* for each position keep a dict of nuc/aa -> observed counts */
  let visibleTips = 0; /* simple counter */

  const recurse = (node, state) => {
    /* state is a dict of position -> nuc/aa observed on branches leading to the parent of this node.
    We update it by scanning the mutations observed on the branch leading to this node,
    and also update the ancestral states for any positions if not already known */
    const mutations = getNodeMutations(node);
    mutations?.[name]?.forEach((mutation) => {
      const pos = parseInt(mutation.slice(1, mutation.length - 1), 10);
      const A = mutation.slice(0, 1);
      const B = mutation.slice(mutation.length - 1, mutation.length);
      if (!valid(A, B, isAA)) return;
      if (!anc_state[pos]) {
        anc_state[pos] = A;
      }
      state[pos] = B;
    });
    /**
     * If there are children, copy the state & recurse into that node.
     * If it's a (visible) tip then use the state (which represents all mutations
     * between the root and this node) to increment counts[pos][nuc/aa]
     */
    if (node.hasChildren) {
      for (const child of node.children) {
        /* visit child nodes, passing each a _copy_ of the state so it can diverge */
        recurse(child, Object.assign({}, state));
      }
    } else if (visibility[node.arrayIdx] === NODE_VISIBLE) {
      visibleTips++;
      for (const [pos, nuc_aa] of Object.entries(state)) {
        if (!counts[pos]) {
          counts[pos] = {};
          counts[pos][nuc_aa] = 1;
        } else if (!counts[pos][nuc_aa]) {
          counts[pos][nuc_aa] = 1;
        } else {
          counts[pos][nuc_aa]++;
        }
      }
    }
  };
  /* begin the recursion at the root (nodes[0]) with empty state (i.e. zero mutations observed) */
  recurse(nodes[0], {});

  /**
   * For each position where we have observed a mutation (anywhere), there may well be tips which
   * did not have observed mutations leading to them, so we assign these the ancestral nuc/aa.
   * We can then calculate the Shannon entropy for this position & push it onto the entropy array.
   */
  const entropy = [];
  let m = 0; /* maximum observed entropy value */
  let i = 0; /* length of the entropy array */
  for (const position of Object.keys(counts)) {
    let nObserved = 0; /* number of tips with directly observed nuc_aa (at this position) */
    for (const observedCount of Object.values(counts[position])) {
      nObserved += observedCount;
    }
    const nUnobserved = visibleTips - nObserved;
    if (nUnobserved > 0) {
      if (counts[position][anc_state[position]]) {
        counts[position][anc_state[position]] += nUnobserved;
      } else {
        counts[position][anc_state[position]] = nUnobserved;
      }
    }
    
    let s = 0; /* shannon entropy */
    for (const count of Object.values(counts[position])) {
      const a = count / visibleTips;
      s += (-1 * a * Math.log(a));
    }
    if (s > m) {m = s;} /* update maximum observed entropy */
    entropy[i] = isAA ? {
      y: s.toFixed(3),
      codon: parseInt(position, 10), // check
      fill: genotypeColors[i % 10],
    } : {
      x: parseInt(position, 10),
      y: s.toFixed(3),
    };
    i++;
  }
  return [entropy, m];
};

/**
* traverse the tree and compile the entropy data for the visible branches
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes.
* @param {String|Cds} selectedCds - selected CDS or `nucleotide_gene` (string)
* @param {bool} showCounts show counts or entropy values?
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
* TODO: this algorithm can be much improved, and the data structures returned improved also
*/
export const calcEntropyInView = (nodes, visibility, selectedCds, showCounts) => {
  return showCounts ?
    calcMutationCounts(nodes, visibility, selectedCds) :
    calcEntropy(nodes, visibility, selectedCds);
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


/** A, B are the from/to nuc/aa of an observed mutation  */
function valid(A, B, isAA) {
  if (isAA) {
    return A !== 'X' && B !== 'X';
  }
  return A !== "N" && A !== "-" && B !== "N" && B !== "-";
}
