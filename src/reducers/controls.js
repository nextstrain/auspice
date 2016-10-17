import * as types from "../actions/controls";
import * as globals from "../util/globals";

const Controls = (state = {
  dateRange: null,
  /*
    we don't actually need to have legendBoundsMap default if regions will always be the
    default colorBy. this is saftey in case we change that.
    continuous in state is to be true whenever the color scale is continuous
    as opposed to discrete/categorical. we need a legendBoundsMap in the former, not the latter
  */
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
