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

/**
 * Given a CDS (and all the inherent complexity possible there), and two points
 * on the genome (rangeGenome), return rangeLocal coordinates for the part of
 * the CDS that's "in view". The returned coordinates are expanded outwards to
 * include the entire codon (in the 2/3rd of cases where they fall inside a
 * codon).
 * If _either_ of the rangeGenome positions are _beyond_ the CDS then we return
 * the entire rangeLocal of the cds + set the flag `valid` to false.
 * 
 * For wrapping genes, the UI forces the rangeGenome (i.e. the zoomCoordinates)
 * to be on either side of the origin, and we maintain thus assumption here.
 * 
 * Returns [rangeLocalInView:rangeLocal, valid:bool]
 */
export function getCdsRangeLocalFromRangeGenome(cds, rangeGenome) {
  const positive = cds.strand==='+';
  const [zoomStart, zoomEnd] = cds.isWrapping ?
    [rangeGenome[1], rangeGenome[0]] : // .toReversed() not available for Auspice?!?
    rangeGenome;
  const segments = cds.segments;
  // segA is the segment closest to genome position 1. segB is closest to the end.
  const [segA, segB] = positive ?
    [segments[0], segments[segments.length-1]] :
    [segments[segments.length-1], segments[0]]

  let [cdsLocalStart, cdsLocalEnd] = [1, cds.length];

  if (zoomStart < segA.rangeGenome[0] || zoomEnd > segB.rangeGenome[1]) {
    return [[cdsLocalStart, cdsLocalEnd], false];
  }
  /**
   * The general approach is to visit the segments in the order they appear,
   * i.e. in the context of the strand it's always 5' -> 3' but for -ve strand
   * CDSs this appears 3' -> 5' in the context of the +ve strand. Once we find
   * an intersection we can work out the appropriate local coordinate. 
   * Remember that zoomStart/End are reversed if the CDS is wrapping!
   */
  let prevSeg;
  for (const seg of segments) {
    /* If the zoom start (5') is inside the segment, then we know one of the local bounds */  
    if (seg.rangeGenome[0]<=zoomStart && seg.rangeGenome[1]>=zoomStart) {
      if (positive) {
        const delta = zoomStart - seg.rangeGenome[0];
        cdsLocalStart = seg.rangeLocal[0] + delta;
      } else {
        const delta = zoomStart - seg.rangeGenome[0];
        cdsLocalEnd = seg.rangeLocal[1] - delta;
      }
    }       
    /* If the zoom end (3') is inside the segment, then we know one of the local bounds */      
    if (seg.rangeGenome[0]<=zoomEnd && seg.rangeGenome[1]>=zoomEnd) {
      if (positive) {
        const delta = zoomEnd - seg.rangeGenome[0];
        cdsLocalEnd = seg.rangeLocal[0] + delta;
        // if (segments.length>1) {
        //   console.log(`Zoom end (${zoomEnd}) in segment`, seg.rangeGenome, seg.rangeLocal, cdsLocalEnd)
        // }
      } else {
        const delta = seg.rangeGenome[1] - zoomEnd;
        cdsLocalStart = seg.rangeLocal[0] + delta;
      }
    }
    /* Check to see if the zoom fell in the space between segments */
    if (prevSeg) {
      if (positive) {
        if (prevSeg.rangeGenome[1] < zoomStart && seg.rangeGenome[0] > zoomStart) {
          cdsLocalStart = seg.rangeLocal[0];
        }
        if (prevSeg.rangeGenome[1] < zoomEnd && seg.rangeGenome[0] > zoomEnd) {
          cdsLocalEnd = prevSeg.rangeLocal[1];
        }
      } else {
        if (prevSeg.rangeGenome[0] > zoomStart && seg.rangeGenome[1] < zoomStart) {
          cdsLocalEnd = prevSeg.rangeLocal[1];
        }
        if (prevSeg.rangeGenome[0] > zoomEnd && seg.rangeGenome[1] < zoomEnd) {
          cdsLocalStart = seg.rangeLocal[0];
        }
      }
    }
    prevSeg = seg;
  }
  /* Expand the local CDS coordinates so that they are not within a codon. Note
  that this does result is some weirdness; for example a segment finishes at
  (genome) position 10 but pos 10 is inside a codon (in that segment), and we've
  zoomed to pos 10, then we'll expand the local coordinates into the next
  segment to complete the codon even though the next segment may be well beyond
  the zoom bounds */
  cdsLocalStart -= (cdsLocalStart-1)%3;
  const endOverhang = cdsLocalEnd%3;
  if (endOverhang) {
    cdsLocalEnd += endOverhang===1 ? 2 : 1;
  }

  return [[cdsLocalStart, cdsLocalEnd], true];
}

export function getNucCoordinatesFromAaPos(cds, aaPos) {
  let frame;
  const nucCoordinates = [];
  const ntCodonStart = (aaPos-1)*3 + 1; /* codon triplet starts here (inclusive, 1-based) */
  const positive = cds.strand==='+';
  for (let i=0; i<cds.segments.length; i++) {
    let segment = cds.segments[i];
    if (segment.rangeLocal[1] < ntCodonStart) continue;
    frame = `frame ${segment.frame}`;
    if (positive) {
      let ntPosGenome = segment.rangeGenome[0] + (ntCodonStart - segment.rangeLocal[0]);
      while (ntPosGenome <= segment.rangeGenome[1] && nucCoordinates.length<3) {
        nucCoordinates.push(ntPosGenome++);
      }
    } else {
      let ntPosGenome = segment.rangeGenome[1] - (ntCodonStart - segment.rangeLocal[0]);
      while (ntPosGenome >= segment.rangeGenome[0] && nucCoordinates.length<3) {
        nucCoordinates.push(ntPosGenome--);
      }
    }
    /** If we were lucky and the entire codon fell into a single segment, then
     * we're done. If not, we proceed to the next segment and grab the one or
     * two nucleotides to make up the codon */
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
      if (positive) {
        nucCoordinates.push(segment.rangeGenome[0]);
        if (nucCoordinates.length<3) {
          nucCoordinates.push(segment.rangeGenome[0]+1);
        }
      } else {
        nucCoordinates.push(segment.rangeGenome[1]);
        if (nucCoordinates.length<3) {
          nucCoordinates.push(segment.rangeGenome[1]-1);
        }
      }
    }
    break;
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

/**
 * Given a nucleotide in Genome space (e.g. from `rangeGenome`) find all CDSs
 * which have a segment covering that nucleotide and return the local coordinate
 * of that position (in both nuc + aa coordinates)
 * Returns {cds: CDS; nucLocal: number; aaLocal: number}[]
 */
export function nucleotideToAaPosition(genomeMap, nucPos) {
  const matches = [];
  getCds(genomeMap).forEach((cds) => {
    for (const segment of cds.segments) {
      if (segment.rangeGenome[0] <= nucPos && segment.rangeGenome[1] >= nucPos) {
        const delta = cds.strand==='+' ?
          nucPos - segment.rangeGenome[0] :
          segment.rangeGenome[1] - nucPos;
        const nucLocal = segment.rangeLocal[0]+delta;
        const aaLocal = Math.ceil(nucLocal/3);
        matches.push({cds, nucLocal, aaLocal})
        /* Don't return here - we want to check future segments as segments can
        be overlapping */
      }
    }
  })
  return matches;
}