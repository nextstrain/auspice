import queryString from "query-string";
import { createStateFromQueryOrJSONs } from "./recomputeReduxState";
import { PAGE_CHANGE, URL_QUERY_CHANGE_WITH_COMPUTED_STATE } from "./types";

/* Given a URL, what "page" should be displayed?
 * "page" means the main app, splash page, status page etc
 * If in doubt, we go to the datasetLoader page as this will
 * redirect to the splash page if the datasets are unavailable
 */
export const chooseDisplayComponentFromURL = (url) => {
  const parts = url.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (
    !parts.length ||
    (parts.length === 1 && parts[0] === "") ||
    (parts.length === 1 && parts[0] === "staging") ||
    (parts.length === 1 && parts[0] === "community") ||
    (parts.length === 1 && parts[0] === "narratives") ||
    (parts.length === 2 && parts[0] === "groups")
  ) {
    return "splash";
  } else if (parts[0] === "status") {
    return "status";
  }
  return "datasetLoader"; // fallthrough
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
export const changePage = ({
  path = undefined,
  query = undefined,
  queryToDisplay = undefined, /* doesn't affect state, only URL. defaults to query unless specified */
  push = true,
  changeDataset = true
} = {}) => (dispatch, getState) => {
  const oldState = getState();
  // console.warn("CHANGE PAGE!", path, query, queryToDisplay, push);

  /* set some defaults */
  if (!path) path = window.location.pathname;  // eslint-disable-line
  if (!query) query = queryString.parse(window.location.search);  // eslint-disable-line
  if (!queryToDisplay) queryToDisplay = query; // eslint-disable-line
  /* some booleans */
  const pathHasChanged = oldState.general.pathname !== path;

  if (changeDataset || pathHasChanged) {
    dispatch({
      type: PAGE_CHANGE,
      path,
      displayComponent: chooseDisplayComponentFromURL(path),
      pushState: push,
      query
    });
    return;
  }

  /* the path (dataset) remains the same... but the state may be modulated by the query */
  const newState = createStateFromQueryOrJSONs({oldState, query, dispatch});
  dispatch({
    type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE,
    ...newState,
    pushState: push,
    query: queryToDisplay
  });
};

/* a 404 uses the same machinery as changePage, but it's not a thunk.
 * Note that a 404 maintains the "bad" URL -- see https://github.com/nextstrain/auspice/issues/700
 */
export const goTo404 = (errorMessage) => ({
  type: PAGE_CHANGE,
  displayComponent: "splash",
  errorMessage,
  pushState: true
});


export const EXPERIMENTAL_showMainDisplayMarkdown = ({query, queryToDisplay}) =>
  (dispatch, getState) => {
    const newState = createStateFromQueryOrJSONs({oldState: getState(), query, dispatch});
    newState.controls.panelsToDisplay = ["EXPERIMENTAL_MainDisplayMarkdown"];
    dispatch({
      type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE,
      ...newState,
      pushState: true,
      query: queryToDisplay
    });
  };
