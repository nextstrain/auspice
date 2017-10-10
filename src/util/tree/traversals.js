
/**
* traverse the tree and get the values -> counts for a single
* attr. Visibility of the node is ignored. Terminal nodes only.
* @param {Array} nodes - list of nodes
* @param {string} attr - attr to scan the tree for its values & counts
* @return {obj} keys: values found for the attr, values: counts
*/
export const getAllValuesAndCountsOfTraitFromTree = (nodes, attr) => {
  const stateCount = {};
  nodes.forEach((n) => {
    if (n.hasChildren) {return;}
    stateCount[n.attr[attr]] ? stateCount[n.attr[attr]] += 1 : stateCount[n.attr[attr]] = 1;
  });
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
