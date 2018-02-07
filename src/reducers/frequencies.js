import * as types from "../actions/types";

const frequencies = (state = {
  loaded: false,
  data: undefined,
  pivots: undefined
}, action) => {
  switch (action.type) {
    case types.FREQUENCIES_JSON_DATA: {
      return {loaded: true, data: action.data, pivots: action.data.pivots};
    }
    case types.DATA_INVALID: {
      return {loaded: false, data: undefined, pivots: undefined};
    }
    default:
      return state;
  }
};

export default frequencies;
