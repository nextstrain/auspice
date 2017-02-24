import * as types from "../actions/types";

const Entropy = (state = {
  loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
  entropy: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_ENTROPY:
    return Object.assign({}, state, {
      loadStatus: 1,
      error: null
    });
  case types.RECEIVE_ENTROPY:
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      entropy: action.data,
    });
  case types.ENTROPY_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  default:
    return state;
  }
};

export default Entropy;
