import * as types from "../actions/types";
import { chooseDisplayComponentFromPathname } from "../actions/navigation";

const datasets = (state = {
  s3bucket: "live",
  available: undefined,
  availableDatasets: undefined,
  splash: undefined,
  source: undefined,
  datapath: undefined, // e.g. "zika" or "flu_h3n2_12y"
  displayComponent: chooseDisplayComponentFromPathname(window.location.pathname),
  urlPath: window.location.pathname,
  urlQuery: window.location.search,
  errorMessage: undefined
}, action) => {
  switch (action.type) {
    case types.PAGE_CHANGE: {
      return Object.assign({}, state, {
        displayComponent: action.displayComponent,
        datapath: action.datapath,
        errorMessage: action.errorMessage
      });
    } case types.MANIFEST_RECEIVED: {
      const newState = {
        s3bucket: action.s3bucket,
        splash: action.splash,
        availableDatasets: action.availableDatasets,
        user: action.user,
        datapath: action.datapath
      };
      return Object.assign({}, state, newState);
    } case types.PROCEED_SANS_MANIFEST: {
      return Object.assign({}, state, {datapath: action.datapath});
    } case types.URL: {
      return Object.assign({}, state, {
        urlPath: action.path,
        urlSearch: action.query
      });
    } case types.AVAILABLE_DATASETS: {
      return Object.assign({}, state, {
        source: action.source,
        available: action.available
      });
    } default: {
      return state;
    }
  }
};

export default datasets;
