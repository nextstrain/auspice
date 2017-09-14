import { colorOptions } from "../util/globals";
import * as types from "../actions/types";

const Metadata = (state = {
  loaded: false, /* see comment in the sequences reducer for explination */
  metadata: null,
  colorOptions
}, action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    return Object.assign({}, state, {
      loaded: true,
      metadata: action.meta,
      colorOptions: action.meta.color_options
    });
  case types.ADD_COLOR_BYS:
    const newColorOptions = JSON.parse(JSON.stringify(state.colorOptions));
    for (const v of action.newColorBys) {
      newColorOptions[v] = {menuItem: v, legendTitle: v, key: v, type: "discrete"};
    }
    return Object.assign({}, state, {colorOptions: newColorOptions});
  default:
    return state;
  }
};

export default Metadata;
