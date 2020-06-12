import * as types from "../actions/types";

/* the store to cache pre-loaded JSONS */

const jsonCache = (state = {
  jsons: {} /* object with dataset names as keys and loaded dataset / narrative jsons as values */
}, action) => {
  switch (action.type) {
    case types.CACHE_JSONS:
      /* Overwrite existing keys in state.jsons with values from
         action.jsons and add new keys, values from action.jsons to state.jsons */
      return {jsons: Object.assign(state.jsons, action.jsons)};
    case types.CLEAN_START:
      return {jsons: {}};
    default:
      return state;
  }
};

export default jsonCache;
