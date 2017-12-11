import queryString from "query-string";
import * as types from "../actions/types";

/* What is this middleware?
This middleware acts to keep the app state and the URL query state in sync by intercepting actions
and updating the URL accordingly. Thus, in theory, this middleware can be disabled and the app will still work
as expected
*/

// eslint-disable-next-line
export const changeURLMiddleware = (store) => (next) => (action) => {
  const state = store.getState(); // this is "old" state, i.e. before the reducers have updated by this action
  const result = next(action); // send action to other middleware / reducers
  if (action.dontModifyURL !== undefined) {
    console.log("changeURL middleware skipped")
    return result;
  }

  /* starting URL values & flags */
  let query = queryString.parse(window.url.location.search);
  let pathname = window.url.location.pathname;
  let queryModified = true;
  let pathModified = true;

  /* first switch: query change */
  switch (action.type) {
    case types.NEW_COLORS:
      query.c = action.colorBy === state.controls.defaults.colorBy ? undefined : action.colorBy;
      break;
    case types.APPLY_FILTER: {
      query[`f_${action.fields}`] = action.values.join(',');
      break;
    }
    case types.CHANGE_LAYOUT: {
      query.l = action.data === state.controls.defaults.layout ? undefined : action.data;
      break;
    }
    case types.CHANGE_GEO_RESOLUTION: {
      query.r = action.data === state.controls.defaults.geoResolution ? undefined : action.data;
      break;
    }
    case types.CHANGE_DISTANCE_MEASURE: {
      query.m = action.data === state.controls.defaults.distanceMeasure ? undefined : action.data;
      break;
    }
    case types.CHANGE_PANEL_LAYOUT: {
      query.p = action.notInURLState === true ? undefined : action.data;
      break;
    }
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      if (state.controls.mapAnimationPlayPauseButton === "Pause") { // animation in progress - no dates in URL
        query.dmin = undefined;
        query.dmax = undefined;
      } else {
        query.dmin = action.dateMin === state.controls.absoluteDateMin ? undefined : action.dateMin;
        query.dmax = action.dateMax === state.controls.absoluteDateMax ? undefined : action.dateMax;
      }
      break;
    }
    case types.MAP_ANIMATION_PLAY_PAUSE_BUTTON:
      if (action.data === "Play") { // animation stopping - restore dates in URL
        query.dmin = state.controls.dateMin === state.controls.absoluteDateMin ? undefined : state.controls.dateMin;
        query.dmax = state.controls.dateMax === state.controls.absoluteDateMax ? undefined : state.controls.dateMax;
      }
      break;
    case types.URL_QUERY_CHANGE:
      query = action.query;
      break;
    default:
      queryModified = false;
      break;
  }

  /* second switch: path change */
  switch (action.type) {
    case types.PAGE_CHANGE:
      console.log("in middleware for page change", action)
      if (action.page === "app") {
        pathname = action.pathname;
      } else if (action.page === "splash") {
        pathname = "/";
      } else {
        pathname = action.page;
      }
      break;
    // case types.CHANGE_URL_NOT_STATE:
    //   pathname = action.path;
    //   break;
    default:
      pathModified = false;
      break;
  }

  if (queryModified || pathModified) {
    Object.keys(query).filter((k) => !query[k]).forEach((k) => delete query[k]);
    const newURL = {
      pathname,
      search: queryString.stringify(query).replace(/%2C/g, ',')
    };
    window.url.replace(newURL);
  }

  return result;
};
