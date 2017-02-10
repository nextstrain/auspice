import * as types from "../actions/types";
import { colorOptions } from "../util/globals"

const Metadata = (state = {
  loading: false,
  metadata: null,
  error: null,
  colorOptions
}, action) => {
  switch (action.type) {
  case types.REQUEST_METADATA:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_METADATA:
    return Object.assign({}, state, {
      loading: false,
      error: null,
      metadata: action.data,
      colorOptions: action.data.color_options
    });
  case types.METADATA_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Metadata;
