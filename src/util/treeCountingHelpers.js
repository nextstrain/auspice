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

      if (terminalOnly && node.hasChildren) {
        return;
      }

      if (visibility && visibility[node.arrayIdx] !== NODE_VISIBLE) {
        return;
      }

      const value = getTraitFromNode(node, trait);      // value is "USA", "black" etc
      if (value===undefined) return;                    // check for invalid values
      const currentValueCount = counts[trait].get(value) || 0;
      counts[trait].set(value, currentValueCount+1);
    });
  });
  return counts;
};


/**
 * Scan terminal nodes and gather all trait names with at least one valid value.
 * Includes a hardcoded list of trait names we will ignore, as well as any trait
 * which we know is continuous (via a colouring definition) because the
 * filtering is not designed for these kinds of data (yet).
 * @param {Array} nodes 
 * @param {Object} colorings
 * @returns {Array} list of trait names
 */
export const gatherTraitNames = (nodes, colorings) => {
  const ignore = new Set([
    'num_date',
    ...Object.entries(colorings).filter(([_, info]) => info.type==='continuous').map(([name, _]) => name),
  ])
  const names = new Set();
  for (const node of nodes) {
    if (node.hasChildren) continue;
    for (const traitName in node.node_attrs || {}) {
      if (ignore.has(traitName)) continue;
      if (names.has(traitName)) continue;
      if (getTraitFromNode(node, traitName)) { // ensures validity
        names.add(traitName);
      }
    }
  }
  return [...names]
}

/**
* for each node, calculate the number of subtending tips which are visible
* side effects: n.tipCount for each node
* @param {Node} node - deserialized JSON root to begin traversal
* @param {Array<Int>} visibility
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
 * @param {Array<Node>} nodes flat list of all nodes
 */
export const calcTotalTipsInTree = (nodes) => {
  let count = 0;
  nodes.forEach((n) => {
    if (!n.hasChildren) count++;
  });
  return count;
};

/**
* for each node, calculate the number of subtending tips (alive or dead)
* side effects: n.fullTipCount for each node
* @param {Node} node - deserialized JSON root to begin traversal
*/
export const calcFullTipCounts = (node) => {
  node.fullTipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcFullTipCounts(node.children[i]);
      node.fullTipCount += node.children[i].fullTipCount;
    }
  } else {
    node.fullTipCount = 1;
  }
};
