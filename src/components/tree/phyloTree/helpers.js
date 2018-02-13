
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
* given nodes, create the shell property, which links the redux properties
* (theoretically immutable) with the phylotree properties (changeable)
*/


/*
* given nodes, create the children and parent properties.
* modifies the nodes argument in place
* returns num tips
*/
export const createChildrenAndParentsReturnNumTips = (nodes) => {
  let numTips = 0;
  nodes.forEach((d) => {
    d.parent = d.n.parent.shell;
    if (d.terminal) {
      d.children = null;
      numTips++;
    } else {
      d.children = [];
      for (let i = 0; i < d.n.children.length; i++) {
        d.children.push(d.n.children[i].shell);
      }
    }
  });
  return numTips;
};


/**
 * given nodes add y values (node.yvalue) to every node
 * Nodes are the phyloTree nodes (i.e. node.n is the redux node)
 * Nodes must have parent child links established (via createChildrenAndParents)
 * PhyloTree can subsequently use this information. Accessed by prototypes
 * rectangularLayout, radialLayout, createChildrenAndParents
 * side effects: node.n.yvalue (i.e. in the redux node) and node.yRange (i.e. in the phyloTree node)
 */
export const calcYValues = (nodes, spacing = "even", numberOfTips = undefined) => {
  console.time("calcYValues")
  console.log("running calcYValues with spacing", spacing)
  let total = 0; /* cumulative counter of y value at tip */
  let calcY; /* fn called calcY(node) to return some amount of y value at a tip */
  if (spacing === "inView") {
    /* inView nodes get 80% of the screen real-estate */
    let numInViewTips = 0;
    nodes.forEach((d) => {if (!d.children && d.inView) numInViewTips++;});
    const yPerInView = (0.8 * numberOfTips) / numInViewTips;
    const yPerOutOfView = (0.2 * numberOfTips) / (numberOfTips - numInViewTips);
    calcY = (node) => {
      // console.log("node inView", node.inView, node.inView ? yPerInView : yPerOutOfView);
      total += node.inView ? yPerInView : yPerOutOfView;
      return total;
    };
  } else { /* fall back to even spacing */
    if (spacing !== "even") console.warn("falling back to even spacing of y values. Unknown arg:", spacing);
    calcY = () => ++total;
  }

  const recurse = (node) => {
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        recurse(node.children[i]);
      }
    } else {
      node.n.yvalue = calcY(node);
      node.yRange = [node.n.yvalue, node.n.yvalue];
      return;
    }
    /* if here, then all children have yvalues, but we dont. */
    node.n.yvalue = node.children.reduce((acc, d) => acc + d.n.yvalue, 0) / node.children.length;
    node.yRange = [node.n.children[0].yvalue, node.n.children[node.n.children.length - 1].yvalue];
  };
  recurse(nodes[0]);
  console.timeEnd("calcYValues")
};
