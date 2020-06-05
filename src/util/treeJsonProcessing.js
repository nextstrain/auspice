import { getDefaultTreeState } from "../reducers/tree";
import { getVaccineFromNode } from "./treeMiscHelpers";

/**
* for each node, calculate the number of subtending tips (alive or dead)
* side effects: n.fullTipCount for each node
*  @param root - deserialized JSON root to begin traversal
*/
const calcFullTipCounts = (node) => {
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

/**
 * Adds certain properties to the nodes array - for each node in nodes it adds
 * node.fullTipCount - see calcFullTipCounts() description
 * node.hasChildren {bool}
 * node.arrayIdx  {integer} - the index of the node in the nodes array
 * @param  {array} nodes redux tree nodes
 * @return {array} input array (kinda unneccessary)
 * side-effects: node.hasChildren (bool) and node.arrayIdx (INT) for each node in nodes
 */
const processNodes = (nodes) => {
  calcFullTipCounts(nodes[0]); /* recursive. Uses d.children */
  nodes.forEach((d, idx) => {
    d.arrayIdx = idx; /* set an index so that we can access visibility / nodeColors if needed */
    d.hasChildren = typeof d.children !== "undefined";
  });
  return nodes;
};

/**
 * Scan the tree for `node.branch_attrs.labels` dictionaries and collect all available
 * (These are the options for the "Branch Labels" sidebar dropdown)
 * @param {Array} nodes tree nodes (flat)
 */
const processBranchLabelsInPlace = (nodes) => {
  const availableBranchLabels = new Set();
  nodes.forEach((n) => {
    if (n.branch_attrs && n.branch_attrs.labels) {
      Object.keys(n.branch_attrs.labels)
        .forEach((labelName) => {
          availableBranchLabels.add(labelName);
          /* cast all branch label values to strings */
          n.branch_attrs.labels[labelName] = String(n.branch_attrs.labels[labelName]);
        });
    }
  });
  return ["none", ...availableBranchLabels];
};

/**
*  For each node visit if node not a hashMap key, insert
*  into array.  Then append node into end of the array.
*  @params node - object to check
*  @param hashMap - object literal used for deduping
*  @param array - final array that nodes are inserted
*/
const visitNode = (node, hashMap, array) => {
  if (!hashMap[node.name]) {
    hashMap[node.name] = true;
    array.push(node);
  }
};

/**
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*  hashMap object literal used for deduping.
*  @param root - deserialized JSON root to begin traversal
*  @returns array  - final array of nodes in order with no dups
*/
const flattenTree = (root) => {
  const stack = [], array = [], hashMap = {};
  stack.push(root);
  while (stack.length !== 0) {
    const node = stack.pop();
    visitNode(node, hashMap, array);
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        stack.push(node.children[i]);
      }
    }
  }
  return array;
};

/**
*  Add reference to node.parent for each node in tree
*  For root add root.parent = root
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*  @param root - deserialized JSON root to begin traversal
*/
const appendParentsToTree = (root) => {
  root.parent = root;
  const stack = [];
  stack.push(root);

  while (stack.length !== 0) {
    const node = stack.pop();
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        node.children[i].parent = node;
        stack.push(node.children[i]);
      }
    }
  }
};

export const treeJsonToState = (treeJSON) => {
  appendParentsToTree(treeJSON);
  const nodesArray = flattenTree(treeJSON);
  const nodes = processNodes(nodesArray);
  const vaccines = nodes.filter((d) => {
    const v = getVaccineFromNode(d);
    return (v && (Object.keys(v).length > 1 || Object.keys(v)[0] !== "serum"));
  });
  const availableBranchLabels = processBranchLabelsInPlace(nodesArray);
  return Object.assign({}, getDefaultTreeState(), {
    nodes, vaccines, availableBranchLabels, loaded: true
  });
};
