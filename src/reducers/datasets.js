import * as types from "../actions/types";

const datasets = (state = {
  pathogen: undefined,
  splash: undefined,
  posts: undefined,
  ready: false
}, action) => {
  switch (action.type) {
    case types.MANIFEST_RECEIVED: {
      return {
        splash: action.splash,
        pathogen: action.pathogen,
        user: action.user,
        posts: action.posts,
        ready: true
      };
    } default: {
      return state;
    }
  }
};

export default datasets;
