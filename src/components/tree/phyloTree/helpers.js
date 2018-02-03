
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
