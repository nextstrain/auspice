import queryString from "query-string";
import { createStateFromQueryOrJSONs } from "./recomputeReduxState";
import { PAGE_CHANGE, URL_QUERY_CHANGE_WITH_COMPUTED_STATE } from "./types";
import { loadJSONs } from "./loadData";

export const chooseDisplayComponentFromURL = (url) => {
  const parts = url.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (
    !parts.length || (parts.length === 1 && parts[0] === "") ||
    (parts.length === 1 && parts[0] === "local") ||
    (parts.length === 1 && parts[0] === "staging") ||
    (parts.length === 1 && parts[0] === "community")
  ) {
    return "splash";
  } else if (parts[0] === "status") {
    return "status";
  }
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
  if (!path) {
    console.error("changePage called without a path");
    return;
  }
  const displayComponent = chooseDisplayComponentFromURL(path);
  const { general } = getState();
  if (general.displayComponent === displayComponent && displayComponent === "app") {
    dispatch(loadJSONs({url: path}));
    return;
  }
  const action = {type: PAGE_CHANGE, displayComponent, pushState: push};
  if (query !== undefined) { action.query = query; }
  dispatch(action);
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
  const { general } = getState();
  const potentiallyOutOfDatePathname = general.pathname;
  /* differentiate between ∆pathname and ∆query (only) */
  console.log("broswer back/forward detected. From: ", potentiallyOutOfDatePathname, "to:", window.location.pathname, window.location.search)
  if (potentiallyOutOfDatePathname !== window.location.pathname) {
    dispatch(changePage({path: window.location.pathname}));
  } else {
    dispatch(changePageQuery({queryToUse: queryString.parse(window.location.search)}));
  }
};
