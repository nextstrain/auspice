import { getTraitFromNode } from "./treeMiscHelpers";

export const setGenotype = (nodes, prot, positions, rootSequence) => {
  // console.time("setGenotype")
  const nPositions = positions.length;
  const ancState = positions.map(() => undefined);
  const ancNodes = positions.map(() => []);
  const recurse = (node, state) => {
    const newState = state; /* reference. cheap */
    let data; // any potential mutations that would result in a state change
    if (node.branch_attrs && node.branch_attrs.mutations && node.branch_attrs.mutations[prot]) {
      data = node.branch_attrs.mutations[prot];
    }
    if (data && data.length) {
      for (let i = 0; i < data.length; i++) {
        const m = data[i];
        const mPos = parseInt(m.slice(1, m.length - 1), 10);
        for (let j = 0; j < nPositions; j++) {
          if (positions[j] === mPos) {
            /* check if ancState is known / set */
            if (!ancState[j]) ancState[j] = m.slice(0, 1); // only set once. Unknowable until the 1st mutation is seen.
            newState[j] = m.slice(m.length - 1, m.length);
          }
        }
      }
    }
    /* set for all nodes. will be undefined if ancestral */
    node.currentGt = [...newState];
    for (let j = 0; j < nPositions; j++) {
      if (!newState[j]) {
        ancNodes[j].push(node);
      }
    }
    if (node.hasChildren) {
      for (const child of node.children) {
        recurse(child, [...newState]);
      }
    }
  };
  recurse(nodes[0], positions.map(() => undefined));

  /* If the root-sequence JSON is available, then we can get the ancestral nt/aa for each position.
  If we know these from above we can use it as a check, if we don't (because it was a position
  with no mutations) then we can use it to set the color-by */
  if (rootSequence) {
    ancState.forEach((inferredValue, i) => {
      try {
        const rootSeqValue = rootSequence[prot][positions[i]-1]; // -1 as JS is 0-indexed
        if (!inferredValue) {
          ancState[i] = rootSeqValue;
        } else if (inferredValue!==rootSeqValue) {
          console.error(`Mismatch between inferred ancestral state for ${prot}@${positions[i]} of ${inferredValue} and the root-sequence JSON value of ${rootSeqValue}`);
        }
      } catch (err) {
        console.error("Error accessing the root-sequence data", err.message);
      }
    });
  }

  for (let j = 0; j < nPositions; j++) {
    for (const node of ancNodes[j]) {
      node.currentGt[j] = ancState[j];
    }
  }
  nodes.forEach((n) => {n.currentGt = n.currentGt.join(' / ');});
  // console.timeEnd("setGenotype")
  // console.log(`set ${ancNodes.length} nodes to the ancestral state: ${ancState}`)
};

export const orderOfGenotypeAppearance = (nodes, mutType) => {
  const seen = {};
  nodes.forEach((n) => {
    let numDate = getTraitFromNode(n, "num_date");
    if (numDate === undefined) numDate = 0;
    if (!seen[n.currentGt] || numDate < seen[n.currentGt]) {
      seen[n.currentGt] = numDate;
    }
  });
  const ordered = Object.keys(seen);
  ordered.sort((a, b) => seen[a] < seen[b] ? -1 : 1);
  let orderedBases;
  // remove 'non-bases' (X - N)
  if (mutType === "nuc") {
    orderedBases = ordered.filter((x) => x !== "X" && x !== "-" && x !== "N");
  } else {
    orderedBases = ordered.filter((x) => x !== "X" && x !== "-");
  }
  // Add back on non-bases in a specific order
  if (ordered.indexOf("-") !== -1) {
    orderedBases.push("-");
  }
  if (ordered.indexOf("N") !== -1 && mutType === "nuc") {
    orderedBases.push("N");
  }
  if (ordered.indexOf("X") !== -1) {
    orderedBases.push("X");
  }
  return orderedBases;
};
