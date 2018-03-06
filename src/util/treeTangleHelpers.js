
export const constructVisibleTipLookupBetweenTrees = (nodesLeft, nodesRight, visibility) => {
  console.log("constructVisibleTipLookupBetweenTrees");
  const rightStrainIndexMap = {};
  for (let i = 0; i < nodesRight.length; i++) {
    if (!nodesRight[i].hasChildren) {
      // if (nodesRight[i].strain!=="A/Fujian/5/2014") continue;
      rightStrainIndexMap[nodesRight[i].strain] = i;
    }
  }
  const lookup = []; // each entry is [idxInNodes, idxInNodesToo]
  for (let i = 0; i < nodesLeft.length; i++) {
    if (
      !nodesLeft[i].hasChildren &&
      rightStrainIndexMap[nodesLeft[i].strain] &&
      visibility[i] === "visible"
    ) {
      lookup.push([i, rightStrainIndexMap[nodesLeft[i].strain]]);
    }
  }
  return lookup;
};
