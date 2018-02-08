import * as types from "../actions/types";

const frequencies = (state = {
  loaded: false,
  data: undefined,
  pivots: undefined,
  ticks: undefined,
  matrix: undefined
}, action) => {
  switch (action.type) {
    case types.FREQUENCIES_JSON_DATA: {
      /* these calculations maybe shouldn't be in the reducer */
      const pivots = action.data.pivots.map((d) => Math.round(parseFloat(d) * 100) / 100);
      const ticks = [Math.round(pivots[0])];
      const tick_step = Math.round((pivots[pivots.length - 1] - pivots[0]) / 6 * 10) / 10;
      while (ticks[ticks.length - 1] < pivots[pivots.length - 1]) {
        ticks.push(Math.round((ticks[ticks.length - 1] + tick_step) * 10) / 10);
      }
      if (!action.tree.loaded) {console.error("Tree not loaded. Can't do freqs!");}

      const data = [];
      action.tree.nodes.forEach((n) => {
        if (!n.hasChildren) {
          if (action.data[n.clade]) {
            data.push({
              idx: n.arrayIdx,
              values: action.data[n.clade]
            });
          } else {
            console.warn("Tip ", n.strain, "(clade ", n.clade, ") had no frequencies data");
          }
        }
      });
      return {loaded: true, data, pivots, ticks, matrix: undefined};
    }
    case types.FREQUENCY_MATRIX: {
      return Object.assign({}, state, {matrix: action.matrix});
    }
    case types.DATA_INVALID: {
      return {loaded: false, data: undefined, pivots: undefined, ticks: undefined, matrix: undefined};
    }
    default:
      return state;
  }
};

export default frequencies;
