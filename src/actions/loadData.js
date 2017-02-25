import { updateColorScale, updateNodeColors } from "./colors";
import { dataURLStem } from "../util/globals";
import * as types from "./types";

/* request metadata */

const requestMetadata = () => {
  return {
    type: types.REQUEST_METADATA
  };
};

const receiveMetadata = (data) => {
  return {
    type: types.RECEIVE_METADATA,
    data: data
  };
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
        dispatch(receiveTree(json, controls));
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
    dispatch(populateFrequenciesStore(data_path));
    dispatch(populateEntropyStore(data_path));
  };
};
