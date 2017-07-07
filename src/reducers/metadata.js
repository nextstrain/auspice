import * as types from "../actions/types";
import { colorOptions } from "../util/globals"

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
  default:
    return state;
  }
};

export default Metadata;
