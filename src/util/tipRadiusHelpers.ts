import { tipRadius, tipRadiusOnLegendMatch } from "./globals";
import { getTipColorAttribute, numDate } from "./colorHelpers";
import { getTraitFromNode } from "./treeMiscHelpers";

/**
* equates a single tip and a legend element
* exact match is required for categorical quantities such as genotypes, regions
* continuous variables need to fall into the interval (lower_bound, upper_bound]
* except for the first (smallest) legend value where we also match value=lower_bound
* @param {string|number} selectedLegendItem e.g. "USA" or 2021
* @param {object} node - node (tip) in question
* @param {object} colorScale - used to get the value of the attribute being used for colouring
* @returns bool
*/
export const determineLegendMatch = (selectedLegendItem: (string|number), node:any, colorScale:any) => {
  let nodeAttr = getTipColorAttribute(node, colorScale);
  if (colorScale.scaleType === 'temporal') {
    nodeAttr = numDate(nodeAttr);
  }
  if (colorScale.continuous) {
    if (selectedLegendItem === colorScale.legendValues[0] && nodeAttr===colorScale.legendBounds[selectedLegendItem][0]) {
      return true;
    }
    return (nodeAttr <= colorScale.legendBounds[selectedLegendItem][1]) &&
           (nodeAttr > colorScale.legendBounds[selectedLegendItem][0]);
  }
  return nodeAttr === selectedLegendItem;
};

/**
 * Does the `node`s trait for the given `geoResolution` match the `geoValueToMatch`?
 * @param {object} node - node (tip) in question
 * @param {string} geoResolution - Geographic resolution (e.g. "division", "country", "region")
 * @param {string} geoValueToMatch - Value to match (e.g. "New Zealand", "New York")
 * @returns bool
 */
const determineLocationMatch = (node:any, geoResolution:string, geoValueToMatch:string) => {
  return geoValueToMatch === getTraitFromNode(node, geoResolution);
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
export const calcTipRadii = (
  {tipSelectedIdx = false, selectedLegendItem = false, geoFilter = [], searchNodes = false, colorScale, tree}:
  {tipSelectedIdx:(number|false), selectedLegendItem:(number|string|false), geoFilter:([string, string]|[]), searchNodes:any, colorScale:any, tree:any}
) => {
  if (selectedLegendItem !== false && tree && tree.nodes) {
    return tree.nodes.map((d:any) => determineLegendMatch(selectedLegendItem, d, colorScale) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (geoFilter.length===2 && tree && tree.nodes) {
    return tree.nodes.map((d:any) => determineLocationMatch(d, geoFilter[0], geoFilter[1]) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (searchNodes) {
    return tree.nodes.map((d:any) => d.name.toLowerCase().includes(searchNodes) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (tipSelectedIdx) {
    const radii = tree.nodes.map(() => tipRadius);
    radii[tipSelectedIdx] = tipRadiusOnLegendMatch + 3;
    return radii;
  } else if (tree && tree.nodes) {
    return tree.nodes.map(() => tipRadius);
  }
  return null; // fallthrough
};
