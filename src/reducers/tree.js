import * as types from "../actions";

const Tree = (state = {
  loading: false,
  tree: null,
  error: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_TREE:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_TREE:
    return Object.assign({}, state, {
      loading: false,
      error: null,
      tree: action.data
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
