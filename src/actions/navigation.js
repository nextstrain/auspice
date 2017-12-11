import queryString from "query-string";
import parseParams from "../util/parseParams";
import { PAGE_CHANGE, CHANGE_URL_NOT_STATE } from "./types";


// make prefix for data files with fields joined by _ instead of / as in URL
const makeDataPathFromParsedParams = (parsedParams) => {
  const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
  tmp_levels.sort((x, y) => x[0] > y[0]);
  return tmp_levels.map((d) => d[1]).join("_");
};

/* TODO: move to middleware */
const selectivelyUpdateSearch = (defaultSearch, userSearch) => {
  if (!defaultSearch) { return userSearch; }
  const final = queryString.parse(userSearch);
  const defaults = queryString.parse(defaultSearch);
  for (const key of Object.keys(defaults)) {
    if (!(key in final)) {
      final[key] = defaults[key];
    }
  }
  return queryString.stringify(final);
};

/* match URL pathname to datasets (from manifest) and potentially update the URL */
const getPathnameAndMaybeChangeURL = (dispatch, pathname, datasets) => { // eslint-disable-line
  if (!datasets) {return undefined;}
  const parsedParams = parseParams(pathname, datasets);
  // set a new URL if the dataPath is incomplete
  if (parsedParams.incomplete) {
    dispatch({
      type: CHANGE_URL_NOT_STATE,
      path: parsedParams.fullsplat,
      query: selectivelyUpdateSearch(parsedParams.search, window.url.location.search)
    });
  }
  // if valid, return the data_path, else undefined
  if (parsedParams.valid) {
    return makeDataPathFromParsedParams(parsedParams);
  }
  return pathname.replace(/^\//, '').replace(/\/$/, '').replace('/', '_');
};


const getPageFromPathname = (pathname) => {
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


/* this is an action, rather than the reducer, as it is not pure (it may change the URL) */
// eslint-disable-next-line
export const changePage = (pathIn) => (dispatch, getState) => {
  const { datasets } = getState();
  const page = getPageFromPathname(pathIn);
  const pathname = page === "app" ? getPathnameAndMaybeChangeURL(dispatch, pathIn, {pathogen: datasets.pathogen}) : undefined;
  /* check if this is "valid" - we can change it here before it is dispatched */
  // console.log("ACTION chanegPAge. PAGE CHANGE TO:", page, " DATAPATH:", pathname)
  dispatch({type: PAGE_CHANGE, page, pathname});
};
