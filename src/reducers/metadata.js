import { colorOptions } from "../util/globals";
import * as types from "../actions/types";

const Metadata = (state = {
  loaded: false, /* see comment in the sequences reducer for explination */
  metadata: null,
  colorOptions // this can't be removed as the colorScale currently runs before it should
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.CLEAN_START:
      return action.metadata;
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
