/**
 * for each node, calculate the exponentially attenuated tree length below the node
 * the polarizer is send "up", i.e. to parents
**/
export const calcUpPolarizers = (node) => {
  node.up_polarizer = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcUpPolarizers(node.children[i]);
      node.up_polarizer += node.children[i].up_polarizer;
    }
  }
  const bl = node.branch_length / LBItau;
  node.up_polarizer *= Math.exp(-bl);
  if (node.alive) { // only alive branches contribute anything
    node.up_polarizer += LBItau * (1 - Math.exp(-bl));
  }
};

/**
 * for each node, calculate the exponentially attenuated tree length above the node,
 * that is "outside" the clade defined by this node. this down polarizer is send to children
**/
export const calcDownPolarizers = (node) => {
  if (typeof node.children !== "undefined") {
    for (let i1 = 0; i1 < node.children.length; i1++) {
      node.children[i1].down_polarizer = node.down_polarizer;
      for (let i2 = 0; i2 < node.children.length; i2++) {
        if (i1 !== i2) {
          node.children[i1].down_polarizer += node.children[i2].up_polarizer;
        }
      }
      // account for the attenuation over the branch_length
      const bl = node.children[i1].branch_length / LBItau;
      node.children[i1].down_polarizer *= Math.exp(-bl);
      if (node.children[i1].alive) { //the branch contributes only when the node is alive
        node.children[i1].down_polarizer += LBItau * (1 - Math.exp(-bl));
      }
      calcDownPolarizers(node.children[i1]);
    }
  }
};

export const calcPolarizers = (node) => {
  calcUpPolarizers(node);
  node.down_polarizer = 0; // set the down polarizer of the root to 0
  calcDownPolarizers(node);
};

/**
 * calculate the LBI for all nodes downstream of node
 * allnodes is provided for easy normalization at the end
**/
export const calcLBI = (node, allnodes) => {
  setNodeAlive(node);
  calcPolarizers(node);
  allnodes.forEach((d) => {
    d.LBI = 0;
    d.LBI += d.down_polarizer;
    if (typeof d.children !== "undefined") {
      for (let i = 0; i < d.children.length; i++) {
        d.LBI += d.children[i].up_polarizer;
      }
    }
  });
  // normalize the LBI to range [0,1]
  /* possible bug - where does maxLBI get used? is this attaching to window? */
  maxLBI = d3.max(allnodes.map((d) => { return d.LBI; }));
  allnodes.forEach((d) => { d.LBI /= maxLBI;});
};
