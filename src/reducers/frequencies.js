import * as types from "../actions/types";

const frequencies = (state = {
  loaded: false,
  data: undefined,
  pivots: undefined,
  ticks: undefined
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
      console.log(pivots)
      console.log(ticks)
      return {loaded: true, data: action.data, pivots, ticks};
    }
    case types.DATA_INVALID: {
      return {loaded: false, data: undefined, pivots: undefined, ticks: undefined};
    }
    default:
      return state;
  }
};

export default frequencies;
