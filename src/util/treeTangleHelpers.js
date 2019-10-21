import { NODE_VISIBLE } from "./globals";

export const constructVisibleTipLookupBetweenTrees = (nodesLeft, nodesRight, visibilityLeft, visibilityRight) => {
  const tree2StrainToIdxMap = {};
  for (let i = 0; i < nodesRight.length; i++) {
    if (!nodesRight[i].hasChildren) {
      // if (nodesRight[i].strain!=="A/Fujian/5/2014") continue;
      tree2StrainToIdxMap[nodesRight[i].name] = i;
    }
  }
  const lookup = []; // each entry is [idxInNodes, idxInNodesToo]
  for (let i = 0; i < nodesLeft.length; i++) {
    const rightIdx = tree2StrainToIdxMap[nodesLeft[i].name];
    if (
      !nodesLeft[i].hasChildren &&
      rightIdx &&
      visibilityLeft[i] === NODE_VISIBLE &&
      visibilityRight[rightIdx] === NODE_VISIBLE
    ) {
      lookup.push([i, tree2StrainToIdxMap[nodesLeft[i].name]]);
    }
  }
  return lookup;
};
