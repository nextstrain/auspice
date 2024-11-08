import * as types from "../actions/types";
import { DatasetJsonRootSequence, DatasetJson, DatasetJsonMeta } from "../types/datasetJson";

export interface MetadataState { // TODO -- work out exactly what properties you want to have as required here
  loaded: true;
  rootSequence: DatasetJsonRootSequence;
  identicalGenomeMapAcrossBothTrees: boolean;
  rootSequenceSecondTree: DatasetJsonRootSequence;
  colorOptions: any; // ColorDefinition[]; // TODO XXX - is this right? probably not
  colorings: any; // TODO XXX
  geoResolutions: Required<DatasetJsonMeta>['geo_resolutions'];
  buildUrl: Required<DatasetJsonMeta>['build_url'] | false;
  displayDefaults: Record<string,any>; // TODO XXX
  panels: Required<DatasetJsonMeta>['panels'];
  mainTreeNumTips: number;
  title: DatasetJsonMeta['title'];
  version: DatasetJson['version'];
  filters: Required<DatasetJsonMeta>['filters'];
  dataProvenance: Required<DatasetJsonMeta>['data_provenance'];
  maintainers: Required<DatasetJsonMeta>['maintainers'];
  description: Required<DatasetJsonMeta>['description'];
  updated: Required<DatasetJsonMeta>['updated'];
}

export type IncompleteMetadataState = Partial<Omit<MetadataState, "loaded">> & {loaded: false};

export function convertIncompleteMetadataStateToMetadataState(meta: IncompleteMetadataState): MetadataState {
  // We need to duplicate they keys here since we can't access the interface at runtime? Seems a little silly
  // Also, to do this properly we're essentially implementing runtime type checking or schema validation,
  // and we don't want to be doing that. What's the best path here?
  const expectedProperties: [string, string, any][] = [
    // THIS IS INCOMPLETE - TODO XXX
    // ["title", "string", null], // title is optional!
    ["version", "string", null],
    ["filters", "string", []],
    ["updated", "string", new Error("JSON.meta missing property 'updated' which is essential")], // TKTK - it's not essential, just for testing
  ]
  for (const [key, typeShouldBe, _default] of expectedProperties) {
    if (typeof meta[key] === typeShouldBe) continue
    if (_default instanceof Error) {
      throw _default;
    }
    meta[key] = _default;
  }
  // Can we replace the following cast with a Type predicate? That seems incompatible with the loaded boolean
  // acting as a type discriminant
  return {...meta, loaded: true} as MetadataState;
}

// function isMetadataStateTypePredicate(meta: IncompleteMetadataState | MetadataState): meta is MetadataState {
//   if (meta.loaded !== true) return false;
//   // the type predicate should assert properties exist etc, see convertPartialMetadataStateToMetadataState
//   // TODO XXX
//   return true;
// }

function getDefaultMetadataState(): IncompleteMetadataState {
  return {
    loaded: false,
  };
}

/* The metadata reducer holds data that is
 * (a) mostly derived from the dataset JSON
 * (b) rarely changes
 */
const Metadata = (state:IncompleteMetadataState | MetadataState = getDefaultMetadataState(), action): IncompleteMetadataState | MetadataState => {

  // TODO XXX - does this maybe have to be unloaded vs loaded, discriminating on 'loaded: boolean' ???

  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
    case types.TREE_TOO_DATA:
    case types.CLEAN_START:
      console.log("incoming!", action.metadata)
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

// TODO - can we replace the returned 'false' with 'undefined'?
function getBuildUrlFromGetAvailableJson(availableData): (false | undefined | string) {
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
