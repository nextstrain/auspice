import { NODE_VISIBLE } from "./globals";
import { isColorByGenotype } from "./getGenotype";
import { getTraitFromNode } from "../util/treeMiscHelpers";

export const unassigned_label = "unassigned";

/**
 * assign a given node to a category
 * Find the colorBy value of the node and, using the colorScale and the provided categories,
 * assign the correct category.
 * @return {string} category or the unassigned label
 */
const assignCategory = (colorScale, categories, node, colorBy, isGenotype) => {
  if (isGenotype) return node.currentGt;
  const value = getTraitFromNode(node, colorBy);
  if (!value || value === "unknown") {
    return unassigned_label;
  }
  if (!colorScale.continuous) return value;

  for (let i = 0; i < categories.length; i++) {
    /* roughly the same logic as the determineLegendMatch function */
    const category = categories[i];
    if (category === unassigned_label) {
      return unassigned_label;
    }
    const lowerBound = colorScale.legendBounds[category][0];
    const upperBound = colorScale.legendBounds[category][1];
    if (value <= upperBound && value > lowerBound) {
      return category;
    }
  }
  console.error("Could not assign", value, "to a category");
  return unassigned_label;
};

// Returns a boolean specifying if frequencies are allowed to be normalized
// Only normalize if minimum frequency is above 0.1%
export const checkIfNormalizableFromRawData = (data, pivots, nodes, visibility) => {
  const pivotsLen = pivots.length;
  const pivotTotals = new Array(pivotsLen).fill(0);
  data.forEach((d) => {
    if (visibility[d.idx] === NODE_VISIBLE) {
      for (let i = 0; i < pivotsLen; i++) {
        pivotTotals[i] += d.values[i];
      }
    }
  });
  // const minFrequency = Math.min(...pivotTotals);
  const allowNormalization = true;
  return allowNormalization;
};

export const computeMatrixFromRawData = (
  data,
  pivots,
  nodes,
  visibility,
  colorScale,
  colorBy,
  normalizeFrequencies
) => {
  /* color scale domain forms the categories in the stream graph */
  const categories = colorScale.legendValues.filter((d) => d !== undefined);
  categories.push(unassigned_label); /* for tips without a colorBy */
  const isGenotype = isColorByGenotype(colorBy);
  const matrix = {}; /* SHAPE: rows: categories (colorBys), columns: pivots */
  const pivotsLen = pivots.length;
  categories.forEach((x) => {
    matrix[x] = new Array(pivotsLen).fill(0);
  });
  // let debugTipsSeen = 0;
  const debugPivotTotals = new Array(pivotsLen).fill(0);
  data.forEach((d) => {
    if (visibility[d.idx] === NODE_VISIBLE) {
      // debugTipsSeen++;
      const category =
        assignCategory(colorScale, categories, nodes[d.idx], colorBy, isGenotype) ||
        unassigned_label;
      // if (category === unassigned_label) return;
      for (let i = 0; i < pivotsLen; i++) {
        matrix[category][i] += d.values[i];
        debugPivotTotals[i] += d.values[i];
        // if (i === pivotsLen - 1 && d.values[i] !== 0) {
        //   console.log("Pivot", frequencies.pivots[i], "strain", tree.nodes[d.idx].strain, "(clade #", tree.nodes[d.idx].strain, ") carried frequency of", d.values[i]);
        // }
      }
    }
  });

  if (normalizeFrequencies) {
    const minVal = 1e-7;
    Object.keys(matrix).forEach((cat) => {
      debugPivotTotals.forEach((norm, i) => {
        if (norm > minVal) {
          matrix[cat][i] /= norm;
        } else {
          matrix[cat][i] = 0.0;
        }
      });
    });
  }

  if (matrix[unassigned_label].reduce((a, b) => a + b, 0) === 0) {
    delete matrix[unassigned_label];
  }

  return matrix;
};

export const processFrequenciesJSON = (rawJSON, tree, controls) => {
  /* this function can throw */
  const pivots = rawJSON.pivots.map((d) => Math.round(parseFloat(d) * 100) / 100);
  let projection_pivot = null;
  if ("projection_pivot" in rawJSON) {
    projection_pivot = Math.round(parseFloat(rawJSON.projection_pivot) * 100) / 100;
  }
  if (!tree.loaded) {
    throw new Error("tree not loaded");
  }
  const data = [];
  tree.nodes
    .filter((d) => !d.hasChildren)
    .forEach((n) => {
      if (!rawJSON[n.name]) {
        console.warn(`No tip frequency information for ${n.name}`);
        return;
      }
      data.push({
        idx: n.arrayIdx,
        values: rawJSON[n.name].frequencies,
        weight: rawJSON[n.name].weight
      });
    });

  const normalizeFrequencies =
    controls.normalizeFrequencies &&
    checkIfNormalizableFromRawData(data, pivots, tree.nodes, tree.visibility);

  const matrix = computeMatrixFromRawData(
    data,
    pivots,
    tree.nodes,
    tree.visibility,
    controls.colorScale,
    controls.colorBy,
    normalizeFrequencies
  );
  return {
    data,
    pivots,
    matrix,
    projection_pivot,
    normalizeFrequencies
  };
};
