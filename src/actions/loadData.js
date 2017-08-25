/*eslint dot-notation: 0*/
/*eslint-env browser*/
/*eslint no-console: 0*/
import { updateColors } from "./colors";
import { dataURLStem } from "../util/datasets";
import * as types from "./types";
import { updateVisibleTipsAndBranchThicknesses } from "./treeProperties";
import { turnURLtoDataPath } from "../util/urlHelpers";
import queryString from "query-string";

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
  return (dispatch) => {
    const entropyJSONpromise = fetch(paths.entropy)
      .then((res) => res.json());
    entropyJSONpromise
      .then((data) => {
        dispatch({
          type: types.RECEIVE_ENTROPY,
          data: data
        });
      })
      .catch((err) => {
        /* entropy reducer has already been invalidated */
        console.log("entropyJSONpromise error", err);
      });
  };
};

const loadMetaAndTreeAndSequencesJSONs = (paths, router) => {
  return (dispatch) => {
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
        dispatch(updateColors());
        /* validate the reducers */
        dispatch({type: types.DATA_VALID});
      })
      .catch((err) => {
        /* note that this catches both 404 type errors AND
        any error from the reducers AND, confusingly,
        errors from the lifecycle methods of components
        that run while in the middle of this thunk */
        console.log("loadMetaAndTreeJSONs error:", err);
        // dispatch error notification
        // but, it would seem, you can't have the reducer return AND
        // also get a notification dispatched :(
      });
  };
};

export const loadJSONs = (router) => {
  return (dispatch) => {
    dispatch({type: types.DATA_INVALID});
    const data_path = turnURLtoDataPath(router);
    const JSONpaths = {
      meta: dataURLStem + data_path + "_meta.json",
      tree: dataURLStem + data_path + "_tree.json",
      seqs: dataURLStem + data_path + "_sequences.json",
      entropy: dataURLStem + data_path + "_entropy.json"
    };
    dispatch(loadMetaAndTreeAndSequencesJSONs(JSONpaths, router));
    /* subsequent JSON loading is *not* essential to the main functionality */
    /* while nextstrain is limited to ebola & zika, frequencies are not needed */
    // dispatch(populateFrequenciesStore(data_path));
    dispatch(populateEntropyStore(JSONpaths));
  };
};
