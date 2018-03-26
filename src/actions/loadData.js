import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
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

    const promisesOrder = ["meta", "tree", "frequencies"];
    const promises = [
      fetch(apiPath("meta")).then((res) => res.json()),
      fetch(apiPath("tree")).then((res) => res.json()),
      fetch(apiPath("tip-frequencies")).then((res) => res.json())
    ];
    /* add promises according to the URL */
    const query = queryString.parse(window.location.search);
    if (query.n) { /* narrative */
      promisesOrder.push("narrative");
      promises.push(
        fetch(`${charonAPIAddress}request=narrative&name=${datasets.datapath.replace(/^\//, '').replace(/\//, '_')}`)
          .then((res) => res.json())
          // don't need to catch - it'll be handled in the promises.map below
      );
    }
    Promise.all(promises.map((promise) => promise.catch(() => undefined)))
      .then((values) => {
        // all promises have not resolved or rejected (value[x] = undefined upon rejection)
        // you must check for undefined here, they won't go to the following catch
        const data = {JSONs: {}, query};
        values.forEach((v, i) => {
          if (v) data.JSONs[promisesOrder[i]] = v; // if statement removes undefinds
        });
        console.log(data);
        if (!(data.JSONs.meta && data.JSONs.tree)) {
          console.error("Tree & Meta JSONs could not be loaded.");
          dispatch(changePage({path: "/", push: false}));
          return;
        }
        dispatch({
          type: types.CLEAN_START,
          ...createStateFromQueryOrJSONs(data)
        });
      })
      .catch((err) => {
        // some coding error in handling happened. This is not the rejection of the promise you think it is!
        console.error("Code error. This should not happen.", err);
      });


    // Promise.all([metaJSONpromise, treeJSONpromise])
    //   .then((values) => {
    //     /* we do expensive stuff here not reducers. Allows fewer dispatches. */
    //     const query = queryString.parse(window.location.search);
    //     const newStates = createStateFromQueryOrJSONs(
    //       {JSONs: {meta: values[0], tree: values[1]}, query}
    //     );
    //     dispatch({ type: types.CLEAN_START, ...newStates });
    //
    //     /* F R E Q U E N C I E S */
    //     if (values[0].panels.indexOf("frequencies") !== -1) {
    //       fetch(apiPath("tip-frequencies"))
    //         .then((res) => res.json())
    //         .then((rawJSON) => {
    //           const freqData = processFrequenciesJSON(rawJSON, newStates.tree, newStates.controls);
    //           dispatch({ type: types.INITIALISE_FREQUENCIES, ...freqData });
    //         })
    //         .catch((err) => {
    //           console.warn("Problem fetching / processing frequencies JSON:", err);
    //         });
    //     }
    //
    //     /* N A R R A T I V E S */
    //     if (enableNarratives) {
    //       getNarrative(dispatch, datasets.datapath);
    //     }
    //   })
    //   .catch((err) => {
    //     /* note that this catches both 404 type errors AND
    //     any error from the reducers AND, confusingly,
    //     errors from the lifecycle methods of components
    //     that run while in the middle of this thunk */
    //     dispatch(errorNotification({
    //       message: "Couldn't load dataset " + datasets.datapath
    //     }));
    //     console.error("loadMetaAndTreeJSONs error:", err);
    //     dispatch(changePage({path: "/", push: false}));
    //   });
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
