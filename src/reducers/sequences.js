import * as types from "../actions";

const Sequences = (state = {
  loading: false,
  sequences: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_SEQUENCES:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_SEQUENCES:
    return Object.assign({}, state, {
      loading: false,
      error: null,
      sequences: action.data
    });
  case types.SEQUENCES_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Sequences;
