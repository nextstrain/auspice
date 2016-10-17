import * as types from "../actions";

const Entropy = (state = {
  loading: false,
  entropy: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_ENTROPY:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_ENTROPY:
    return Object.assign({}, state, {
      loading: false,
      error: null,
      entropy: action.data,
    });
  case types.ENTROPY_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Entropy;
