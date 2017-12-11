import * as types from "../actions/types";

const datasets = (state = {
  s3bucket: "live",
  pathogen: undefined, // should rename
  splash: undefined,
  posts: undefined,
  datapath: undefined,
  page: "splash"
}, action) => {
  switch (action.type) {
    case types.PAGE_CHANGE: {
      return Object.assign({}, state, {
        page: action.page,
        pathname: action.pathname
      });
    }
    case types.MANIFEST_RECEIVED: {
      const newState = {
        s3bucket: action.s3bucket,
        splash: action.splash,
        pathogen: action.pathogen,
        user: action.user
      };
      return Object.assign({}, state, newState);
    } case types.POSTS_MANIFEST_RECEIVED: {
      return Object.assign({}, state, {posts: action.data});
    } default: {
      return state;
    }
  }
};

export default datasets;
