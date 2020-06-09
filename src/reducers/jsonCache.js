import * as types from "../actions/types";

/* the store to cache pre-loaded JSONS */

const jsonCache = (state = {
  jsons: null
}, action) => {
  switch (action.type) {
    // TODO add in a case where we clear the cache? E.g. when changing narratives or pages
    case types.CACHE_JSONS:
      return {jsons: action.jsons};
    case types.CLEAR_JSON_CACHE:
      return {jsons: null};
    default:
      return state;
  }
};

export default jsonCache;
