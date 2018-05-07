import { getAttrsOnTerminalNodes, getDefaultTreeState } from "../reducers/tree";
import { calendarToNumeric } from "./dateHelpers";

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
    if (typeof d.attr === "undefined") d.attr = {};
    d.arrayIdx = idx; /* set an index so that we can access visibility / nodeColors if needed */
    d.hasChildren = typeof d.children !== "undefined";
    d.yvalue = undefined; /* calculate later in auspice */
  });
  return nodes;
};

/**
*  this function is changing as augur changes
*  @param {obj} nodes - nodes
*  @returns {list} avialble branch labels, with "none" the first element
*  side-effects: deletes "clade_name", "named_clades", "clade_assignment" out of node.attrs for all nodes.
*  adds node.attrs.labels {obj} to certain nodes.
*/
const processBranchLabelsInPlace = (nodes) => {
  const availableBranchLabels = new Set();
  nodes.forEach((n) => {
    const labels = []; /* [clade (str), aa (str)] */
    /* CLADE */
    if (n.attr.clade_name) {
      labels[0] = n.attr.clade_name;
      delete n.attr.clade_name;
    }
    if (n.attr.clade_annotation) {
      labels[0] = n.attr.clade_annotation;
      delete n.attr.clade_annotation;
    }
    /* AA */
    const muts = [];
    if (n.aa_muts) {
      for (const aa in n.aa_muts) { // eslint-disable-line
        if (n.aa_muts[aa].length) {
          muts.push(`${aa}: ${n.aa_muts[aa].join(", ")}`);
        }
      }
    }
    if (muts.length) {
      labels[1] = muts.join("; ");
    }
    /* ADD TO ATTR */
    if (labels.length) {
      n.attr.labels = {};
      if (labels[0]) {
        n.attr.labels.clade = labels[0];
        availableBranchLabels.add("clade");
      }
      if (labels[1]) {
        n.attr.labels.aa = labels[1];
        availableBranchLabels.add("aa");
      }
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
  if (!hashMap[node.clade]) {
    hashMap[node.clade] = true;
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

/**
*  if the metadata JSON defines vaccine strains then create an array of the nodes
*  @param nodes - nodes
*  @param vaccineChoices - undefined or the object from the metadata JSON linking strain names to dates
*  @returns array  - array of nodes that are vaccines. NOTE these are references to the nodes array
*  side-effects: adds the vaccineDate property to the relevent nodes
*/
const processVaccines = (nodes, vaccineChoices) => {
  if (!vaccineChoices) {return false;}
  const names = Object.keys(vaccineChoices);
  const vaccines = nodes.filter((d) => names.indexOf(d.strain) !== -1);
  vaccines.forEach((d) => {
    d.vaccineDate = vaccineChoices[d.strain];
    d.vaccineDateNumeric = calendarToNumeric(vaccineChoices[d.strain]);
  });
  return vaccines;
};


export const treeJsonToState = (treeJSON, vaccineChoices) => {
  appendParentsToTree(treeJSON);
  const nodesArray = flattenTree(treeJSON);
  const nodes = processNodes(nodesArray);
  const vaccines = vaccineChoices ?
    processVaccines(nodes, vaccineChoices) :
    [];
  const availableBranchLabels = processBranchLabelsInPlace(nodesArray);
  const attrs = getAttrsOnTerminalNodes(nodes);
  return Object.assign({}, getDefaultTreeState(), {
    nodes, vaccines, availableBranchLabels, attrs, loaded: true
  });
};
