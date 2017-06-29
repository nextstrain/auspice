import * as types from "../actions/types";

/* note regarding `loaded` - this starts off false.
On the first dataset load, it becomes true.
Subsequent loads arrive via a single action, so there is no period
of time when they are "loading" - i.e. when they are *not* ready */

const Sequences = (state = {
  loaded: false,
  sequences: null
}, action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    const glength = {};
    for (const gene in action.seqs.root) {
      glength[gene] = action.seqs.root[gene].length;
    }
    return Object.assign({}, state, {
      loaded: true,
      sequences: action.seqs,
      geneLength: glength
    });
  default:
    return state;
  }
};

export default Sequences;
