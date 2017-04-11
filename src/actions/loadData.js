/*eslint dot-notation: 0*/
import { updateColorScale, updateNodeColors } from "./colors";
import { dataURLStem } from "../util/globals";
import * as types from "./types";
// import { CHANGE_GEO_RESOLUTION } from "./types";
// import {defaultGeoResolution} from "../util/globals";


/* request metadata */
const requestMetadata = () => {
  return {
    type: types.REQUEST_METADATA
  };
};

const receiveMetadata = (data) => {
  const ret = {
    type: types.RECEIVE_METADATA,
    data: data
  };
  /* if there's data data include this for the controls reducer */
  if (data.date_range) {
    if (data.date_range.date_min) {
      ret["dateMin"] = data.date_range.date_min;
      ret["absoluteDateMin"] = data.date_range.date_min;
    }
    if (data.date_range.date_max) {
      ret["dateMax"] = data.date_range.date_max;
      ret["absoluteDateMax"] = data.date_range.date_max;
    }
  }
  return ret;
};

const metadataFetchError = (err) => {
  return {
    type: types.METADATA_FETCH_ERROR,
    data: err
  };
};

const fetchMetadata = (q) => {
  /*
    this will resolve to something like:
    /data/flu_h3n2_3y_meta.json
  */
  return fetch(
    dataURLStem + q + "_meta.json"
  );
};

const populateMetadataStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestMetadata());
    return fetchMetadata(queryParams).then((res) => res.json()).then(
      (json) => {
        dispatch(receiveMetadata(json));
        dispatch(updateColorScale());
        dispatch(updateNodeColors());
      },
      (err) => dispatch(metadataFetchError(err))
    );
  };
};

// const checkGeoResolution = (node) => {
//   return {
//     if defaultGeoResolution not in node.attr():{
//     // need to fix conditional syntax.... I have no idea where the semicolons go ;)
//       if 'region' in node.attr():{ // default is 'country'; if null, try 'region'
//         type: CHANGE_GEO_RESOLUTION,
//         data: 'region'};
//       else:{
//         type: CHANGE_GEO_RESOLUTION,  // if neither 'region' nor 'country' available, don't draw the map.
//                                       // should also add a conditional to the map.js component checking that state.controls.georesolution exists
//         data: null};
//     };
//     // else:{
//       // do I need an else clause here to say "do nothing" if the default is fine?
//     // }
//   }
// }

/* request tree */

const requestTree = () => {
  return {
    type: types.REQUEST_TREE
  };
};

const receiveTree = (data, controls) => {
  return {
    type: types.RECEIVE_TREE,
    data,
    controls
  };
};

const treeFetchError = (err) => {
  return {
    type: types.TREE_FETCH_ERROR,
    data: err
  };
};

const fetchTree = (q) => {
  return fetch(
    dataURLStem + q + "_tree.json"
  );
};

const populateTreeStore = (queryParams) => {
  return (dispatch, getState) => {
    const { controls } = getState();
    dispatch(requestTree());
    return fetchTree(queryParams).then((res) => res.json()).then(
      (json) => {
        console.log("TREE JSON ARRIVED")
        dispatch(receiveTree(json, controls));
        console.log("TREE JSON ARRIVED #2")

        // console.log(controls.geoResolution)
        // need to figure out how to access the first node in the tree object / where the tree object lives. Pass this as argument.
        // dispatch(checkGeoResolution(nodes[0]));
        dispatch(updateColorScale());
        dispatch(updateNodeColors());
      },
      (err) => dispatch(treeFetchError(err))
    );
  };
};

/* request sequences */

const requestSequences = () => {
  return {
    type: types.REQUEST_SEQUENCES
  };
};

const receiveSequences = (data) => {
  return {
    type: types.RECEIVE_SEQUENCES,
    data: data
  };
};

const sequencesFetchError = (err) => {
  return {
    type: types.SEQUENCES_FETCH_ERROR,
    data: err
  };
};

const fetchSequences = (q) => {
  return fetch(
    dataURLStem + q + "_sequences.json"
  );
};

const populateSequencesStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestSequences());
    return fetchSequences(queryParams).then((res) => res.json()).then(
      (json) => {
        dispatch(receiveSequences(json));
        dispatch(updateColorScale());
        dispatch(updateNodeColors());
      },
      (err) => dispatch(sequencesFetchError(err))
    );
  };
};

/* request frequencies */
const requestFrequencies = () => {
  return {
    type: types.REQUEST_FREQUENCIES
  };
};

const receiveFrequencies = (data) => {
  return {
    type: types.RECEIVE_FREQUENCIES,
    data: data
  };
};

const frequenciesFetchError = (err) => {
  return {
    type: types.FREQUENCIES_FETCH_ERROR,
    data: err
  };
};

const fetchFrequencies = (q) => {
  return fetch(
    dataURLStem + q + "_frequencies.json"
  );
};

const populateFrequenciesStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestFrequencies());
    return fetchFrequencies(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveFrequencies(json)),
      (err) => dispatch(frequenciesFetchError(err))
    );
  };
};

/* request entropyes */
const requestEntropy = () => {
  return {
    type: types.REQUEST_ENTROPY
  };
};

const receiveEntropy = (data) => {
  return {
    type: types.RECEIVE_ENTROPY,
    data: data
  };
};

const entropyFetchError = (err) => {
  return {
    type: types.ENTROPY_FETCH_ERROR,
    data: err
  };
};

const fetchEntropy = (q) => {
  return fetch(
    dataURLStem + q + "_entropy.json"
  );
};

const populateEntropyStore = (queryParams) => {
  return (dispatch) => {
    dispatch(requestEntropy());
    return fetchEntropy(queryParams).then((res) => res.json()).then(
      (json) => dispatch(receiveEntropy(json)),
      (err) => dispatch(entropyFetchError(err))
    );
  };
};


export const loadJSONs = (data_path) => {
  return (dispatch) => {
    dispatch(populateMetadataStore(data_path));
    dispatch(populateTreeStore(data_path));
    dispatch(populateSequencesStore(data_path));
    /* while nextstrain is limited to ebola & zika, frequencies are not needed */
    // dispatch(populateFrequenciesStore(data_path));
    dispatch(populateEntropyStore(data_path));
  };
};
