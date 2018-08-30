
export const constructVisibleTipLookupBetweenTrees = (nodesLeft, nodesRight, visibilityLeft, visibilityRight) => {
  const tree2StrainToIdxMap = {};
  for (let i = 0; i < nodesRight.length; i++) {
    if (!nodesRight[i].hasChildren) {
      // if (nodesRight[i].strain!=="A/Fujian/5/2014") continue;
      tree2StrainToIdxMap[nodesRight[i].strain] = i;
    }
  }
  const lookup = []; // each entry is [idxInNodes, idxInNodesToo]
  for (let i = 0; i < nodesLeft.length; i++) {
    const rightIdx = tree2StrainToIdxMap[nodesLeft[i].strain];
    if (
      !nodesLeft[i].hasChildren &&
      rightIdx &&
      visibilityLeft[i] === 2 &&
      visibilityRight[rightIdx] === 2
    ) {
      lookup.push([i, tree2StrainToIdxMap[nodesLeft[i].strain]]);
    }
  }
  return lookup;
};
