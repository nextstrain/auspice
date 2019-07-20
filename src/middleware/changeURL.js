import queryString from "query-string";
import * as types from "../actions/types";
import { numericToCalendar } from "../util/dateHelpers";

/* What is this middleware?
This middleware acts to keep the app state and the URL query state in sync by intercepting actions
and updating the URL accordingly. Thus, in theory, this middleware can be disabled and the app will still work
as expected.

The only modification of redux state by this app is (potentially) an action of type types.URL
which is used to "save" the current page so we can diff against a new one!
*/

// eslint-disable-next-line
export const changeURLMiddleware = (store) => (next) => (action) => {
  const state = store.getState(); // this is "old" state, i.e. before the reducers have updated by this action
  const result = next(action); // send action to other middleware / reducers
  // if (action.dontModifyURL !== undefined) {
  //   console.log("changeURL middleware skipped")
  //   return result;
  // }

  /* starting URL values & flags */
  let query = queryString.parse(window.location.search);
  let pathname = window.location.pathname;

  /* first switch: query change */
  switch (action.type) {
    case types.CLEAN_START: // fallthrough
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: // fallthrough
    case types.CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE:
      query = action.query;
      if (query.tt) delete query.tt;
      break;
    case types.CHANGE_ZOOM:
      query.gmin = action.zoomc[0] === state.controls.absoluteZoomMin ? undefined : action.zoomc[0];
      query.gmax = action.zoomc[1] >= state.controls.absoluteZoomMax ? undefined : action.zoomc[1];
      break;
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
    case types.TOGGLE_PANEL_DISPLAY: {
      if (state.controls.panelsAvailable.length === action.panelsToDisplay.length) {
        query.d = undefined;
      } else {
        query.d = action.panelsToDisplay.join(",");
      }
      query.p = action.panelLayout;
      break;
    }
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      if (state.controls.animationPlayPauseButton === "Pause") { // animation in progress - no dates in URL
        query.dmin = undefined;
        query.dmax = undefined;
      } else {
        query.dmin = action.dateMin === state.controls.absoluteDateMin ? undefined : action.dateMin;
        query.dmax = action.dateMax === state.controls.absoluteDateMax ? undefined : action.dateMax;
      }
      break;
    }
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS: {
      query.s = action.selectedStrain ? action.selectedStrain : undefined;
      query.clade = action.cladeName ? action.cladeName : undefined;
      break;
    }
    case types.MAP_ANIMATION_PLAY_PAUSE_BUTTON:
      if (action.data === "Play") { // animation stopping - restore dates in URL
        query.animate = undefined;
        query.dmin = state.controls.dateMin === state.controls.absoluteDateMin ? undefined : state.controls.dateMin;
        query.dmax = state.controls.dateMax === state.controls.absoluteDateMax ? undefined : state.controls.dateMax;
      }
      break;
    case types.MIDDLEWARE_ONLY_ANIMATION_STARTED:
      /* animation started - format: start bound, end bound, loop 0|1, cumulative 0|1, speed in ms */
      const a = numericToCalendar(window.NEXTSTRAIN.animationStartPoint);
      const b = numericToCalendar(window.NEXTSTRAIN.animationEndPoint);
      const c = state.controls.mapAnimationShouldLoop ? "1" : "0";
      const d = state.controls.mapAnimationCumulative ? "1" : "0";
      const e = state.controls.mapAnimationDurationInMilliseconds;
      query.animate = `${a},${b},${c},${d},${e}`;
      break;
    case types.PAGE_CHANGE:
      if (action.query) {
        query = action.query;
      } else if (action.displayComponent !== state.general.displayComponent) {
        query = {};
      }
      break;
    case types.TOGGLE_NARRATIVE: {
      if (action.display === true) {
        query = {n: state.narrative.blockIdx};
      }
      break;
    }
    default:
      break;
  }

  /* second switch: path change */
  switch (action.type) {
    case types.CLEAN_START:
      if (action.url && !action.narrative) {
        pathname = action.url;
      }
      break;
    case types.CHANGE_URL_QUERY_BUT_NOT_REDUX_STATE: {
      if (action.pathname) pathname = action.pathname;
      break;
    }
    case types.TOGGLE_NARRATIVE: {
      if (action.display === true) {
        pathname = state.narrative.pathname;
      }
      break;
    }
    case types.PAGE_CHANGE:
      /* desired behaviour depends on the displayComponent selected... */
      if (action.displayComponent === "main" || action.displayComponent === "datasetLoader" || action.displayComponent === "splash") {
        pathname = action.path || pathname;
      } else if (pathname.startsWith(`/${action.displayComponent}`)) {
        // leave the pathname alone!
      } else {
        pathname = action.displayComponent;
      }
      break;
    case types.REMOVE_TREE_TOO: // fallthrough
    case types.TREE_TOO_DATA: {
      const fields = pathname.split("/");
      let treeIdx;
      fields.forEach((f, i) => {
        if (f === state.tree.name || f.startsWith(state.tree.name+":")) {
          treeIdx = i;
        }
      });
      if (!treeIdx) {
        console.warn("Couldn't work out tree name in URL!");
        break;
      }
      fields[treeIdx] = action.type === types.TREE_TOO_DATA ?
        `${fields[treeIdx].split(":")[0]}:${action.segment}` :
        fields[treeIdx].split(":")[0];
      pathname = fields.join("/");
      break;
    }
    default:
      break;
  }

  Object.keys(query).filter((q) => query[q] === "").forEach((k) => delete query[k]);
  let search = queryString.stringify(query).replace(/%2C/g, ',').replace(/%2F/g, '/');
  if (search) {search = "?" + search;}
  if (!pathname.startsWith("/")) {pathname = "/" + pathname;}

  if (pathname !== window.location.pathname || search !== window.location.search) {
    let newURLString = pathname;
    if (search) {newURLString += search;}
    // if (pathname !== window.location.pathname) {console.log(pathname, window.location.pathname)}
    // if (window.location.search !== search) {console.log(window.location.search, search)}
    // console.log(`Action ${action.type} Changing URL from ${window.location.href} -> ${newURLString} (pushState: ${action.pushState})`);
    if (action.pushState === true) {
      window.history.pushState({}, "", newURLString);
    } else {
      window.history.replaceState({}, "", newURLString);
    }
    next({type: types.UPDATE_PATHNAME, pathname: pathname});
  } else if (pathname !== state.general.pathname && action.type === types.PAGE_CHANGE) {
    next({type: types.UPDATE_PATHNAME, pathname: pathname});
  }

  return result;
};
