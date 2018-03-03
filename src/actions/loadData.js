import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress, enableNarratives } from "../util/globals";
import { errorNotification } from "./notifications";
import { getManifest } from "../util/clientAPIInterface";
import { getNarrative } from "../util/getMarkdown";
import { changePage } from "./navigation";
import { processFrequenciesJSON } from "./frequencies";
import { createStateFromQueryOrJSONs } from "./recomputeReduxState";

export const loadJSONs = (s3override = undefined) => {
  return (dispatch, getState) => {
    const { datasets } = getState();
    if (!datasets.availableDatasets) {
      console.error("Attempted to fetch JSONs before Charon returned initial data.");
      return;
    }
    dispatch({type: types.DATA_INVALID});
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    const apiPath = (jsonType) =>
      `${charonAPIAddress}request=json&path=${datasets.datapath}_${jsonType}.json&s3=${s3bucket}`;

    const metaJSONpromise = fetch(apiPath("meta")).then((res) => res.json());
    const treeJSONpromise = fetch(apiPath("tree")).then((res) => res.json());
    Promise.all([metaJSONpromise, treeJSONpromise])
      .then((values) => {
        /* we do expensive stuff here not reducers. Allows fewer dispatches. */
        const query = queryString.parse(window.location.search);
        const newStates = createStateFromQueryOrJSONs(
          {JSONs: {meta: values[0], tree: values[1]}, query}
        );
        dispatch({ type: types.CLEAN_START, ...newStates });

        /* F R E Q U E N C I E S */
        if (values[0].panels.indexOf("frequencies") !== -1) {
          fetch(apiPath("tip-frequencies"))
            .then((res) => res.json())
            .then((rawJSON) => {
              const freqData = processFrequenciesJSON(rawJSON, newStates.tree, newStates.controls);
              dispatch({ type: types.INITIALISE_FREQUENCIES, ...freqData });
            })
            .catch((err) => {
              console.warn("Problem fetching / processing frequencies JSON:", err);
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

export const loadTreeToo = (name, path) => (dispatch, getState) => {
  const { datasets } = getState();
  const apiCall = `${charonAPIAddress}request=json&path=${path}_tree.json&s3=${datasets.s3bucket}`;
  console.log("request to load treeToo", name, path, apiCall);
  fetch(apiCall)
    .then((res) => res.json())
    .then((res) => {
      console.log("JSON BACK!", res)
    })
    .catch((err) => {
      console.error("Error while loading second tree", err);
    });
};
