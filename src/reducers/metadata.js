import { colorOptions } from "../util/globals";
import * as types from "../actions/types";

/* The metdata reducer holds data that is
 * (a) mostly derived from the dataset JSON
 * (b) rarely changes
 */

const Metadata = (state = {
  loaded: false, /* see comment in the sequences reducer for explanation */
  metadata: null,
  rootSequence: undefined,
  colorOptions // this can't be removed as the colorScale currently runs before it should
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
    case types.CLEAN_START:
      return action.metadata;
    case types.ADD_EXTRA_METADATA:
      const colorings = Object.assign({}, state.colorings, action.newColorings);
      let geoResolutions = state.geoResolutions;
      if (action.newGeoResolution) {
        if (!geoResolutions) geoResolutions = [action.newGeoResolution]; /* case where no geoRes in JSON */
        else geoResolutions = [...geoResolutions, action.newGeoResolution];
      }
      return Object.assign({}, state, {colorings, geoResolutions});
    case types.SET_AVAILABLE:
      if (state.buildUrl) {
        return state; // do not use data from getAvailable to overwrite a buildUrl set from a dataset JSON
      }
      const buildUrl = getBuildUrlFromGetAvailableJson(action.data.datasets);
      if (buildUrl) {
        return Object.assign({}, state, {buildUrl});
      }
      return state;
    case types.SET_ROOT_SEQUENCE:
      return {...state, rootSequence: action.data};
    default:
      return state;
  }
};

function getBuildUrlFromGetAvailableJson(availableData) {
  if (!availableData) return undefined;
  /* check if the current dataset is present in the getAvailable data
  We currently parse the URL (pathname) for the current dataset but this
  really should be stored somewhere in redux */
  const displayedDatasetString = window.location.pathname
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split(":")[0];
  for (let i=0; i<availableData.length; i++) {
    if (availableData[i].request === displayedDatasetString) {
      return availableData[i].buildUrl; // may be `undefined`
    }
  }
  return false;
}


export default Metadata;
