import * as types from "../actions/types";

const Sequences = (state = {
  loadStatus: 0, /* 0: no data, 2: data loaded */
  sequences: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    const glength = {};
    for (const gene in action.seqs.root) {
      glength[gene] = action.seqs.root[gene].length;
    }
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      sequences: action.seqs,
      geneLength: glength
    });
  default:
    return state;
  }
};

export default Sequences;
