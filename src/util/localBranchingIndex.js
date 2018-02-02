
/* sets each node in the tree to alive=true if it has at least one descendent with current=true */
const setNodeAlive = (node, cutoff) => {
  if (node.children) {
    let aliveChildren = false;
    for (let i = 0, c = node.children.length; i < c; i++) {
      setNodeAlive(node.children[i], cutoff);
      aliveChildren = aliveChildren || node.children[i].alive;
    }
    node.alive = aliveChildren;
  } else {
    node.alive = node.attr.num_date > cutoff;
  }
};

/* for each node, calculate the exponentially attenuated tree length below the node
the polarizer is send "up", i.e. to parents */
function calcUpPolarizers(node, LBItau) {
  node.up_polarizer = 0;
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      calcUpPolarizers(node.children[i], LBItau);
      node.up_polarizer += node.children[i].up_polarizer;
    }
  }
  const bl = node.clock_length / LBItau;
  node.up_polarizer *= Math.exp(-bl);
  if (node.alive) { // only alive branches contribute anything
    node.up_polarizer += LBItau * (1 - Math.exp(-bl));
  }
}

/* for each node, calculate the exponentially attenuated tree length above the node,
that is "outside" the clade defined by this node. this down polarizer is send to children */
function calcDownPolarizers(node, LBItau) {
  if (node.children) {
    for (let i1 = 0; i1 < node.children.length; i1++) {
      node.children[i1].down_polarizer = node.down_polarizer;
      for (let i2 = 0; i2 < node.children.length; i2++) {
        if (i1 !== i2) {
          node.children[i1].down_polarizer += node.children[i2].up_polarizer;
        }
      }
      // account for the attenuation over the branch_length
      const bl = node.children[i1].clock_length / LBItau;
      node.children[i1].down_polarizer *= Math.exp(-bl);
      if (node.children[i1].alive) { // the branch contributes only when the node is alive
        node.children[i1].down_polarizer += LBItau * (1 - Math.exp(-bl));
      }
      calcDownPolarizers(node.children[i1], LBItau);
    }
  }
}

function calcPolarizers(node, LBItau) {
  calcUpPolarizers(node, LBItau);
  node.down_polarizer = 0; // set the down polarizer of the root to 0
  calcDownPolarizers(node, LBItau);
}

/* calculate the LBI for all nodes downstream of node
allnodes is provided for easy normalization at the end
Side effects: adds the following to nodes:
  n.alive
  n.up_polarizer
  n.down_polarizer
  n.clock_length
  n.attr.lbi
Clealy n.attr.lbi is useful, but can we avoid storing those other values?
*/
export const setLBI = (nodes, maxDateInTree, LBItau, LBItimeWindow) => {
  // console.time('LBI');
  const LBIcutoff = maxDateInTree - LBItimeWindow;
  nodes.forEach((d) => {
    if (d.children) {
      for (let i = 0; i < d.children.length; i++) {
        d.children[i].clock_length = d.children[i].tvalue - d.tvalue;
      }
    }
  });
  nodes[0].clock_length = 0;
  setNodeAlive(nodes[0], LBIcutoff);
  calcPolarizers(nodes[0], LBItau);
  let maxLBI = 0;
  nodes.forEach((d) => {
    d.attr.lbi = d.down_polarizer;
    if (d.children) {
      for (let i = 0; i < d.children.length; i++) {
        d.attr.lbi += d.children[i].up_polarizer;
      }
    }
    if (d.attr.lbi > maxLBI) {
      maxLBI = d.attr.lbi;
    }
  });
  // normalize the LBI to range [0,1]
  nodes.forEach((d) => {d.attr.lbi /= maxLBI;});
  // console.timeEnd('LBI');
};
