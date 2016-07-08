import * as types from "../actions/controls";

const Controls = (state = {
  dateRange: null,
  colorBy: null,
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
