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
    case types.INITIALISE_FREQUENCIES: {
      return {loaded: true, data: action.data, pivots: action.pivots, ticks: action.ticks, matrix: action.matrix, version: 1, normaliseData: action.normaliseData};
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
