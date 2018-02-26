import { debounce } from 'lodash';
import * as types from "./types";
import { timerStart, timerEnd } from "../util/perf";

export const unassigned_label = "unassigned";

const assignCategory = (colorScale, categories, node, colorBy, isGenotype) => {
  if (isGenotype) return node.currentGt;
  const value = node.attr[colorBy];
  if (!value || value === "unknown") {
    return unassigned_label;
  }
  if (!colorScale.continuous) return value;

  for (let i = 0; i < categories.length; i++) {
    /* same logic as the determineLegendMatch function */
    const lowerBound = colorScale.legendBoundsMap.lower_bound[categories[i]];
    const upperBound = colorScale.legendBoundsMap.upper_bound[categories[i]];
    if (value <= upperBound && value > lowerBound) {
      return categories[i];
    }
  }
  console.error("Could not assign", value, "to a category");
  return unassigned_label;
};

export const computeMatrixFromRawData = (data, normaliseData, pivots, nodes, visibility, colorScale, colorBy) => {
  /* color scale domain forms the categories in the stream graph */
  const categories = colorScale.scale.domain().filter((d) => d !== undefined);
  categories.push(unassigned_label); /* for tips without a colorBy */
  const isGenotype = colorBy.slice(0, 3) === "gt-";
  const matrix = {}; /* SHAPE: rows: categories (colorBys), columns: pivots */
  const pivotsLen = pivots.length;
  categories.forEach((x) => {matrix[x] = new Array(pivotsLen).fill(0);});
  let categoriesLen = categories.length;

  // let debugTipsSeen = 0;
  const debugPivotTotals = new Array(pivotsLen).fill(0);
  data.forEach((d) => {
    if (visibility[d.idx] === "visible") {
      // debugTipsSeen++;
      // const colour = tree.nodes[d.idx].attr[colorBy];
      const category = assignCategory(colorScale, categories, nodes[d.idx], colorBy, isGenotype) || unassigned_label;
      // if (category === unassigned_label) return;
      for (let i = 0; i < pivotsLen; i++) {
        if (d.values[i] < 0.0002) {continue;} /* skip 0.0001 values */
        matrix[category][i] += d.values[i];
        debugPivotTotals[i] += d.values[i];
        // if (i === pivotsLen - 1 && d.values[i] !== 0) {
        //   console.log("Pivot", frequencies.pivots[i], "strain", tree.nodes[d.idx].strain, "(clade #", tree.nodes[d.idx].clade, ") carried frequency of", d.values[i]);
        // }
      }
    }
  });

  if (matrix[unassigned_label].reduce((a, b) => a + b, 0) === 0) {
    delete matrix[unassigned_label];
    categoriesLen--;
  }

  const magicThreshold = 0.1; /* totals above this are normalised. Below this are nuked. */

  if (normaliseData) {
    /* NORMALISE COLUMNS - i.e. each pivot point sums to 1 */
    for (let i = 0; i < pivotsLen; i++) {
      let columnTotal = 0;
      for (let j = 0; j < categoriesLen; j++) {
        columnTotal += matrix[categories[j]][i];
      }
      for (let j = 0; j < categoriesLen; j++) {
        if (columnTotal > magicThreshold) {
          matrix[categories[j]][i] /= columnTotal;
        } else {
          matrix[categories[j]][i] = 0;
        }
      }
    }
  }
  return matrix;
};

export const updateFrequencyData = (dispatch, getState) => {
  timerStart("updateFrequencyData");
  const { frequencies, tree, controls } = getState();
  if (!controls.colorScale) {
    console.error("Race condition in updateFrequencyData. ColourScale not Set. Frequency Matrix can't be calculated.");
    return;
  }
  if (!frequencies.data) {
    console.error("Race condition in updateFrequencyData. Frequencies data not in state. Matrix can't be calculated.");
    return;
  }
  const matrix = computeMatrixFromRawData(
    frequencies.data,
    frequencies.normaliseData,
    frequencies.pivots,
    tree.nodes,
    tree.visibility,
    controls.colorScale,
    controls.colorBy
  );
  // console.log("Saw ", debugTipsSeen, " tips (visible) producing pre-normalisation pivots totals of", debugPivotTotals);
  timerEnd("updateFrequencyData");
  dispatch({type: types.FREQUENCY_MATRIX, matrix});
};

/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateFrequencyDataDebounced = debounce(
  updateFrequencyData, 500, { leading: false, trailing: true }
);

export const toggleNormalization = (dispatch, getState) => {
  dispatch({type: types.TOGGLE_FREQUENCY_NORMALIZATION});
  updateFrequencyData(dispatch, getState);
};

export const processFrequenciesJSON = (rawJSON, tree, controls) => {
  /* this function can throw */
  const normaliseData = false;
  const pivots = rawJSON.pivots.map((d) => Math.round(parseFloat(d) * 100) / 100);
  const ticks = [pivots[0]];
  const tick_step = (pivots[pivots.length - 1] - pivots[0]) / 6 * 10 / 10;
  while (ticks[ticks.length - 1] < pivots[pivots.length - 1]) {
    ticks.push((ticks[ticks.length - 1] + tick_step) * 10 / 10);
  }
  if (!tree.loaded) {
    throw new Error("tree not loaded");
  }
  const data = [];
  tree.nodes.filter((d) => !d.hasChildren).forEach((n) => {
    if (!rawJSON[n.strain]) {
      console.warn(`No tip frequency information for ${n.strain}`);
      return;
    }
    data.push({
      idx: n.arrayIdx,
      values: rawJSON[n.strain].frequencies,
      weight: rawJSON[n.strain].weight
    });
  });
  const matrix = computeMatrixFromRawData(
    data,
    normaliseData,
    pivots,
    tree.nodes,
    tree.visibility,
    controls.colorScale,
    controls.colorBy
  );
  return {
    data,
    pivots,
    ticks,
    matrix,
    normaliseData
  };
};
