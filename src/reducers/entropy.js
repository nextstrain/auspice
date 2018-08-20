// import _filter from "lodash/filter";
import * as types from "../actions/types";

const Entropy = (state = {loaded: false, showCounts: false}, action) => {
  switch (action.type) {
    case types.CHANGE_ZOOM:
      return Object.assign({}, state, {
        zoomMax: action.zoomc[1],
        zoomMin: action.zoomc[0]
      });
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
    case types.ENTROPY_COUNTS_TOGGLE:
      return Object.assign({}, state, {
        showCounts: action.showCounts
      });
    default:
      return state;
  }
};

export default Entropy;
