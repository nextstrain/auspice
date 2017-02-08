import queryString from "query-string";
import { CHANGE_LAYOUT, CHANGE_DISTANCE_MEASURE, CHANGE_DATE_MIN,
  CHANGE_DATE_MAX, changeColorBy } from "../actions/controls";

/* this function takes (potentially multiple) changes you would like
reflected in the URL and makes one change.
  router: normally via this.context.router
  newPath: null for no change, string of new path otherwise
  keyValuePairs: null for no change, else dict such that URL query adds on
                (or replaces) e.g. .../?key=value
  replace: if true, you can't go "back" to the old state via the browser
*/
export const modifyURL = function (router, newPath = null, keyValuePairs = null, replace = false) {
  let query = queryString.parse(router.location.search);
  // const query = queryString.parse(router.location.search);
  if (keyValuePairs) {
    // Object.keys(keyValuePairs).forEach((key, idx) => {console.log(key, idx)});
    query = Object.assign({}, query, keyValuePairs);
  }
  // console.log("query in:", queryString.parse(router.location.search))
  // console.log("query out:", query)

  const pathName = router.location.pathname;
  if (newPath) {
    console.log("to do");
  }

  const newURL = {
    pathname: pathName,
    search: queryString.stringify(query)
  };
  replace ? router.replace(newURL) : router.push(newURL);
};


export const restoreStateFromURL = function (router, dispatch) {
  const query = queryString.parse(router.location.search);
  if (query.l) {
    dispatch({ type: CHANGE_LAYOUT, data: query.l });
  }
  if (query.m) {
    dispatch({ type: CHANGE_DISTANCE_MEASURE, data: query.m });
  }
  if (query.dmin) {
    dispatch({ type: CHANGE_DATE_MIN, data: query.dmin });
  }
  if (query.dmax) {
    dispatch({ type: CHANGE_DATE_MAX, data: query.dmax });
  }
  if (query.c) {
    dispatch(changeColorBy(query.c));
  }
}
