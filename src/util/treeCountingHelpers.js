/**
* traverse the tree to get state counts for supplied traits
* @param {Array} nodes - list of nodes
* @param {Array} traits - list of traits to count across the tree
* @param {Array | false} visibility - if Array provided then only consider visible nodes. If false, consider all nodes.
* @param {bool} terminalOnly - only consider terminal / leaf nodes?
* @return {obj} keys: the traits. Values: an object mapping trait values -> INT
*/
export const countTraitsAcrossTree = (nodes, traits, visibility, terminalOnly) => {
  const counts = {};
  traits.forEach((trait) => {counts[trait] = {};});

  nodes.forEach((node) => {
    traits.forEach((trait) => {        // trait is "country" or "author" etc
      const value = node.attr[trait];  // value is "USA", "Black et al" etc

      if (!value || value === "undefined" || value === "?") {
        return;
      }

      if (terminalOnly && node.hasChildren) {
        return;
      }

      if (visibility && visibility[node.arrayIdx] !== "visible") {
        return;
      }

      counts[trait][value] ? counts[trait][value] += 1 : counts[trait][value] = 1;
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
    node.tipCount = visibility[node.arrayIdx] === "visible" ? 1 : 0;
  }
};
