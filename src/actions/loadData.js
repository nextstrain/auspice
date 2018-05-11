import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { getManifest } from "../util/clientAPIInterface";
import { goTo404 } from "./navigation";
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
    const apiPath = (jsonType) =>
      `${charonAPIAddress}request=json&path=${datasets.datapath}_${jsonType}.json&s3=${s3bucket}`;

    const promisesOrder = ["meta", "tree", "frequencies"];
    const promises = [
      fetch(apiPath("meta")).then((res) => res.json()),
      fetch(apiPath("tree")).then((res) => res.json()),
      fetch(apiPath("tip-frequencies")).then((res) => res.json())
    ];
    /* add promises according to the URL */
    if (query.n) { /* narrative */
      promisesOrder.push("narrative");
      promises.push(
        fetch(`${charonAPIAddress}request=narrative&name=${datasets.datapath.replace(/^\//, '').replace(/\//, '_')}`)
          .then((res) => res.json())
          // don't need to catch - it'll be handled in the promises.map below
      );
    }
    if (query.tt) { /* SECOND TREE */
      const secondPath = createDatapathForSecondSegment(query.tt, datasets.datapath, datasets.availableDatasets);
      if (secondPath) {
        promisesOrder.push("treeToo");
        promises.push(
          fetch(`${charonAPIAddress}request=json&path=${secondPath}_tree.json&s3=${s3bucket}`)
            .then((res) => res.json())
            // don't need to catch - it'll be handled in the promises.map below
        );
        // promises.push(fetch(secondPath).then((res) => res.json()));
      }
    }
    Promise.all(promises.map((promise) => promise.catch(() => undefined)))
      .then((values) => {
        // all promises have not resolved or rejected (value[x] = undefined upon rejection)
        // you must check for undefined here, they won't go to the following catch
        const data = {JSONs: {}, query};
        values.forEach((v, i) => {
          if (v) data.JSONs[promisesOrder[i]] = v; // if statement removes undefinds
        });
        // console.log(data);
        if (!(data.JSONs.meta && data.JSONs.tree)) {
          console.error("Tree & Meta JSONs could not be loaded.");
          dispatch(goTo404(`
            Auspice attempted to load JSONs for the dataset "${datasets.datapath.replace(/_/, '/')}", but they couldn't be found.
          `));
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
      const newState = createTreeTooState(
        {treeTooJSON: res, oldState: getState(), segment: name}
      );
      dispatch({ type: types.TREE_TOO_DATA, treeToo: newState.treeToo, controls: newState.controls, segment: name});
    })
    .catch((err) => {
      console.error("Error while loading second tree", err);
    });
};
