import parseParams from "../util/parseParams";
import queryString from "query-string";
import { getPost } from "../util/getMarkdown";
import { PAGE_CHANGE, URL_QUERY_CHANGE } from "./types";
import { updateVisibleTipsAndBranchThicknesses } from "./treeProperties";
import { changeColorBy } from "./colors";

// make prefix for data files with fields joined by _ instead of / as in URL
const makeDataPathFromParsedParams = (parsedParams) => {
  const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
  tmp_levels.sort((x, y) => x[0] > y[0]);
  return tmp_levels.map((d) => d[1]).join("_");
};

/* match URL pathname to datasets (from manifest) */
const getDatapath = (pathname, availableDatasets) => {
  if (!availableDatasets) {return undefined;}
  const parsedParams = parseParams(pathname, availableDatasets);
  if (parsedParams.valid) {
    return makeDataPathFromParsedParams(parsedParams);
  }
  return pathname.replace(/^\//, '').replace(/\/$/, '').replace('/', '_');
};

export const getPageFromPathname = (pathname) => {
  if (pathname === "/") {
    return "splash";
  } else if (pathname.startsWith("/methods")) {
    return "methods";
  } else if (pathname.startsWith("/posts")) {
    return "posts";
  } else if (pathname.startsWith("/about")) {
    return "about";
  }
  return "app"; // fallthrough
};

/* changes the state of the page and (perhaps) the dataset displayed.
required argument path is the destination path - e.g. "zika" or "flu/..."
optional argument query additionally changes the URL query in the middleware (has no effect on the reducers)
         (if this is left out, then the query is left unchanged by the middleware) (TYPE: object)
optional argument push signals that pushState should be used (has no effect on the reducers)
this is an action, rather than the reducer, as it is not pure (it may change the URL) */
export const changePage = ({path, query = undefined, push = true}) => (dispatch, getState) => {
  if (!path) {console.error("changePage called without a path"); return;}
  const { datasets } = getState();
  const d = {
    type: PAGE_CHANGE,
    page: getPageFromPathname(path)
  };
  d.datapath = d.page === "app" ? getDatapath(path, datasets.availableDatasets) : undefined;
  if (query !== undefined) { d.query = query; }
  if (push) { d.pushState = true; }
  /* check if this is "valid" - we can change it here before it is dispatched */
  dispatch(d);
  /* if a specific post is specified in the URL, fetch it */
  if (d.page === "posts" && path !== "/posts") {
    dispatch(getPost(`post_${path.replace("/posts/", "")}.md`));
  }
};

/* quite different to changePage - obviously only the query is changing, but this is sent to the reducers (it's not in changePage)
required argument query is sent to the reducers and additionally changes the URL query in the middleware (TYPE: object)
optional argument push signals that pushState should be used (has no effect on the reducers) */
export const changePageQuery = ({query, push = true}) => (dispatch, getState) => {
  const { controls, metadata } = getState();
  dispatch({
    type: URL_QUERY_CHANGE,
    query,
    metadata,
    pushState: push
  });
  const newState = getState();
  /* working out whether visibility / thickness needs updating is tricky */
  dispatch(updateVisibleTipsAndBranchThicknesses());
  if (controls.colorBy !== newState.controls.colorBy) {
    dispatch(changeColorBy());
  }
};

export const browserBackForward = () => (dispatch, getState) => {
  const { datasets } = getState();
  /* if the pathname has changed, trigger the changePage action (will trigger new post to load, new dataset to load, etc) */
  console.log("broswer back/forward detected. From: ", datasets.urlPath, datasets.urlSearch, "to:", window.location.pathname, window.location.search)
  if (datasets.urlPath !== window.location.pathname) {
    dispatch(changePage({path: window.location.pathname}));
  } else {
    dispatch(changePageQuery({query: queryString.parse(window.location.search)}));
  }
}
