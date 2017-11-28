import queryString from "query-string";
import * as types from "./types";
import { changeColorBy } from "./colors";
import { updateVisibleTipsAndBranchThicknesses } from "./treeProperties";
import { turnURLtoDataPath } from "../util/urlHelpers";
import { charonAPIAddress, enableNarratives } from "../util/globals";
import { errorNotification } from "./notifications";
import { getManifest } from "../util/clientAPIInterface";
import { getNarrative } from "../util/getNarrative";
import { updateEntropyVisibility } from "./entropy";

// /* if the metadata specifies an analysis slider, this is where we process it */
// const addAnalysisSlider = (dispatch, tree, controls) => {
//   /* we can now get the range of values for the analysis slider */
//   const vals = tree.nodes.map((d) => d.attr[controls.analysisSlider.key])
//     .filter((n) => n !== undefined)
//     .filter((item, i, ar) => ar.indexOf(item) === i);
//   /* check that the key is found in at least some nodes */
//   if (!vals.length) {
//     dispatch({
//       type: types.ANALYSIS_SLIDER,
//       destroy: true
//     });
//     /* dispatch warning / error message */
//     console.log("Analysis slider key ", controls.analysisSlider.key, " never found in tree. Skipping.");
//   } else {
//     dispatch({
//       type: types.ANALYSIS_SLIDER,
//       destroy: false,
//       maxVal: Math.round(d3.max(vals) * 100) / 100,
//       minVal: Math.round(d3.min(vals) * 100) / 100
//     });
//   }
// };

// /* request frequencies */
// const requestFrequencies = () => {
//   return {
//     type: types.REQUEST_FREQUENCIES
//   };
// };
//
// const receiveFrequencies = (data) => {
//   return {
//     type: types.RECEIVE_FREQUENCIES,
//     data: data
//   };
// };
//
// const frequenciesFetchError = (err) => {
//   return {
//     type: types.FREQUENCIES_FETCH_ERROR,
//     data: err
//   };
// };
//
// const fetchFrequencies = (q) => {
//   return fetch(
//     dataURLStem + q + "_frequencies.json"
//   );
// };
//
// const populateFrequenciesStore = (queryParams) => {
//   return (dispatch) => {
//     dispatch(requestFrequencies());
//     return fetchFrequencies(queryParams).then((res) => res.json()).then(
//       (json) => dispatch(receiveFrequencies(json)),
//       (err) => dispatch(frequenciesFetchError(err))
//     );
//   };
// };

const populateEntropyStore = (paths) => {
  return (dispatch, getState) => {
    const { controls } = getState();
    const entropyJSONpromise = fetch(paths.entropy)
      .then((res) => res.json());
    entropyJSONpromise
      .then((data) => {
        dispatch({
          type: types.RECEIVE_ENTROPY,
          mutType: controls.mutType,
          data: data
        });
        updateEntropyVisibility(dispatch, getState);
      })
      .catch((err) => {
        /* entropy reducer has already been invalidated */
        console.error("entropyJSONpromise error", err);
      });
  };
};

export const loadJSONs = (router, s3override = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {

    const { datasets } = getState();
    if (!datasets.ready) {
      console.error("Attempted to fetch JSONs before Charon returned initial data.");
      return;
    }

    dispatch({type: types.DATA_INVALID});
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    const data_path = turnURLtoDataPath(router, {pathogen: datasets.pathogen});
    const paths = {
      meta: charonAPIAddress + "request=json&path=" + data_path + "_meta.json&s3=" + s3bucket,
      tree: charonAPIAddress + "request=json&path=" + data_path + "_tree.json&s3=" + s3bucket,
      seqs: charonAPIAddress + "request=json&path=" + data_path + "_sequences.json&s3=" + s3bucket,
      entropy: charonAPIAddress + "request=json&path=" + data_path + "_entropy.json&s3=" + s3bucket
    };
    const metaJSONpromise = fetch(paths.meta)
      .then((res) => res.json());
    const treeJSONpromise = fetch(paths.tree)
      .then((res) => res.json());
    const seqsJSONpromise = fetch(paths.seqs)
      .then((res) => res.json());
    Promise.all([metaJSONpromise, treeJSONpromise, seqsJSONpromise])
      .then((values) => {
        /* initial dispatch sets most values */
        dispatch({
          type: types.NEW_DATASET,
          datasetPathName: router.history.location.pathname,
          meta: values[0],
          tree: values[1],
          seqs: values[2],
          query: queryString.parse(router.history.location.search)
        });
        /* add analysis slider (if applicable) */
        // revisit this when applicable
        // if (controls.analysisSlider) {
        //   const {controls, tree} = getState(); // reflects updated data
        //   addAnalysisSlider(dispatch, tree, controls);
        // }
        /* there still remain a number of actions to do with calculations */
        dispatch(updateVisibleTipsAndBranchThicknesses());
        dispatch(changeColorBy()); // sets colorScales etc
        /* validate the reducers */
        dispatch({type: types.DATA_VALID});

        /* now load the secondary things */
        if (values[0].panels.indexOf("entropy") !== -1) {
          dispatch(populateEntropyStore(paths));
        }
        if (enableNarratives) {
          getNarrative(dispatch, router.history.location.pathname);
        }

      })
      .catch((err) => {
        /* note that this catches both 404 type errors AND
        any error from the reducers AND, confusingly,
        errors from the lifecycle methods of components
        that run while in the middle of this thunk */
        dispatch(errorNotification({
          message: "Couldn't load " + router.history.location.pathname.replace(/^\//, '') + " dataset"
        }));
        console.error("loadMetaAndTreeJSONs error:", err);
        router.history.push({pathname: '/', search: ''});
      });
  };
};

export const urlQueryChange = (query) => {
  return (dispatch, getState) => {
    const { controls, metadata } = getState();
    dispatch({
      type: types.URL_QUERY_CHANGE,
      query,
      metadata
    });
    const newState = getState();
    /* working out whether visibility / thickness needs updating is tricky */
    dispatch(updateVisibleTipsAndBranchThicknesses());
    if (controls.colorBy !== newState.controls.colorBy) {
      dispatch(changeColorBy());
    }
  };
};


export const changeS3Bucket = (router) => {
  return (dispatch, getState) => {
    const {datasets} = getState();
    const newBucket = datasets.s3bucket === "live" ? "staging" : "live";
    // 1. re-fetch the manifest
    getManifest(router, dispatch, newBucket);
    // 2. this can *only* be toggled through the app, so we must reload data
    dispatch(loadJSONs(router, newBucket));
  };
};
