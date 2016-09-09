import * as types from "../actions";
import { gatherTips } from "../util/treeHelpers";

const Tree = (state = {
  loading: false,
  tree: null,
  error: null,
  tips: null,
  root: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_TREE:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_TREE:
    let tips = [];
    gatherTips(action.data, tips)

    return Object.assign({}, state, {
      loading: false,
      error: null,
      tree: action.data,
      tips: tips,
      datasetGuid: Math.floor(Math.random() * 100000000000)
    });
  case types.TREE_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Tree;
