import * as types from "../actions/types";
import { getPageFromPathname } from "../actions/navigation";

const datasets = (state = {
  s3bucket: "live",
  pathogen: undefined, // should rename
  splash: undefined,
  datapath: undefined,
  page: getPageFromPathname(window.location.pathname)
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
    } default: {
      return state;
    }
  }
};

export default datasets;
