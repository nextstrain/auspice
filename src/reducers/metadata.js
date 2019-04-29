import { colorOptions } from "../util/globals";
import * as types from "../actions/types";

/* The metdata reducer holds data that is
 * (a) mostly derived from the dataset JSON
 * (b) rarely changes
 */

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
      const colorings = Object.assign({}, state.colorings, action.newColorings);
      return Object.assign({}, state, {colorings});
    default:
      return state;
  }
};

export default Metadata;
