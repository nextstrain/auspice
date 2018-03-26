import * as types from "../actions/types";

const narrative = (state = {
  loaded: false, /* see comment in the sequences reducer for explination */
  blocks: null
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false,
        display: false
      });
    case types.CLEAN_START:
      if (action.narrative) {
        return {
          loaded: true,
          display: true,
          blocks: action.narrative
        };
      }
      return state;
    case types.TOGGLE_NARRATIVE:
      if (state.loaded) {
        return Object.assign({}, state, {display: !state.display});
      }
      console.warn("Attempted to toggle narrative that was not loaded");
      return state;
    default:
      return state;
  }
};

export default narrative;
