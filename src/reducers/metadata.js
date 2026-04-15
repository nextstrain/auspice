import { colorOptions } from "../util/globals";
import * as types from "../actions/types";

/* The metadata reducer holds data that is
 * (a) mostly derived from the dataset JSON
 * (b) rarely changes
 */

const Metadata = (state = {
  loaded: false, /* see comment in the sequences reducer for explanation */
  metadata: null,
  rootSequence: undefined,
  identicalGenomeMapAcrossBothTrees: false,
  rootSequenceSecondTree: undefined,
  colorOptions // this can't be removed as the colorScale currently runs before it should
}, action) => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
    case types.TREE_TOO_DATA:
    case types.CLEAN_START:
      return action.metadata;
    case types.ADD_EXTRA_METADATA: {
      const colorings = Object.assign({}, state.colorings, action.newColorings);
      let geoResolutions = state.geoResolutions;
      if (action.newGeoResolution) {
        if (!geoResolutions) geoResolutions = [action.newGeoResolution]; /* case where no geoRes in JSON */
        else geoResolutions = [...geoResolutions, action.newGeoResolution];
      }
      return Object.assign({}, state, {colorings, geoResolutions});
    }
    case types.UPDATE_METADATA: {
      // TODO XXX
      const updates = { colorings: { ...state.colorings } };
      Object.values(action.attributes).forEach((attrInfo) => _mergeAttr(updates.colorings, attrInfo));
      if (action.geographic) {
        // todo: cover case where we merge / update existing deme
        updates.geoResolutions = [ ...(state.geoResolutions || []), ...action.geographic ];
      }
      return Object.assign({}, state, updates);
    }
    case types.REMOVE_METADATA: {
      const colorings = {...state.colorings};
      action.nodeAttrsToRemove.forEach((colorBy) => {
        if (colorBy in colorings) {
          delete colorings[colorBy];
        }
      })
      return {...state, colorings}
    }
    case types.SET_AVAILABLE: {
      if (state.buildUrl) {
        return state; // do not use data from getAvailable to overwrite a buildUrl set from a dataset JSON
      }
      const buildUrl = getBuildUrlFromGetAvailableJson(action.data.datasets);
      if (buildUrl) {
        return Object.assign({}, state, {buildUrl});
      }
      return state;
    }
    case types.SET_ROOT_SEQUENCE:
      return {...state, rootSequence: action.data};
    case types.REMOVE_TREE_TOO:
      return Object.assign({}, state, {
        identicalGenomeMapAcrossBothTrees: false,
        rootSequenceSecondTree: undefined,
      });
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

/**
 * Merge an attribute (type: `ColoringInfo`) into colorings state
 */
function _mergeAttr(colorings, attrInfo) {
  const key = attrInfo.key;

  const replace = !Object.hasOwn(colorings, key) ||
    attrInfo.scaleType !== colorings[key].type;

  if (replace) {
    colorings[key] = {
      title: attrInfo.name,
      type: attrInfo.scaleType,
      scale: Object.keys(attrInfo.colours).length ? Object.entries(attrInfo.colours) : undefined,
    }
  } else {
    colorings[key] = { ...colorings[key] };
    colorings[key].title = attrInfo.name;
    const scaleDict = {
      ...Object.fromEntries(colorings[key].scale || []),
      ...(attrInfo.colours || {})
    }
    colorings[key].scale = Object.entries(scaleDict);
  }
}

export default Metadata;
