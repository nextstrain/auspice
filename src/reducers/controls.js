import * as types from "../actions/controls";
import * as globals from "../util/globals"
import getColorScale from "../util/getColorScale";


const Controls = (state = {
  dateRange: null,
  colorBy: globals.defaultColorBy,
  colorScale: getColorScale(globals.defaultColorBy),
  showBranchLabels: false,
  region: null,
  search: null,
  strain: null
}, action) => {
  switch (action.type) {
  case types.TOGGLE_BRANCH_LABELS:
    return Object.assign({}, state, {
      showBranchLabels: !state.showBranchLabels
    });
  default:
    return state;
  }
};

export default Controls;
