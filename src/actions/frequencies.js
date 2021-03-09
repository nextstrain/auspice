import { debounce } from 'lodash';
import * as types from "./types";
import { timerStart, timerEnd } from "../util/perf";
import { computeMatrixFromRawData, checkIfNormalizableFromRawData, processFrequenciesJSON } from "../util/processFrequencies";

export const loadFrequencies = (json) => (dispatch, getState) => {
  const { tree, controls } = getState();
  const { data, pivots, matrix, projection_pivot, normalizeFrequencies } = processFrequenciesJSON(json, tree, controls);
  dispatch({
    type: types.LOAD_FREQUENCIES,
    frequencies: {loaded: true, version: 1, data, pivots, matrix, projection_pivot},
    normalizeFrequencies
  });
};

const updateFrequencyData = (dispatch, getState) => {
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

  const normalizeFrequencies = controls.normalizeFrequencies &&
    checkIfNormalizableFromRawData(frequencies.data, frequencies.pivots, tree.nodes, tree.visibility);

  const matrix = computeMatrixFromRawData(
    frequencies.data,
    frequencies.pivots,
    tree.nodes,
    tree.visibility,
    controls.colorScale,
    controls.colorBy,
    normalizeFrequencies
  );
  timerEnd("updateFrequencyData");
  dispatch({type: types.FREQUENCY_MATRIX, matrix, normalizeFrequencies});
};

/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateFrequencyDataDebounced = debounce(
  updateFrequencyData, 500, { leading: false, trailing: true }
);
