/* eslint-disable no-param-reassign */
import {getTraitFromNode, getDivFromNode} from "../../../util/treeMiscHelpers";

/** get a string to be used as the DOM element ID
 * Note that this cannot have any "special" characters
 */
export const getDomId = (type, strain) => {
  const name = typeof strain === "string" ? strain.replace(/[/_.;,~|[\]-]/g, '') : strain;
  return `${type}_${name}`;
};

/**
 * computes a measure of the total number of leaves for each node in
 * the tree, weighting leaves differently if they are inView.
 * Note: function is recursive
 * @param {obj} node -- root node of the tree
 * @returns {undefined}
 * @sideEffects sets `node.leafCount` {number} for all nodes
 */
export const addLeafCount = (node) => {
  if (node.terminal && node.inView) {
    node.leafCount = 1;
  } else if (node.terminal && !node.inView) {
    node.leafCount = 0.15;
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
  if (node.terminal || node.children === undefined) { // in case clade set by URL, terminal hasn't been set yet!
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

/** setYValuesRecursively
 */
export const setYValuesRecursively = (node, yCounter) => {
  if (node.children) {
    for (let i = node.children.length - 1; i >= 0; i--) {
      yCounter = setYValuesRecursively(node.children[i], yCounter);
    }
  } else {
    node.n.yvalue = ++yCounter;
    node.yRange = [yCounter, yCounter];
    return yCounter;
  }
  /* if here, then all children have yvalues, but we dont. */
  node.n.yvalue = node.children.reduce((acc, d) => acc + d.n.yvalue, 0) / node.children.length;
  node.yRange = [node.n.children[0].yvalue, node.n.children[node.n.children.length - 1].yvalue];
  return yCounter;
};

/** setYValues
 * given nodes, this fn sets node.yvalue for each node
 * Nodes are the phyloTree nodes (i.e. node.n is the redux node)
 * Nodes must have parent child links established (via createChildrenAndParents)
 * PhyloTree can subsequently use this information. Accessed by prototypes
 * rectangularLayout, radialLayout, createChildrenAndParents
 * side effects: node.n.yvalue (i.e. in the redux node) and node.yRange (i.e. in the phyloTree node)
 */
export const setYValues = (nodes) => setYValuesRecursively(nodes[0], 0);


export const formatDivergence = (divergence) => {
  return divergence > 1 ?
    Math.round((divergence + Number.EPSILON) * 1000) / 1000 :
    divergence > 0.01 ?
      Math.round((divergence + Number.EPSILON) * 10000) / 10000 :
      divergence.toExponential(3);
};


/**
 * Are the provided nodes within some divergence / time of each other?
 * NOTE: `otherNode` is always closer to the root in the tree than `node`
 */
function isWithinBranchTolerance(node, otherNode, distanceMeasure) {
  const timeTolerance = 1/12; // a month. TODO: make dataset dependent, e.g. 1/100 of the time range
  const divTolerance = 0.0001; // TODO: make dataset dependent, e.g. 1/100 of the total divergence range

  if (distanceMeasure === "num_date") {
    return (getTraitFromNode(node, "num_date") - timeTolerance < getTraitFromNode(otherNode, "num_date"));
  }
  // else: divergence
  return (getDivFromNode(node) - divTolerance < getDivFromNode(otherNode));
}


/**
 * Given a `node`, get the parent, grandparent etc node which is beyond some
 * branch length threshold (either divergence or time). This is useful for finding the node
 * beyond a polytomy, or polytomy-like structure
 * @param {object} node - tree node
 * @param {string} getParentBeyondPolytomy -- 'num_date' or 'div'
 * @returns {object} the closest node up the tree (towards the root) which is beyond
 * some threshold
 */
export const getParentBeyondPolytomy = (node, distanceMeasure) => {
  let potentialNode = node.parent;
  while (isWithinBranchTolerance(potentialNode, potentialNode.parent, distanceMeasure)) {
    if (potentialNode === potentialNode.parent) break; // root node of tree
    potentialNode = potentialNode.parent;
  }
  return potentialNode;
};
