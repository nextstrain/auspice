export const REQUEST_METADATA = "REQUEST_METADATA";
export const RECEIVE_METADATA = "RECEIVE_METADATA";
export const METADATA_FETCH_ERROR = "METADATA_FETCH_ERROR";
export const REQUEST_TREE = "REQUEST_TREE";
export const RECEIVE_TREE = "RECEIVE_TREE";
export const TREE_FETCH_ERROR = "TREE_FETCH_ERROR";
export const REQUEST_SEQUENCES = "REQUEST_SEQUENCES";
export const RECEIVE_SEQUENCES = "RECEIVE_SEQUENCES";
export const SEQUENCES_FETCH_ERROR = "SEQUENCES_FETCH_ERROR";
export const REQUEST_FREQUENCIES = "REQUEST_FREQUENCIES";
export const RECEIVE_FREQUENCIES = "RECEIVE_FREQUENCIES";
export const FREQUENCIES_FETCH_ERROR = "FREQUENCIES_FETCH_ERROR";

/* request metadata */

const requestMetadata = () => {
  return {
    type: REQUEST_METADATA
  };
};

const receiveMetadata = (data) => {
  return {
    type: RECEIVE_METADATA,
    data: data
  };
};

const metadataFetchError = (err) => {
  return {
    type: METADATA_FETCH_ERROR,
    data: err
  };
};

const fetchMetadata = () => {
  return fetch("/Zika_meta");
};

export const populateMetadataStore = () => {
  return (dispatch) => {
    dispatch(requestMetadata());
    return fetchMetadata().then((res) => res.json()).then(
      (json) => dispatch(receiveMetadata(JSON.parse(json.body))),
      (err) => dispatch(metadataFetchError(err))
    );
  };
};

/* request tree */

const requestTree = () => {
  return {
    type: REQUEST_TREE
  };
};

const receiveTree = (data) => {
  return {
    type: RECEIVE_TREE,
    data: data
  };
};

const treeFetchError = (err) => {
  return {
    type: TREE_FETCH_ERROR,
    data: err
  };
};

const fetchTree = () => {
  return fetch("/Zika_tree");
};

export const populateTreeStore = () => {
  return (dispatch) => {
    dispatch(requestTree());
    return fetchTree().then((res) => res.json()).then(
      (json) => dispatch(receiveTree(JSON.parse(json.body))),
      (err) => dispatch(treeFetchError(err))
    );
  };
};

/* request sequences */

const requestSequences = () => {
  return {
    type: REQUEST_SEQUENCES
  };
};

const receiveSequences = (data) => {
  return {
    type: RECEIVE_SEQUENCES,
    data: data
  };
};

const sequencesFetchError = (err) => {
  return {
    type: SEQUENCES_FETCH_ERROR,
    data: err
  };
};

const fetchSequences = () => {
  return fetch("/Zika_sequences");
};

export const populateSequencesStore = () => {
  return (dispatch) => {
    dispatch(requestSequences());
    return fetchSequences().then((res) => res.json()).then(
      (json) => dispatch(receiveSequences(JSON.parse(json.body))),
      (err) => dispatch(sequencesFetchError(err))
    );
  };
};

/* request frequencies */

const requestFrequencies = () => {
  return {
    type: REQUEST_FREQUENCIES
  };
};

const receiveFrequencies = (data) => {
  return {
    type: RECEIVE_FREQUENCIES,
    data: data
  };
};

const frequenciesFetchError = (err) => {
  return {
    type: FREQUENCIES_FETCH_ERROR,
    data: err
  };
};

const fetchFrequencies = () => {
  return fetch("/Zika_frequencies");
};

export const populateFrequenciesStore = () => {
  return (dispatch) => {
    dispatch(requestFrequencies());
    return fetchFrequencies().then((res) => res.json()).then(
      (json) => dispatch(receiveFrequencies(JSON.parse(json.body))),
      (err) => dispatch(frequenciesFetchError(err))
    );
  };
};
