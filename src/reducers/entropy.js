// import _filter from "lodash/filter";
import * as types from "../actions/types";

export const defaultEntropyState = () => {
  const startingState = {
    loaded: false,
    showCounts: false,
  }
  return {...startingState};
}

const Entropy = (state = defaultEntropyState(), action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return {loaded: false, showCounts: false};
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      return action.entropy;
    case types.ENTROPY_DATA:
      return Object.assign({}, state, {
        loaded: true,
        bars: action.data,
        maxYVal: action.maxYVal
      });
    case types.TOGGLE_PANEL_DISPLAY:
      if (action.entropyData) {
        return {...state, bars: action.entropyData, maxYVal: action.entropyMaxYVal}
      }
      return state;
    case types.ENTROPY_ONSCREEN_CHANGE:
      if (action.entropyData) {
        return {...state, onScreen: action.onScreen, bars: action.entropyData, maxYVal: action.entropyMaxYVal}
      }
      return {...state, onScreen: action.onScreen};
    case types.ENTROPY_COUNTS_TOGGLE:
      return Object.assign({}, state, {
        showCounts: action.showCounts
      });
    case types.CHANGE_ENTROPY_CDS_SELECTION:
      return {...state, ...action};
    default:
      return state;
  }
};

export default Entropy;
