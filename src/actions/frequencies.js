import { debounce } from 'lodash';
import * as types from "./types";
import { timerStart, timerEnd } from "../util/perf";

/* maybe this could be middleware?!?!?
export const debouncedComputationallyIntensiveMiddleware = (store) => (next) => (action) => {
  const result = next(action); // send action to other middleware / reducers immediately
  if (action demands that frequency recompute) {
    if (frequency recalculation timeout waiting to run) {
      clearInterval()
    }
    setTimeout(() => {
      // calculate computationally intensive stuff.
      // can access store (will represent updated state)
      next(action with new frequencies data)
    }, 500)
  }
}
*/

/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateFrequencyData = debounce((dispatch, getState) => {
  timerStart("updateFrequencyData");
  const { frequencies, tree, controls } = getState();
  if (!controls.colorScale) {
    console.error("Race condition. ColourScale not Set. Frequency Matrix can't be calculated.");
    return;
  }
  if (!frequencies.data) {
    console.error("Race condition. Frequencies data not in state. Matrix can't be calculated.");
    return;
  }
  if (controls.colorScale.continuous) {
    console.error("TODO: frequencies for continuous color scale.");
    return;
  }
  console.log("updateFrequencyData", controls.colorBy)
  /* color scale domain forms the categories in the stream graph */
  const categories = controls.colorScale.scale.domain().filter((d) => d !== undefined);
  const colorBy = controls.colorBy;
  const matrix = {};
  const pivotsLen = frequencies.pivots.length;
  categories.forEach((x) => {matrix[x] = new Array(pivotsLen).fill(0);});
  const categoriesLen = categories.length;

  let debugTipsSeen = 0;
  const debugPivotTotals = new Array(pivotsLen).fill(0);
  frequencies.data.forEach((d) => {
    /* check the visibility of the node using tree.visibility[d.idx] */
    if (tree.visibility[d.idx] === "visible") {
      debugTipsSeen++;
      const colour = tree.nodes[d.idx].attr[colorBy];
      for (let i = 0; i < pivotsLen; i++) {
        if (d.values[i] < 0.0002) {continue;} /* skip 0.0001 values */
        matrix[colour][i] += d.values[i];
        debugPivotTotals[i] += d.values[i];
        // if (i === pivotsLen - 1 && d.values[i] !== 0) {
        //   console.log("at final pivot some data (", d.values[i],") being added by", tree.nodes[d.idx].strain, tree.nodes[d.idx].clade)
        // }
      }
    }
  });
  console.log("Saw ", debugTipsSeen, " tips (visible) producing pre-normalisation pivots totals of", debugPivotTotals);
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

  // console.log("categories:", categories);
  // console.log(matrix);

  timerEnd("updateFrequencyData");
  console.log("dispatching FREQUENCY_MATRIX")
  dispatch({type: types.FREQUENCY_MATRIX, matrix});
}, 1000, { leading: false, trailing: true });
