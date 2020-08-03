import * as types from "../actions/types";

const narrative = (state = {
  loaded: false,
  blocks: null, /* array of paragraphs (aka blocks) */
  blockIdx: undefined, /* which block is currently "in view" */
  pathname: undefined,  /* the pathname of the _narrative_ */
  display: false,
  title: undefined
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false,
        display: false
      });
    case types.CLEAN_START:
      if (action.narrative) {
        const blocks = action.narrative;
        return {
          loaded: true,
          display: true,
          blocks,
          title: blocks[0].__html.match(/>(.+?)</)[1],
          pathname: window.location.pathname,
          blockIdx: action.query.n || 0
        };
      }
      return state;
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      if (action.query.hasOwnProperty("n")) { // eslint-disable-line
        return Object.assign({}, state, {blockIdx: action.query.n});
      }
      return state;
    case types.TOGGLE_NARRATIVE:
      if (state.loaded) {
        return Object.assign({}, state, {display: action.narrativeOn});
      }
      console.warn("Attempted to toggle narrative that was not loaded");
      return state;
    default:
      return state;
  }
};

export default narrative;
