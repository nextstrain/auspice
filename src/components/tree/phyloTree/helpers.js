
/*
 * adds the total number of descendant leaves to each node in the tree
 * the functions works recursively.
 * @params:
 *   node -- root node of the tree.
 */
export const addLeafCount = (node) => {
  if (node.terminal) {
    node.leafCount = 1;
  } else {
    node.leafCount = 0;
    for (let i = 0; i < node.children.length; i++) {
      addLeafCount(node.children[i]);
      node.leafCount += node.children[i].leafCount;
    }
  }
};


/*
 * this function takes a call back and applies it recursively
 * to all child nodes, including internal nodes
 * @params:
 *   node -- node to whose children the function is to be applied
 *   func -- call back function to apply
 */
export const applyToChildren = (node, func) => {
  func(node);
  if (node.terminal) {
    return;
  }
  for (let i = 0; i < node.children.length; i++) {
    applyToChildren(node.children[i], func);
  }
};


/*
* given nodes, create the children and parent properties.
* modifies the nodes argument in place
*/
export const createChildrenAndParentsReturnNumTips = (nodes) => {
  let numTips = 0;
  nodes.forEach((d) => {
    d.parent = d.n.parent.shell;
    if (d.terminal) {
      d.yRange = [d.n.yvalue, d.n.yvalue];
      d.children = null;
      numTips++;
    } else {
      d.yRange = [d.n.children[0].yvalue, d.n.children[d.n.children.length - 1].yvalue];
      d.children = [];
      for (let i = 0; i < d.n.children.length; i++) {
        d.children.push(d.n.children[i].shell);
      }
    }
  });
  return numTips;
};

/** setYValues
 * given nodes, this fn sets node.yvalue for each node
 * Nodes are the phyloTree nodes (i.e. node.n is the redux node)
 * Nodes must have parent child links established (via createChildrenAndParents)
 * PhyloTree can subsequently use this information. Accessed by prototypes
 * rectangularLayout, radialLayout, createChildrenAndParents
 * side effects: node.n.yvalue (i.e. in the redux node) and node.yRange (i.e. in the phyloTree node)
 */
export const setYValues = (nodes) => {
  console.log("set Y values")
  let count = 0;
  const recurse = (node) => {
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        recurse(node.children[i]);
      }
    } else {
      node.n.yvalue = ++count;
      node.yRange = [count, count];
      return;
    }
    /* if here, then all children have yvalues, but we dont. */
    node.n.yvalue = node.children.reduce((acc, d) => acc + d.n.yvalue, 0) / node.children.length;
    node.yRange = [node.n.children[0].yvalue, node.n.children[node.n.children.length - 1].yvalue];
  };
  recurse(nodes[0]);
};
