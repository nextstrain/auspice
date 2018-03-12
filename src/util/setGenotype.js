
export const setGenotype = (nodes, prot, positions) => {
  // console.time("setGenotype")
  const nPositions = positions.length;
  const ancState = positions.map(() => undefined);
  const ancNodes = positions.map(() => []);
  const recurse = (node, state) => {
    const newState = state; /* reference. cheap */
    let data; // any potential mutations that would result in a state change
    if (prot === "nuc" && node.muts && node.muts.length) {
      data = node.muts;
    } else if (node.aa_muts && node.aa_muts[prot]) {
      data = node.aa_muts[prot];
    }
    if (data) {
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
        recurse(child, newState);
      }
    }
  };
  recurse(nodes[0], positions.map(() => undefined), positions);
  for (let j = 0; j < nPositions; j++) {
    for (const node of ancNodes[j]) {
      node.currentGt[j] = ancState[j];
    }
  }
  nodes.forEach((n) => {n.currentGt = n.currentGt.join(' / ');});
  // console.timeEnd("setGenotype")
  // console.log(`set ${ancNodes.length} nodes to the ancestral state: ${ancState}`)
};
