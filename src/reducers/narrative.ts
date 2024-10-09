import * as types from "../actions/types";
import { AnyAction } from 'redux';

export interface NarrativeState {
  loaded: boolean
  /**
   * array of paragraphs (aka blocks)
   */
  blocks: { __html: string }[] | null

  /**
   * which block is currently "in view"
   */
  blockIdx?: number

  /**
   * the pathname of the _narrative_
   */
  pathname?: string

  display: boolean
  title?: string
}

const defaultState: NarrativeState = {
  loaded: false,
  blocks: null,
  blockIdx: undefined,
  pathname: undefined,
  display: false,
  title: undefined
};

const narrative = (
  state: NarrativeState = defaultState,
  action: AnyAction,
): NarrativeState => {
  switch (action.type) {
    case types.DATA_INVALID:
      return {
        ...state,
        loaded: false,
        display: false,
      };
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
      if (Object.prototype.hasOwnProperty.call(action.query, "n")) {
        return {
          ...state,
          blockIdx: action.query.n,
        };
      }
      return state;
    case types.TOGGLE_NARRATIVE:
      if (state.loaded) {
        return {
          ...state,
          display: action.narrativeOn,
        };
      }
      console.warn("Attempted to toggle narrative that was not loaded");
      return state;
    default:
      return state;
  }
};

export default narrative;
