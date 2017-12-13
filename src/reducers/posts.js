import * as types from "../actions/types";

const posts = (state = {
  toc: undefined,
  name: undefined,
  html: undefined
}, action) => {
  switch (action.type) {
    case types.NEW_POST:
      return Object.assign({}, state, {
        name: action.name,
        html: action.html
      });
    case types.POSTS_MANIFEST_RECEIVED: {
      return Object.assign({}, state, {toc: action.data});
    }
    default:
      return state;
  }
};

export default posts;
