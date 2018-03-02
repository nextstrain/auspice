
export const setGenotype = (nodes, prot, pos) => {
  console.log('scanning for mutation', prot, pos)
  let ancState; // initialised to undefined
  const ancNodes = [];
  const recurse = (node, state) => {
    let newState = state;
    let data; // any potential mutations that would result in a state change
    if (prot === "nuc" && node.muts && node.muts.length) {
      data = node.muts;
    } else if (node.aa_muts && node.aa_muts[prot]) {
      data = node.aa_muts[prot];
    }
    if (data) {
      for (let i = 0; i < data.length; i++) {
        const m = data[i];
        if (parseInt(m.slice(1, m.length - 1), 10) === pos) {
          if (!ancState) {ancState = m.slice(0, 1);} // only set once. Unknowable until the 1st mutation is seen.
          newState = m.slice(m.length - 1, m.length);
        }
      }
    }
    /* set for all nodes (terminal or not) */
    if (newState !== undefined) {
      node.currentGt = newState;
    } else {
      ancNodes.push(node); // reference. cheap.
    }
    if (node.hasChildren) {
      for (const child of node.children) {
        recurse(child, newState);
      }
    }
  };
  recurse(nodes[0], undefined);
  for (const node of ancNodes) {
    node.currentGt = ancState;
  }
  // console.log(`set ${ancNodes.length} nodes to the ancestral state: ${ancState}`)
};

export const experimentalSetGenotype = (nodes, prot, positions) => {
  console.log('scanning for mutation', prot, positions)
  /* set em all to '' */
  nodes.forEach((n) => {n.currentGt = [];});
  let currentGtIdx = 0;
  let ancState; // initialised to undefined
  const ancNodes = [];
  const recurse = (node, state, pos) => {
    let newState = state;
    let data; // any potential mutations that would result in a state change
    if (prot === "nuc" && node.muts && node.muts.length) {
      data = node.muts;
    } else if (node.aa_muts && node.aa_muts[prot]) {
      data = node.aa_muts[prot];
    }
    if (data) {
      for (let i = 0; i < data.length; i++) {
        const m = data[i];
        if (parseInt(m.slice(1, m.length - 1), 10) === pos) {
          if (!ancState) {ancState = m.slice(0, 1);} // only set once. Unknowable until the 1st mutation is seen.
          newState = m.slice(m.length - 1, m.length);
        }
      }
    }
    /* set for all nodes (terminal or not) */
    if (newState !== undefined) {
      node.currentGt[currentGtIdx] = newState;
    } else {
      ancNodes.push(node); // reference. cheap.
    }
    if (node.hasChildren) {
      for (const child of node.children) {
        recurse(child, newState, pos);
      }
    }
  };
  for (let pos of positions) { // eslint-disable-line
    console.log("recursing for", pos);
    recurse(nodes[0], undefined, pos);
    for (const node of ancNodes) {
      node.currentGt[currentGtIdx] = ancState;
    }
    ancState = undefined;
    currentGtIdx++;
  }
  nodes.forEach((n) => {n.currentGt = n.currentGt.join('+');});
  // console.log(`set ${ancNodes.length} nodes to the ancestral state: ${ancState}`)
};
