import { rgb, hsl } from "d3-color";
import { interpolateRgb } from "d3-interpolate";
import scalePow from "d3-scale/src/pow";
import { isColorByGenotype, decodeColorByGenotype } from "./getGenotype";
import { getTraitFromNode } from "./treeMiscHelpers";
import { isValueValid } from "./globals";
import { calendarToNumeric } from "./dateHelpers";

/**
 * Average over the visible colours for a given location
 * @param {array} nodes list of nodes whose colours we want to average over
 * @param {array} nodeColours (redux state) -- list of node hexes. Not in 1-1 correspondence with `nodes`.
 * @returns {str} a color hex string representing the average of the array.
 */
export const getAverageColorFromNodes = (nodes, nodeColors) => {
  let r=0, g=0, b=0;
  nodes.forEach((n) => {
    const tmpRGB = rgb(nodeColors[n.arrayIdx]);
    r += tmpRGB.r;
    g += tmpRGB.g;
    b += tmpRGB.b;
  });
  const total = nodes.length;
  const avg = rgb(r/total, g/total, b/total);
  return avg.toString();
};

/**
* what colorBy trait names are present in the tree but _not_ in the provided scale?
* @param {Array} nodes - list of nodes
* @param {Array|undefined} nodesToo - list of nodes for the second tree
* @param {string} colorBy -
* @param {Array} providedVals - list of provided trait values
* @return {list}
*/
export const getExtraVals = (nodes, nodesToo, colorBy, providedVals) => {
  let valsInTree = nodes.map((n) => getTraitFromNode(n, colorBy));
  if (nodesToo) {
    nodesToo.forEach((n) => valsInTree.push(getTraitFromNode(n, colorBy)));
  }
  valsInTree = [...new Set(valsInTree)];
  return valsInTree
    .filter((x) => providedVals.indexOf(x) === -1)
    .filter((x) => isValueValid(x));
};


/* a getter for the value of the colour attribute of the node provided for the currently set colour
note this is not the colour HEX */
export const getTipColorAttribute = (node, colorScale) => {
  if (isColorByGenotype(colorScale.colorBy) && colorScale.genotype) {
    return node.currentGt;
  }
  return getTraitFromNode(node, colorScale.colorBy);
};

/* generates and returns an array of colours (HEXs) for the nodes under the given colorScale */
/* takes around 2ms on a 2000 tip tree */
export const calcNodeColor = (tree, colorScale) => {
  if (tree && tree.nodes && colorScale && colorScale.colorBy) {
    const nodeColorAttr = tree.nodes.map((n) => getTipColorAttribute(n, colorScale));
    // console.log(nodeColorAttr.map((n) => colorScale.scale(n)))
    return nodeColorAttr.map((n) => colorScale.scale(n));
  }
  return null;
};


// scale entropy such that higher entropy maps to a grayer less-certain branch
const branchInterpolateColour = "#BBB";
const branchOpacityConstant = 0.6;
const branchOpacityFunction = scalePow()
  .exponent([0.6])
  .domain([0, 2.0]) // entropy values close to 0 -> ~100% confidence, close to 2 -> very little confidence
  .range([0.4, 1])  // 0 -> return original node colour, 1 -> return branchInterpolateColour
  .clamp(true);
const tipOpacityFunction = branchOpacityFunction
  .copy()
  .range([0, 0.9]); // if entropy close to 0 return the original node color


// entropy calculation precomputed in augur
// export const calcEntropyOfValues = (vals) =>
//   vals.map((v) => v * Math.log(v + 1E-10)).reduce((a, b) => a + b, 0) * -1 / Math.log(vals.length);

/**
 * Calculate an array of stroke colors to render for a branch or tip node. These are "grey-er" versions
 * of the underlying `tree.nodeColours`. The degree of grey-ness is obtained via interpolation
 * between the node color and `branchOpacityConstant`. The interpolation parameter varies
 * depending on the confidence we have in the trait (the entropy), with more confidence resulting
 * in more saturated colours. For branches we always make them slightly greyer (even in the absence
 * of uncertainty) for purely aesthetic reasons.
 * @param {obj} tree phyloTree object
 * @param {bool} branch will this color be used for the branch or the tip?
 * @param {bool} confidence enabled?
 * @return {array} array of hex's. 1-1 with nodes.
 */
export const calculateStrokeColors = (tree, branch, confidence, colorBy) => {
  if (confidence === true) {
    return tree.nodeColors.map(branch ? _confidenceBranchColor : _confidenceTipColor)
  }
  return branch ? tree.nodeColors.map(_defaultBranchColor) : tree.nodeColors;

  function _confidenceBranchColor(col, idx) {
    const entropy = getTraitFromNode(tree.nodes[idx], colorBy, {entropy: true});
    if (!entropy) return _defaultBranchColor(col);
    return rgb(interpolateRgb(col, branchInterpolateColour)(branchOpacityFunction(entropy))).toString();
  }

  function _confidenceTipColor(col, idx) {
    if (tree.nodes[idx].hasChildren) return undefined; // skip computation for internal nodes
    const entropy = getTraitFromNode(tree.nodes[idx], colorBy, {entropy: true});
    if (!entropy) return col;
    return rgb(interpolateRgb(col, branchInterpolateColour)(tipOpacityFunction(entropy))).toString();
  }

  function _defaultBranchColor(col) {
    return rgb(interpolateRgb(col, branchInterpolateColour)(branchOpacityConstant)).toString()
  }
};


/**
 * Return an emphasized color
 */
export const getEmphasizedColor = (color) => {
  const hslColor = hsl(color);
  hslColor.s *= 1.8; // more saturation
  hslColor.l /= 1.2; // less luminance
  return rgb(hslColor).toString();
};

export const getBrighterColor = (color) => rgb(color).brighter([0.65]).toString();

/**
 * Return the display title for the selected colorBy
 * @param {obj} colorings an object of available colorings
 * @param {string} colorBy the select colorBy
 * @returns {string} the display title for the colorBY
 */
export const getColorByTitle = (colorings, colorBy) => {
  if (isColorByGenotype(colorBy)) {
    const genotype = decodeColorByGenotype(colorBy);
    return genotype.aa
      ? `Genotype at ${genotype.gene} site ${genotype.positions.join(", ")}`
      : `Nucleotide at position ${genotype.positions.join(", ")}`;
  }
  return colorings[colorBy] === undefined ?
    "" : colorings[colorBy].title;
};

/**
 * We allow values (on nodes) to be encoded as numeric dates (2021.123) or
 * YYYY-MM-DD strings. This helper function handles this flexibility and
 * translates any provided value to either a number or undefined.
 */
export function numDate(value) {
  switch (typeof value) {
    case "number":
      return value;
    case "string":
      return calendarToNumeric(value, true); // allow XX ambiguity
    default:
      return undefined;
  }
}