/* eslint-disable no-param-reassign */
import { max } from "d3-array";
import {getTraitFromNode, getDivFromNode} from "../../../util/treeMiscHelpers";

/** get a string to be used as the DOM element ID
 * Note that this cannot have any "special" characters
 */
export const getDomId = (type, strain) => {
  // Replace non-alphanumeric characters with dashes (probably unnecessary)
  const name = `${type}_${strain}`.replace(/(\W+)/g, '-');
  return CSS.escape(name);
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


/** get the idx of the zoom node (i.e. the in-view root node).
 * This differs depending on which tree is in view so it's helpful to access it
 * by reaching into phyotree to get it
 */
export const getIdxOfInViewRootNode = (node) => {
  return node.shell.that.zoomNode.n.arrayIdx;
};

/**
 * Are the provided nodes within some divergence / time of each other?
 * NOTE: `otherNode` is always closer to the root in the tree than `node`
 */
function isWithinBranchTolerance(node, otherNode, distanceMeasure) {
  if (distanceMeasure === "num_date") {
    /* We calculate the threshold by reaching into phylotree to extract the date range of the dataset
    and then split the data into ~50 slices. This could be refactored to not reach into phylotree. */
    const tolerance = (node.shell.that.dateRange[1]-node.shell.that.dateRange[0])/50;
    return (getTraitFromNode(node, "num_date") - tolerance < getTraitFromNode(otherNode, "num_date"));
  }
  /* Compute the divergence tolerance similarly to above. This uses the approach used to compute the
  x-axis grid within phyotree, and could be refactored into a helper function. Note that we don't store
  the maximum divergence on the tree so we use the in-view max instead */
  const tolerance = (node.shell.that.xScale.domain()[1] - node.shell.that.nodes[0].depth)/50;
  return (getDivFromNode(node) - tolerance < getDivFromNode(otherNode));
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
  while (isWithinBranchTolerance(node, potentialNode, distanceMeasure)) {
    if (potentialNode === potentialNode.parent) break; // root node of tree
    potentialNode = potentialNode.parent;
  }
  return potentialNode;
};

/**
 * Prior to Jan 2020, the divergence measure was always "subs per site per year"
 * however certain datasets changed this to "subs per year" across entire sequence.
 * This distinction is not set in the JSON, so in order to correctly display the rate
 * we will "guess" this here. A future augur update will export this in a JSON key,
 * removing the need to guess.
 */
export function guessAreMutationsPerSite(scale) {
  const maxDivergence = max(scale.domain());
  return maxDivergence <= 5;
}
