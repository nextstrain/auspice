import * as types from "../actions/types";

const datasets = (state = {
  pathogen: undefined,
  splash: undefined,
  ready: false
}, action) => {
  switch (action.type) {
    case types.CHARON_INIT: {
      return {
        splash: action.splash,
        pathogen: action.pathogen,
        user: action.user,
        ready: true
      };
    } default: {
      return state;
    }
  }
};

export default datasets;
