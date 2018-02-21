import * as types from "../actions/types";

const frequencies = (state = {
  loaded: false,
  data: undefined,
  pivots: undefined,
  ticks: undefined,
  matrix: undefined,
  normaliseData: false,
  version: 0
}, action) => {
  switch (action.type) {
    case types.FREQUENCIES_JSON_DATA: {
      /* these calculations maybe shouldn't be in the reducer */
      const pivots = action.data.pivots.map((d) => Math.round(parseFloat(d) * 100) / 100);
      // const ticks = [Math.round(pivots[0])];
      const ticks = [pivots[0]];
      const tick_step = (pivots[pivots.length - 1] - pivots[0]) / 6 * 10 / 10;
      while (ticks[ticks.length - 1] < pivots[pivots.length - 1]) {
        ticks.push((ticks[ticks.length - 1] + tick_step) * 10 / 10);
      }
      if (!action.tree.loaded) {console.error("cannot calculate frequencies (tree not loaded)");}
      const data = [];
      action.tree.nodes.filter((d) => !d.hasChildren).forEach((n) => {
        if (!action.data[n.strain]) {
          console.warn("No tip frequency information for", n.strain);
          return;
        }
        data.push({
          idx: n.arrayIdx,
          values: action.data[n.strain].frequencies,
          weight: action.data[n.strain].weight
        });
      });
      return {loaded: false, data, pivots, ticks, matrix: undefined, version: 0};
    }
    case types.TOGGLE_FREQUENCY_NORMALIZATION: {
      return Object.assign({}, state, {normaliseData: !state.normaliseData});
    }
    case types.FREQUENCY_MATRIX: {
      return Object.assign({}, state, {loaded: true, matrix: action.matrix, version: state.version + 1});
    }
    case types.DATA_INVALID: {
      return {loaded: false, data: undefined, pivots: undefined, ticks: undefined, matrix: undefined, version: 0, normaliseData: false};
    }
    default:
      return state;
  }
};

export default frequencies;
