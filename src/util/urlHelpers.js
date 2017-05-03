import queryString from "query-string";
import { CHANGE_LAYOUT, CHANGE_DISTANCE_MEASURE, CHANGE_GEO_RESOLUTION } from "../actions/types";
import { changeColorBy } from "../actions/colors";
import parseParams from "./parseParams";
import { changeDateFilter } from "../actions/treeProperties";

/* this function takes (potentially multiple) changes you would like
reflected in the URL and makes one change.
  router: normally via this.context.router
  newPath: null for no change, string of new path otherwise
  keyValuePairs: null for no change, else dict such that URL query adds on
                (or replaces) e.g. .../?key=value
  replace: if true, you can't go "back" to the old state via the browser
*/
export const modifyURLquery = function (router, keyValuePairs = null, replace = false) {
  let query = queryString.parse(router.history.location.search);
  // const query = queryString.parse(router.history.location.search);
  if (keyValuePairs) {
    // Object.keys(keyValuePairs).forEach((key, idx) => {console.log(key, idx)});
    query = Object.assign({}, query, keyValuePairs);
  }
  // console.log("query in:", queryString.parse(router.history.location.search))
  // console.log("query out:", query)
  const newURL = {
    pathname: router.history.location.pathname,
    search: queryString.stringify(query)
  };
  replace ? router.history.replace(newURL) : router.history.push(newURL);
};


export const restoreStateFromURL = function (router, dispatch) {
  const query = queryString.parse(router.history.location.search);
  if (query.l) {
    dispatch({ type: CHANGE_LAYOUT, data: query.l });
  }
  if (query.m) {
    dispatch({ type: CHANGE_DISTANCE_MEASURE, data: query.m });
  }
  if (query.dmin && query.dmax) {
    dispatch(changeDateFilter(query.dmin, query.dmax));
  } else if (query.dmin) {
    dispatch(changeDateFilter(query.dmin, null));
  } else if (query.dmax) {
    dispatch(changeDateFilter(null, query.dmax));
  }
  if (query.c) {
    dispatch(changeColorBy(query.c));
  }
  if (query.r) {
    dispatch({ type: CHANGE_GEO_RESOLUTION, data: query.r })
  }
};

// make prefix for data files with fields joined by _ instead of / as in URL
const makeDataPathFromParsedParams = function (parsedParams) {
  const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
  tmp_levels.sort((x, y) => x[0] > y[0]);
  return tmp_levels.map((d) => d[1]).join("_");
};

const selectivelyUpdateSearch = function (defaultSearch, userSearch) {
  if (!defaultSearch) {return userSearch;}
  const final = queryString.parse(userSearch);
  const defaults = queryString.parse(defaultSearch);
  for (const key of Object.keys(defaults)) {
    if (!(key in final)) {
      final[key] = defaults[key];
    }
  }
  return queryString.stringify(final);
};

/* if we have decided that the URL (data, not query) has changed
this fn will work out the correct datapath, set it if necessary,
and return the data path used to load the data
*/
export const turnURLtoDataPath = function (router) {
  // console.log("turnURLtoDataPath")
  const parsedParams = parseParams(router.history.location.pathname);
  // console.log("parsed params turned", router.history.location.pathname, "to", parsedParams)
  // set a new URL if the dataPath is incomplete
  if (parsedParams.incomplete) {
    // console.log("parsed params incomplete => modifying URL")
    router.history.replace({
      pathname: parsedParams.fullsplat,
      search: selectivelyUpdateSearch(parsedParams.search, router.history.location.search)
    });
  }
  // if valid, return the data_path, else undefined
  if (parsedParams.valid) {
    return makeDataPathFromParsedParams(parsedParams);
  }
  return undefined;
};

export const determineColorByGenotypeType = function (colorBy) {
  /* note that nucleotide genotypes are either gt-nucXXX or gt-XXX */
  if (colorBy.startsWith("gt")) {
    if (colorBy.slice(3, 6) === "nuc" || !isNaN(parseInt(colorBy.slice(3, 4)))) {
      return "nuc";
    }
    return "aa";
  }
  return false;
};
