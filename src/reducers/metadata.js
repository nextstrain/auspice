import * as types from "../actions/types";
import { colorOptions } from "../util/globals"

const Metadata = (state = {
  loadStatus: 0, /* 0: no data, 2: data loaded */
  metadata: null,
  error: null,
  colorOptions
}, action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      metadata: action.meta,
      colorOptions: action.meta.color_options
    });
  default:
    return state;
  }
};

export default Metadata;
