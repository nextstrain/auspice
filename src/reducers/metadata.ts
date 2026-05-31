import * as types from "../actions/types";
import type { Metadata } from "./metadata.types";

const initialState: Metadata = {
  loaded: false,
  title: "",
  updated: "",
  sharing: {
    dataset_json: true,
    metadata_tsv: true,
    authors: true,
    trees: true,
    entropy: true,
    screenshot: true,
  },
  rootSequence: undefined,
  identicalGenomeMapAcrossBothTrees: false,
  rootSequenceSecondTree: undefined,
};

const metadata = (state: Metadata = initialState, action: any): Metadata => {
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
    case types.TREE_TOO_DATA:
    case types.CLEAN_START:
      return action.metadata;
    case types.UPDATE_METADATA: {
      return Object.assign({}, state, action.metadata);
    }
    case types.REMOVE_METADATA: {
      const colorings = {...state.colorings};
      action.nodeAttrsToRemove.forEach((colorBy: string) => {
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

interface AvailableDataset {
  request: string;
  buildUrl?: string;
}

function getBuildUrlFromGetAvailableJson(availableData: AvailableDataset[] | undefined): string | undefined | false {
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
      return availableData[i].buildUrl;
    }
  }
  return false;
}

export default metadata;
