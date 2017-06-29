import * as types from "../actions/types";
import { colorOptions } from "../util/globals"

const Metadata = (state = {
  loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
  metadata: null,
  error: null,
  colorOptions
}, action) => {
  switch (action.type) {
  case types.REQUEST_METADATA:
    return Object.assign({}, state, {
      loadStatus: 1,
      error: null
    });
  case types.NEW_DATASET:
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      metadata: action.meta,
      colorOptions: action.meta.color_options
    });
  case types.METADATA_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  default:
    return state;
  }
};

export default Metadata;
