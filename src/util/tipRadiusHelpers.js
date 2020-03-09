import { tipRadius, tipRadiusOnLegendMatch } from "./globals";
import { getTipColorAttribute } from "./colorHelpers";

/**
* equates a single tip and a legend element
* exact match is required for categorical qunantities such as genotypes, regions
* continuous variables need to fall into the interal (lower_bound[leg], leg]
* @param selectedLegendItem - value of the selected tip attribute (numeric or string)
* @param node - node (tip) in question
* @param legendBoundsMap - if falsey, then exact match required. Else contains bounds for match.
* @param colorScale - used to get the value of the attribute being used for colouring
* @returns bool
*/
const determineLegendMatch = (selectedLegendItem, node, colorScale) => {
  const nodeAttr = getTipColorAttribute(node, colorScale);
  if (colorScale.continuous) {
    return (nodeAttr <= colorScale.legendBounds[selectedLegendItem][1]) &&
           (nodeAttr >= colorScale.legendBounds[selectedLegendItem][0]);
  }
  return nodeAttr === selectedLegendItem;
};

/**
* produces the array of tip radii - if nothing's selected this is the hardcoded tipRadius
* if there's a selectedLegendItem, then values will be small (like normal) or big (for those tips selected)
* @param selectedLegendItem - value of the selected tip attribute (numeric or string) OPTIONAL
* @param tipSelectedIdx - idx of a single tip to show with increased tipRadius OPTIONAL
* @param colorScale - node (tip) in question
* @param tree
* @returns null (if data not ready) or array of tip radii
*/
export const calcTipRadii = ({tipSelectedIdx = false, selectedLegendItem = false, searchNodes = false, colorScale, tree}) => {
  if (selectedLegendItem !== false && tree && tree.nodes) {
    return tree.nodes.map((d) => determineLegendMatch(selectedLegendItem, d, colorScale) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (searchNodes) {
    return tree.nodes.map((d) => d.name.toLowerCase().includes(searchNodes) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (tipSelectedIdx) {
    const radii = tree.nodes.map(() => tipRadius);
    radii[tipSelectedIdx] = tipRadiusOnLegendMatch + 3;
    return radii;
  } else if (tree && tree.nodes) {
    return tree.nodes.map(() => tipRadius);
  }
  return null; // fallthrough
};
