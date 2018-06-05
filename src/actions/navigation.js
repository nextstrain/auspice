import queryString from "query-string";
import parseParams from "../util/parseParams";
import { createStateFromQueryOrJSONs } from "./recomputeReduxState";
import { PAGE_CHANGE, URL_QUERY_CHANGE_WITH_COMPUTED_STATE } from "./types";

// make prefix for data files with fields joined by _ instead of / as in URL
const makeDataPathFromParsedParams = (parsedParams) => {
  const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
  tmp_levels.sort((x, y) => x[0] > y[0]);
  return tmp_levels.map((d) => d[1]).join("_");
};

/* match URL pathname to datasets (from manifest) */
export const getDatapath = (pathname, availableDatasets) => {
  if (!availableDatasets) {return undefined;}
  const parsedParams = parseParams(pathname, availableDatasets);
  if (parsedParams.valid) {
    return makeDataPathFromParsedParams(parsedParams);
  }
  return pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_');
};

export const chooseDisplayComponentFromPathname = (pathname) => {
  if (pathname === "/" || pathname === "/all") return "splash";
  else if (pathname.startsWith("/status")) return "status";
  return "app"; // fallthrough
};

/* changes the state of the page and (perhaps) the dataset displayed.
This function is used throughout the app for all navigation to another page, (including braowserBackForward - see function below)
The exception is for navigation requests that specify only the query changes, or that have an identical pathname to that selected.
Note that this function is not pure, in that it may change the URL

ARGUMENTS:
(1) path - REQUIRED - the destination path - e.g. "zika" or "flu/..." (does not include query)
(2) query - OPTIONAL (default: undefined) - see below
(3) push - OPTIONAL (default: true) - signals that pushState should be used (has no effect on the reducers)

UNDERSTANDING QUERY (SLIGHTLY CONFUSING)
This function changes the pathname (stored in the datasets reducer) and modifies the URL pathname and query
accordingly in the middleware. But the URL query is not processed further.
Because the datasets reducer has changed, the <App> (or whichever display component we're on) will update.
In <App>, this causes a call to loadJSONs, which will, as part of it's dispatch, use the URL state of query.
In this way, the URL query is "used".
*/
export const changePage = ({path, query = undefined, push = true}) => (dispatch, getState) => {
  if (!path) {console.error("changePage called without a path"); return;}
  const { datasets } = getState();
  const d = {
    type: PAGE_CHANGE,
    displayComponent: chooseDisplayComponentFromPathname(path),
    errorMessage: undefined
  };
  d.datapath = d.displayComponent === "app" ? getDatapath(path, datasets.availableDatasets) : undefined;
  if (query !== undefined) { d.query = query; }
  if (push) { d.pushState = true; }
  /* check if this is "valid" - we can change it here before it is dispatched */
  dispatch(d);
};

/* a 404 uses the same machinery as changePage, but it's not a thunk */
export const goTo404 = (errorMessage) => ({
  type: PAGE_CHANGE,
  displayComponent: "splash",
  errorMessage,
  pushState: true
});

/* modify redux state and URL by specifying a new URL query string. Pathname is not considered, if you want to change that, use "changePage" instead.
Unlike "changePage" the query is processed both by the middleware (i.e. to update the URL) AND by the reducers, to update their state accordingly.
ARGUMENTS:
(1) query - REQUIRED - {object}
(2) push - OPTIONAL (default: true) - signals that pushState should be used (has no effect on the reducers)
*/
export const changePageQuery = ({queryToUse, queryToDisplay = false, push = true}) => (dispatch, getState) => {
  const newState = createStateFromQueryOrJSONs({oldState: getState(), query: queryToUse});
  dispatch({
    type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE,
    ...newState,
    pushState: push,
    query: queryToDisplay ? queryToDisplay : queryToUse
  });
};

export const browserBackForward = () => (dispatch, getState) => {
  const { datasets } = getState();
  /* if the pathname has changed, trigger the changePage action (will trigger new post to load, new dataset to load, etc) */
  // console.log("broswer back/forward detected. From: ", datasets.urlPath, datasets.urlSearch, "to:", window.location.pathname, window.location.search)
  if (datasets.urlPath !== window.location.pathname) {
    dispatch(changePage({path: window.location.pathname}));
  } else {
    dispatch(changePageQuery({queryToUse: queryString.parse(window.location.search)}));
  }
};
