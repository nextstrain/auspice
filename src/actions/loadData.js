import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress, enableNarratives } from "../util/globals";
import { errorNotification } from "./notifications";
import { getManifest } from "../util/clientAPIInterface";
import { getNarrative } from "../util/getMarkdown";
import { changePage } from "./navigation";
import { processFrequenciesJSON } from "./frequencies";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { createDatapathForSecondSegment } from "../util/parseParams";

export const loadJSONs = (s3override = undefined) => {
  return (dispatch, getState) => {
    const { datasets } = getState();
    if (!datasets.availableDatasets) {
      console.error("Attempted to fetch JSONs before Charon returned initial data.");
      return;
    }
    dispatch({type: types.DATA_INVALID});
    const query = queryString.parse(window.location.search);
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    const apiPath = (datapath, jsonType) =>
      `${charonAPIAddress}request=json&path=${datapath}_${jsonType}.json&s3=${s3bucket}`;
    const promises = [
      fetch(apiPath(datasets.datapath, "meta")).then((res) => res.json()), /* META */
      fetch(apiPath(datasets.datapath, "tree")).then((res) => res.json()) /* TREE */
    ];
    if (query.tt) { /* SECOND TREE */
      const secondPath = createDatapathForSecondSegment(query.tt, datasets.datapath, datasets.availableDatasets);
      if (secondPath) {
	promises.push(fetch(apiPath(secondPath, "tree")).then((res) => res.json()));
      }
    }
    Promise.all(promises)
      .then((values) => {
        /* we do expensive stuff here not reducers. Allows fewer dispatches. */
	const JSONs = {meta: values[0], tree: values[1]};
	if (values.length === 3) JSONs.treeToo = values[2];
	const newStates = createStateFromQueryOrJSONs({JSONs, query});
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
  fetch(apiCall)
    .then((res) => res.json())
    .then((res) => {
      const treeTooState = createTreeTooState(
	{treeTooJSON: res, oldState: getState()}
      );
      dispatch({ type: types.TREE_TOO_DATA, treeTooState, segment: name});
    })
    .catch((err) => {
      console.error("Error while loading second tree", err);
    });
};
