import * as types from "../actions/types";

const Sequences = (state = {
  loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
  sequences: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_SEQUENCES:
    return Object.assign({}, state, {
      loadStatus: 1,
      error: null
    });
  case types.RECEIVE_SEQUENCES:
    const glength = {};
    for (let gene in action.data.root) {
      glength[gene] = action.data.root[gene].length;
    }
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      sequences: action.data,
      geneLength: glength
    });
  case types.SEQUENCES_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  default:
    return state;
  }
};

export default Sequences;
