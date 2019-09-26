import { NODE_VISIBLE } from "./globals";
import { getTraitFromNode } from "./treeMiscHelpers";

/**
* traverse the tree to get state counts for supplied traits.
* @param {Array} nodes - list of nodes
* @param {Array} traits - list of traits to count across the tree
* @param {Array | false} visibility - if Array provided then only consider visible nodes. If false, consider all nodes.
* @param {bool} terminalOnly - only consider terminal / leaf nodes?
* @return {obj} keys: the traits. Values: an object mapping trait values -> INT
*/
export const countTraitsAcrossTree = (nodes, traits, visibility, terminalOnly) => {
  const counts = {};
  traits.forEach((trait) => {counts[trait] = new Map();});

  nodes.forEach((node) => {
    traits.forEach((trait) => {                         // traits are "country" or "author" etc
      const value = getTraitFromNode(node, trait);      // value is "USA", "black" etc

      if (terminalOnly && node.hasChildren) {
        return;
      }

      if (visibility && visibility[node.arrayIdx] !== NODE_VISIBLE) {
        return;
      }

      const currentValue = counts[trait].get(value) || 0;
      counts[trait].set(value, currentValue+1);
    });
  });
  return counts;
};

/**
* for each node, calculate the number of subtending tips which are visible
* side effects: n.tipCount for each node
*  @param root - deserialized JSON root to begin traversal
*/
export const calcTipCounts = (node, visibility) => {
  node.tipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcTipCounts(node.children[i], visibility);
      node.tipCount += node.children[i].tipCount;
    }
  } else {
    node.tipCount = visibility[node.arrayIdx] === NODE_VISIBLE ? 1 : 0;
  }
};

/**
 * calculate the total number of tips in the tree
 * @param {Array} nodes flat list of all nodes
 */
export const calcTotalTipsInTree = (nodes) => {
  let count = 0;
  nodes.forEach((n) => {
    if (!n.hasChildren) count++;
  });
  return count;
};

