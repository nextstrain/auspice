import * as types from "../actions/types";

export const getDefaultFrequenciesState = () => ({
  loaded: false,
  data: undefined,
  pivots: undefined,
  matrix: undefined,
  projection_pivot: undefined,
  version: 0
});

/* TODO: initial data should simply be {loaded: false} */
const frequencies = (state = getDefaultFrequenciesState(), action) => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: // fallthrough
    case types.LOAD_FREQUENCIES:
      return action.frequencies ? action.frequencies : state;
    case types.FREQUENCY_MATRIX: {
      return Object.assign({}, state, {loaded: true, matrix: action.matrix, version: state.version + 1});
    }
    case types.DATA_INVALID: {
      return getDefaultFrequenciesState();
    }
    default:
      return state;
  }
};

export default frequencies;
