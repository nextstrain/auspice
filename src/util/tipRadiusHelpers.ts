import { tipRadius, tipRadiusOnLegendMatch } from "./globals";
import { getTipColorAttribute, numDate } from "./colorHelpers";
import { getTraitFromNode } from "./treeMiscHelpers";
import { ColorScale } from "../reducers/controls";
import { ReduxNode, TreeState } from "../reducers/tree/types";

/**
* equates a single tip and a legend element
* exact match is required for categorical quantities such as genotypes, regions
* continuous variables need to fall into the interval (lower_bound, upper_bound]
* except for the first (smallest) legend value where we also match value=lower_bound
*/
export const determineLegendMatch = (
  /** e.g. "USA" or 2021 */
  selectedLegendItem: string | number,

  /** node (tip) in question */
  node: ReduxNode,

  /** used to get the value of the attribute being used for colouring */
  colorScale: ColorScale
): boolean => {
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
 */
const determineLocationMatch = (
  /** node (tip) in question */
  node: ReduxNode,

  /** Geographic resolution (e.g. "division", "country", "region") */
  geoResolution: string,

  /** Value to match (e.g. "New Zealand", "New York") */
  geoValueToMatch: string
): boolean => {
  return geoValueToMatch === getTraitFromNode(node, geoResolution);
};

/**
* produces the array of tip radii - if nothing's selected this is the hardcoded tipRadius
* if there's a selectedLegendItem, then values will be small (like normal) or big (for those tips selected)
* @returns null (if data not ready) or array of tip radii
*/
export const calcTipRadii = ({
  tipSelectedIdx = false,
  selectedLegendItem = false,
  geoFilter = [],
  colorScale,
  tree
}: {
  /** idx of a single tip to show with increased tipRadius */
  tipSelectedIdx?: number | false

  /** value of the selected tip attribute (numeric or string) */
  selectedLegendItem?: number | string | false

  geoFilter?: [string, string] | []

  colorScale: ColorScale

  tree: TreeState
}): number[] | null => {
  if (selectedLegendItem !== false && tree && tree.nodes) {
    return tree.nodes.map((d) => determineLegendMatch(selectedLegendItem, d, colorScale) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (geoFilter.length===2 && tree && tree.nodes) {
    return tree.nodes.map((d) => determineLocationMatch(d, geoFilter[0], geoFilter[1]) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (tipSelectedIdx) {
    const radii = tree.nodes.map(() => tipRadius);
    radii[tipSelectedIdx] = tipRadiusOnLegendMatch + 3;
    return radii;
  } else if (tree && tree.nodes) {
    return tree.nodes.map(() => tipRadius);
  }
  return null; // fallthrough
};
