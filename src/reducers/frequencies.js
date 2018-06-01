import * as types from "../actions/types";

/* TODO: initial data should simply be {loaded: false} */
const frequencies = (state = {
  loaded: false,
  data: undefined,
  pivots: undefined,
  ticks: undefined,
  matrix: undefined,
  version: 0
}, action) => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: // fallthrough
    case types.CLEAN_START:
      if (action.frequencies) return action.frequencies;
      return state;
    case types.FREQUENCY_MATRIX: {
      return Object.assign({}, state, {loaded: true, matrix: action.matrix, version: state.version + 1});
    }
    case types.DATA_INVALID: {
      return {loaded: false, data: undefined, pivots: undefined, ticks: undefined, matrix: undefined, version: 0};
    }
    default:
      return state;
  }
};

export default frequencies;
