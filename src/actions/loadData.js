/*eslint dot-notation: 0*/
import { updateColorScale, updateNodeColors } from "./colors";
import { dataURLStem } from "../util/globals";
import * as types from "./types";
import d3 from "d3";

/* if the metadata specifies an analysis slider, this is where we process it */
const addAnalysisSlider = () => {
  return (dispatch, getState) => {
    const { controls, tree } = getState();
    if (controls.analysisSlider && tree.loadStatus === 2) {
      /* we can now get the range of values for the analysis slider */
      const vals = tree.nodes.map((d) => d.attr[controls.analysisSlider.key])
        .filter((n) => n !== undefined)
        .filter((item, i, ar) => ar.indexOf(item) === i);
      /* check that the key is found in at least some nodes */
      if (!vals.length) {
        dispatch({
          type: types.ANALYSIS_SLIDER,
          destroy: true
        });
        /* dispatch warning / error message */
        console.log("Analysis slider key ", controls.analysisSlider.key, " never found in tree. Skipping.");
        return null;
      }
      dispatch({
        type: types.ANALYSIS_SLIDER,
        destroy: false,
        maxVal: Math.round(d3.max(vals) * 100) / 100,
        minVal: Math.round(d3.min(vals) * 100) / 100
      });
    }
    return null;
  };
};


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
        dispatch(addAnalysisSlider());
        dispatch(updateColorScale());
        dispatch(updateNodeColors());
      },
      (err) => dispatch(metadataFetchError(err))
    );
  };
};

const updateGeoResolution = (rootNodeAttrs) => {
  let resolution = null;
  if (rootNodeAttrs.division) {
    resolution = 'division';
  } else if (rootNodeAttrs.country) {
        resolution = 'country';
  }
  else if (rootNodeAttrs.region) {
    resolution = 'region';
  }
 return { type: CHANGE_GEO_RESOLUTION,
   data: resolution };
}

/* request tree */

const requestTree = () => {
  return {
    type: types.REQUEST_TREE
  };
};

const receiveTree = (data, controls) => {
  console.log("receive tree action being dispatched")
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
        dispatch(addAnalysisSlider());
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
