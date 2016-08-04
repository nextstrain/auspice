import * as types from "../actions/controls";
import * as globals from "../util/globals";
import getColorScale from "../util/getColorScale";
import createLegendMatchBound from "../util/createLegendMatchBounds";

const Controls = (state = {
  dateRange: null,
  colorBy: globals.defaultColorBy,
  colorScale: getColorScale(globals.defaultColorBy),
  /*
    we don't actually need to have legendBoundsMap default if regions will always be the
    default colorBy. this is saftey in case we change that.
  */
  legendBoundsMap: createLegendMatchBound(getColorScale(globals.defaultColorBy)),
  showBranchLabels: false,
  selectedLegendItem: null,
  selectedBranch: null,
  selectedNode: null,
  region: null,
  search: null,
  strain: null
}, action) => {
  switch (action.type) {
  case types.TOGGLE_BRANCH_LABELS:
    return Object.assign({}, state, {
      showBranchLabels: !state.showBranchLabels
    });
  case types.LEGEND_ITEM_MOUSEENTER:
    return Object.assign({}, state, {
      selectedLegendItem: action.data
    });
  case types.LEGEND_ITEM_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedLegendItem: null
    });
  case types.BRANCH_MOUSEENTER:
    return Object.assign({}, state, {
      selectedBranch: action.data
    });
  case types.BRANCH_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedBranch: null
    });
  case types.NODE_MOUSEENTER:
    console.log(action)
    return Object.assign({}, state, {
      selectedNode: action.data
    });
  case types.NODE_MOUSELEAVE:
    return Object.assign({}, state, {
      selectedNode: null
    });
  default:
    return state;
  }
};

export default Controls;
