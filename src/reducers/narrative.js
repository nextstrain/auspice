import queryString from "query-string";
import * as types from "../actions/types";

const narrative = (state = {
  loaded: false,
  blocks: null, /* array of paragraphs (aka blocks) */
  blockIdx: undefined, /* which block is currently "in view" */
  pathname: undefined  /* the pathname of the _narrative_ */
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
          blocks: action.narrative,
          pathname: window.location.pathname,
          blockIdx: parseInt(queryString.parse(window.location.search).n, 10) || 1
        };
      }
      return state;
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      if (action.query.n) {
        return Object.assign({}, state, {blockIdx: action.query.n});
      }
      return state;
    case types.TOGGLE_NARRATIVE:
      if (state.loaded) {
        return Object.assign({}, state, {display: action.display});
      }
      console.warn("Attempted to toggle narrative that was not loaded");
      return state;
    default:
      return state;
  }
};

export default narrative;
