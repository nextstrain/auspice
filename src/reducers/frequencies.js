import * as types from "../actions/types";

const Frequencies = (state = {
  loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
  frequencies: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_FREQUENCIES:
    return Object.assign({}, state, {
      loadStatus: 1,
      error: null
    });
  case types.RECEIVE_FREQUENCIES:
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      frequencies: action.data,
      pivots: action.data["pivots"]
    });
  case types.FREQUENCIES_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  default:
    return state;
  }
};

export default Frequencies;
