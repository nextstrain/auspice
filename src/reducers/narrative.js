import * as types from "../actions/types";

const narrative = (state = {
  loaded: false, /* see comment in the sequences reducer for explination */
  blocks: null
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.NEW_NARRATIVE:
      return {
        loaded: true,
        blocks: action.blocks
      };
    default:
      return state;
  }
};

export default narrative;
