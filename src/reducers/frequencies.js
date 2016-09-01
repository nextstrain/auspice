import * as types from "../actions";

const Frequencies = (state = {
  loading: false,
  frequencies: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_FREQUENCIES:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_FREQUENCIES:
    return Object.assign({}, state, {
      loading: false,
      error: null,
      frequencies: action.data,
      pivots: action.data["pivots"]
    });
  case types.FREQUENCIES_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Frequencies;
