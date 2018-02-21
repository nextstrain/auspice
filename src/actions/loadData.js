import queryString from "query-string";
import * as types from "./types";
import { changeColorBy } from "./colors";
import { updateVisibleTipsAndBranchThicknesses } from "./treeProperties";
import { charonAPIAddress, enableNarratives } from "../util/globals";
import { errorNotification } from "./notifications";
import { getManifest } from "../util/clientAPIInterface";
import { getNarrative } from "../util/getMarkdown";
import { updateEntropyVisibility } from "./entropy";
import { changePage } from "./navigation";
import { updateFrequencyData } from "./frequencies";

export const loadJSONs = (s3override = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    const { datasets } = getState();
    if (!datasets.availableDatasets) {
      console.error("Attempted to fetch JSONs before Charon returned initial data.");
      return;
    }
    dispatch({type: types.DATA_INVALID});
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    const metaJSONpromise = fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_meta.json&s3=" + s3bucket)
      .then((res) => res.json());
    const treeJSONpromise = fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_tree.json&s3=" + s3bucket)
      .then((res) => res.json());
    Promise.all([metaJSONpromise, treeJSONpromise])
      .then((values) => {
        /* initial dispatch sets most values */
        dispatch({
          type: types.NEW_DATASET,
          meta: values[0],
          tree: values[1],
          query: queryString.parse(window.location.search)
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

        /* should we display (and therefore calculate) the entropy? */
        if (values[0].panels.indexOf("entropy") !== -1) {
          updateEntropyVisibility(dispatch, getState);
        }

        /* F R E Q U E N C I E S */
        if (values[0].panels.indexOf("frequencies") !== -1) {
          fetch(charonAPIAddress + "request=json&path=" + datasets.datapath + "_tip-frequencies.json&s3=" + s3bucket)
            .then((res) => res.json())
            .then((data) => {
              const { tree } = getState(); /* check that the tree has been updated! */
              dispatch({type: types.FREQUENCIES_JSON_DATA, data, tree});
              updateFrequencyData(dispatch, getState);
            })
            .catch((err) => {
              console.warn("problem fetching frequencies...", err);
            });
        }

        /* N A R R A T I V E S */
        if (enableNarratives) {
          getNarrative(dispatch, datasets.datapath);
        }

      })
      .catch((err) => {
        /* note that this catches both 404 type errors AND
        any error from the reducers AND, confusingly,
        errors from the lifecycle methods of components
        that run while in the middle of this thunk */
        dispatch(errorNotification({
          message: "Couldn't load dataset " + datasets.datapath
        }));
        console.error("loadMetaAndTreeJSONs error:", err);
        dispatch(changePage({path: "/", push: false}));
      });
  };
};

export const changeS3Bucket = () => {
  return (dispatch, getState) => {
    const {datasets} = getState();
    const newBucket = datasets.s3bucket === "live" ? "staging" : "live";
    // 1. re-fetch the manifest
    getManifest(dispatch, newBucket);
    // 2. this can *only* be toggled through the app, so we must reload data
    dispatch(loadJSONs(newBucket));
  };
};
