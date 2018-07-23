import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { getDatapath, goTo404, chooseDisplayComponentFromPathname, makeDataPathFromPathname } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import parseParams, { createDatapathForSecondSegment } from "../util/parseParams";
import { loadFrequencies } from "./frequencies";

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
  const requestJSONPath = window.location.pathname; // .slice(1).replace(/_/g, "/");
  const apiPath = (jsonType) => `${charonAPIAddress}request=json&want=${requestJSONPath}&type=${jsonType}`;


  // const treeName = getSegmentName(datasets.datapath, datasets.availableDatasets);
  if (query.tt) { /* SECOND TREE */
    console.warn("SECOND TREE TODO -- SERVER SHOULD ADD IT TO THE TREE/UNIFIED JSON");
  }
  Promise.all([fetch(apiPath("meta")).then((res) => res.json()), fetch(apiPath("tree")).then((res) => res.json())])
    .then((values) => {
      const data = {JSONs: {meta: values[0], tree: values[1]}, query};
      if (narrativeJSON) {
        data.JSONs.narrative = narrativeJSON;
      }
      dispatch({
        type: types.CLEAN_START,
        ...createStateFromQueryOrJSONs(data)
      });
      return {frequencies: (data.JSONs.meta.panels && data.JSONs.meta.panels.indexOf("frequencies") !== -1)};
    })
    .then((result) => {
      if (result.frequencies === true) {
        fetch(apiPath("tip-frequencies"))
          .then((res) => res.json())
          .then((res) => dispatch(loadFrequencies(res)))
          .catch((err) => console.error("Frequencies failed to fetch", err.message));
      }
      return false;
    })
    .catch((err) => {
      console.error(err.message);
      dispatch(goTo404(`Couldn't load JSONs for ${requestJSONPath}`));
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
