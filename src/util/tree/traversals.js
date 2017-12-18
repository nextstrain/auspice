import * as entropy from "../entropy";
/**
* traverse the tree and get the values -> counts for a single
* attr. Visibility of the node is ignored. Terminal nodes only.
* @param {Array} nodes - list of nodes
* @param {Array | string} attrs - string (for a single attr), or list of attrs to scan the tree for their values & counts
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
*/
export const getAllValuesAndCountsOfTraitsFromTree = (nodes, attrs) => {
  const stateCount = {};
  if (typeof attrs === "string") {
    const attr = attrs;
    stateCount[attr] = {};
    nodes.forEach((n) => {
      if (n.hasChildren) {return;}
      if (!n.attr[attr] || n.attr[attr] === "undefined" || n.attr[attr] === "?") {return;}
      stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
    });
  } else {
    for (const attr of attrs) {
      stateCount[attr] = {};
    }
    nodes.forEach((n) => {
      if (n.hasChildren) {return;}
      for (const attr of attrs) {
        if (!n.attr[attr] || n.attr[attr] === "undefined" || n.attr[attr] === "?") {return;}
        // attr is "country" or "author" etc
        // n.attr[attr] is "USA", "Black et al", "USVI", etc
        stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
      }
    });
  }
  return stateCount;
};

/**
* traverse the tree and get the values -> counts for each attr in attrs
* only examine terminal nodes which are visible
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes. Value: "visibile" or ""
* @param {Array} attrs - list of attrs to scan the tree for their values & counts
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
*/
export const getValuesAndCountsOfVisibleTraitsFromTree = (nodes, visibility, attrs) => {
  const stateCount = {};
  for (const attr of attrs) {
    stateCount[attr] = {};
  }
  nodes.forEach((n) => {
    if (n.hasChildren) {return;}
    if (visibility[n.arrayIdx] !== "visible") {return;}
    for (const attr of attrs) {
      // attr is "country" or "author" etc
      // n.attr[attr] is "USA", "Black et al", "USVI", etc
      stateCount[attr][n.attr[attr]] ? stateCount[attr][n.attr[attr]] += 1 : stateCount[attr][n.attr[attr]] = 1;
    }
  });
  return stateCount;
};


/**
* traverse the tree and compile the entropy data for the visibile branches
* @param {Array} nodes - list of nodes
* @param {Array} visibility - 1-1 correspondence with nodes. Value: "visibile" or ""
* @param {String} mutType - amino acid | nucleotide mutations - "aa" | "nuc"
* @param {obj} geneMap used to NT fill colours. This should be imroved.
* @param {bool} showCounts show counts or entropy values?
* @return {obj} keys: the entries in attrs. Values: an object mapping values -> counts
* TODO: this algorithm can be much improved, and the data structures returned improved also
*/
export const calcEntropyInView = (nodes, visibility, mutType, geneMap, showCounts) => {
  return showCounts ?
    entropy.calcMutationCounts(nodes, visibility, geneMap, mutType === "aa") :
    entropy.calcEntropy(nodes, visibility, geneMap, mutType === "aa");
};
