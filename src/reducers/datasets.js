import * as types from "../actions/types";
import { getPageFromPathname } from "../actions/navigation";

const datasets = (state = {
  s3bucket: "live",
  availableDatasets: undefined,
  splash: undefined,
  datapath: undefined, // e.g. "zika" or "flu_h3n2_12y"
  page: getPageFromPathname(window.location.pathname),
  urlPath: window.location.pathname,
  urlQuery: window.location.search
}, action) => {
  switch (action.type) {
    case types.PAGE_CHANGE: {
      return Object.assign({}, state, {
        page: action.page,
        datapath: action.datapath
      });
    } case types.MANIFEST_RECEIVED: {
      const newState = {
        s3bucket: action.s3bucket,
        splash: action.splash,
        availableDatasets: action.availableDatasets,
        user: action.user
      };
      return Object.assign({}, state, newState);
    } case types.URL: {
      return Object.assign({}, state, {
        urlPath: action.path,
        urlSearch: action.query
      });
    } default: {
      return state;
    }
  }
};

export default datasets;
