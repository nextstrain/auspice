import * as types from "../actions/types";

const datasets = (state = {
  s3bucket: "live",
  pathogen: undefined,
  splash: undefined,
  posts: undefined,
  ready: false
}, action) => {
  switch (action.type) {
    case types.MANIFEST_RECEIVED: {
      return Object.assign({}, state, {
        s3bucket: action.s3bucket,
        splash: action.splash,
        pathogen: action.pathogen,
        user: action.user,
        ready: true
      });
    } case types.POSTS_MANIFEST_RECEIVED: {
      return Object.assign({}, state, {posts: action.data});
    } default: {
      return state;
    }
  }
};

export default datasets;
