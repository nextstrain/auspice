import { debounce } from 'lodash';
import * as types from "./types";
import { timerStart, timerEnd } from "../util/perf";

const assignCategory = (colorScale, categories, node, colorBy, isGenotype) => {
  if (isGenotype) return node.currentGt;

  const value = node.attr[colorBy];
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
  return undefined;
};

export const updateFrequencyData = (dispatch, getState) => {
  timerStart("updateFrequencyData");
  console.time("updateFrequencyData");
  const { frequencies, tree, controls } = getState();
  if (!controls.colorScale) {
    console.error("Race condition. ColourScale not Set. Frequency Matrix can't be calculated.");
    return;
  }
  if (!frequencies.data) {
    console.error("Race condition. Frequencies data not in state. Matrix can't be calculated.");
    return;
  }
  /* color scale domain forms the categories in the stream graph */
  const categories = controls.colorScale.scale.domain().filter((d) => d !== undefined);
  categories.push("N/A"); /* for tips without a colorBy */
  const colorBy = controls.colorBy;
  const isGenotype = colorBy.slice(0, 3) === "gt-";
  const matrix = {}; /* SHAPE: rows: categories (colorBys), columns: pivots */
  const pivotsLen = frequencies.pivots.length;
  categories.forEach((x) => {matrix[x] = new Array(pivotsLen).fill(0);});
  const categoriesLen = categories.length;

  // let debugTipsSeen = 0;
  const debugPivotTotals = new Array(pivotsLen).fill(0);
  frequencies.data.forEach((d) => {
    if (tree.visibility[d.idx] === "visible") {
      // debugTipsSeen++;
      // const colour = tree.nodes[d.idx].attr[colorBy];
      const category = assignCategory(controls.colorScale, categories, tree.nodes[d.idx], colorBy, isGenotype) || "N/A";
      // if (category === "N/A") return;
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

  if (matrix["N/A"].reduce((a, b) => a + b, 0) === 0) {
    delete matrix["N/A"];
  }

  if (frequencies.normaliseData) {
    /* NORMALISE COLUMNS - i.e. each pivot point sums to 1 */
    for (let i = 0; i < pivotsLen; i++) {
      let columnTotal = 0;
      for (let j = 0; j < categoriesLen; j++) {
        columnTotal += matrix[categories[j]][i];
      }
      for (let j = 0; j < categoriesLen; j++) {
        if (columnTotal !== 0) {
          matrix[categories[j]][i] /= columnTotal;
        }
      }
    }
  }

  // console.log("Saw ", debugTipsSeen, " tips (visible) producing pre-normalisation pivots totals of", debugPivotTotals);
  console.timeEnd("updateFrequencyData");
  timerEnd("updateFrequencyData");
  dispatch({type: types.FREQUENCY_MATRIX, matrix});
};

/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateFrequencyDataDebounced = debounce(updateFrequencyData, 500, { leading: false, trailing: true });

export const toggleNormalization = (dispatch, getState) => {
  dispatch({type: types.TOGGLE_FREQUENCY_NORMALIZATION});
  updateFrequencyData(dispatch, getState);
};
