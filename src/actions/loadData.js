import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { getDatapath, goTo404, chooseDisplayComponentFromPathname, makeDataPathFromPathname } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import parseParams, { createDatapathForSecondSegment } from "../util/parseParams";

export const getManifest = (dispatch, s3bucket = "live") => {
  const charonErrorHandler = () => {
    console.warn("Failed to get manifest JSON from server");

    const datapath = makeDataPathFromPathname(window.location.pathname);

    dispatch({type: types.PROCEED_SANS_MANIFEST, datapath});
  };
  const processData = (data) => {
    const datasets = JSON.parse(data);
    // console.log("SERVER API REQUEST RETURNED:", datasets);
    const availableDatasets = {pathogen: datasets.pathogen};
    const datapath = chooseDisplayComponentFromPathname(window.location.pathname) === "app" ?
      getDatapath(window.location.pathname, availableDatasets) :
      undefined;
    dispatch({
      type: types.MANIFEST_RECEIVED,
      s3bucket,
      splash: datasets.splash,
      availableDatasets,
      user: "guest",
      datapath
    });
  };

  /* who am i? */
  const query = queryString.parse(window.location.search);
  const user = Object.keys(query).indexOf("user") === -1 ? "guest" : query.user;

  const xmlHttp = new XMLHttpRequest();
  xmlHttp.onload = () => {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      processData(xmlHttp.responseText);
    } else {
      charonErrorHandler();
    }
  };
  xmlHttp.onerror = charonErrorHandler;
  xmlHttp.open("get", `${charonAPIAddress}request=manifest&user=${user}&s3=${s3bucket}`, true); // true for asynchronous
  xmlHttp.send(null);
};

const getSegmentName = (datapath, availableDatasets) => {
  /* this code is duplicated too many times. TODO */
  if (!availableDatasets || !datapath) {
    return undefined;
  }

  const paramFields = parseParams(datapath, availableDatasets).dataset;
  const fields = Object.keys(paramFields).sort((a, b) => paramFields[a][0] > paramFields[b][0]);
  const choices = fields.map((d) => paramFields[d][1]);
  let level = availableDatasets;
  for (let vi = 0; vi < fields.length; vi++) {
    if (choices[vi]) {
      const options = Object.keys(level[fields[vi]]).filter((d) => d !== "default");
      if (Object.keys(level).indexOf("segment") !== -1 && options.length > 1) {
        return choices[vi];
      }
      // move to the next level in the data set hierarchy
      level = level[fields[vi]][choices[vi]];
    }
  }
  return undefined;
};


const fetchDataAndDispatch = (dispatch, datasets, query, s3bucket, narrativeJSON) => {
  const apiPath = (jsonType) =>
    `${charonAPIAddress}request=json&path=${datasets.datapath}_${jsonType}.json&s3=${s3bucket}`;

  const promisesOrder = ["meta", "tree", "frequencies"];
  const treeName = getSegmentName(datasets.datapath, datasets.availableDatasets);
  const promises = [
    fetch(apiPath("meta")).then((res) => res.json()),
    fetch(apiPath("tree")).then((res) => res.json()),
    fetch(apiPath("tip-frequencies")).then((res) => res.json())
  ];
  /* add promises according to the URL */
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
      const data = {JSONs: {}, query, treeName};
      values.forEach((v, i) => {
        if (v) data.JSONs[promisesOrder[i]] = v; // if statement removes undefinds
      });
      if (!data.JSONs.tree) {
        console.error("Tree JSON could not be loaded.");
        dispatch(goTo404(`
          Auspice attempted to load JSONs for the dataset "${datasets.datapath.replace(/_/g, '/')}", but they couldn't be found.
        `));
        return;
      }
      if (narrativeJSON) {
        data.JSONs.narrative = narrativeJSON;
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

const fetchNarrativesAndDispatch = (dispatch, datasets, query, s3bucket) => {
  fetch(`${charonAPIAddress}request=narrative&name=${datasets.datapath.replace(/^\//, '').replace(/\//, '_').replace(/narratives_/, '')}`)
    .then((res) => res.json())
    .then((blocks) => {
      const newDatasets = {...datasets};
      newDatasets.datapath = getDatapath(blocks[0].dataset, datasets.availableDatasets);
      fetchDataAndDispatch(dispatch, newDatasets, query, s3bucket, blocks);
    })
    .catch((err) => {
      // some coding error in handling happened. This is not the rejection of the promise you think it is!
      // syntax error is akin to a 404
      console.error("Error in fetchNarrativesAndDispatch", err);
    });

};

export const loadJSONs = (s3override = undefined) => {
  return (dispatch, getState) => {
    const { datasets, tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID});
    }
    const query = queryString.parse(window.location.search);
    const s3bucket = s3override ? s3override : datasets.s3bucket;
    if (datasets.datapath.startsWith("narrative")) {
      fetchNarrativesAndDispatch(dispatch, datasets, query, s3bucket);
    } else {
      fetchDataAndDispatch(dispatch, datasets, query, s3bucket, false);
    }
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
