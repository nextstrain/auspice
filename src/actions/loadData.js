import queryString from "query-string";
import * as types from "./types";
import { charonAPIAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON } from "../util/serverInteraction";
import { warningNotification } from "./notifications";
import { hasExtension, getExtension } from "../util/extensions";


/* TODO: make a default auspice server (not charon) and make charon the nextstrain server. Or vice versa. */
const serverAddress = hasExtension("serverAddress") ? getExtension("serverAddress") : charonAPIAddress;

/**
 * Sends a GET request to the `/charon` web API endpoint requesting data.
 * Throws an `Error` if the response is not successful or is not a redirect.
 *
 * Returns a `Promise` containing the `Response` object. JSON data must be
 * accessed from the `Response` object using the `.json()` method.
 *
 * @param {String} prefix: the main dataset information pertaining to the query,
 *  e.g. 'flu'
 * @param {Object} additionalQueries: additional information to be parsed as a
 *  query string such as `type` (`String`) or `narrative` (`Boolean`).
 */
const getDatasetFromCharon = (prefix, {type, narrative=false}={}) => {
  let path = `${serverAddress}/${narrative?"getNarrative":"getDataset"}`;
  path += `?prefix=${prefix}`;
  if (type) path += `&type=${type}`;
  const p = fetch(path)
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(res.statusText);
      }
      return res;
    });
  return p;
};

/**
 * Requests data from a hardcoded web API endpoint.
 * Throws an `Error` if the response is not successful.
 *
 * Returns a `Promise` containing the `Response` object. JSON data must be
 * accessed from the `Response` object using the `.json()` method.
 *
 * Note: we currently expect a single dataset to be present in "hardcodedDataPaths".
 * This may be extended to multiple in the future...
 *
 * @param {String} prefix: the main dataset information pertaining to the query,
 *  e.g. 'flu'
 * @param {Object} additionalQueries: additional information to be parsed as a
 *  query string such as `type` (`String`) or `narrative` (`Boolean`).
 */
const getHardcodedData = (prefix, {type="mainJSON", narrative=false}={}) => {
  const datapaths = getExtension("hardcodedDataPaths");
  console.log("FETCHING", datapaths[type]);
  const p = fetch(datapaths[type])
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(res.statusText);
      }
      return res;
    });
  return p;
};

// const fetchData = hasExtension("hardcodedDataPaths") ? getHardcodedData : getDatasetFromCharon;
const getDataset = hasExtension("hardcodedDataPaths") ? getHardcodedData : getDatasetFromCharon;

/**
 * given a url to fetch, check if a second tree is defined.
 * e.g. `ha:na`. If so, then we want to make two fetches,
 * one for `ha` and one for `na`.
 *
 * Once upon a time one could specify a second tree via a `?tt=tree_name` query
 * we interpret this here for backwards compatablity.
 *
 * @returns {Array} [0] {string} url, modified as needed to represent main tree
 *                  [1] {object| undefined} secondTree information, if applicable
 *                  [1].url {string | undefined} the url to fetch the 2nd tree
 *                  [1].name {string} name of the 2nd tree
 *                  [1].mainTreeName {string | undefined} name of the main tree
 */
const processSecondTree = (url, query) => {
  let secondTree;
  if (url.includes(":")) {
    const parts = url.replace(/^\//, '')
      .replace(/\/$/, '')
      .split("/");
    for (let i=0; i<parts.length; i++) {
      if (parts[i].indexOf(":") !== -1) {
        const [treeName, secondTreeName] = parts[i].split(":");
        parts[i] = treeName;
        url = parts.join("/"); // this is the first tree URL
        parts[i] = secondTreeName;
        secondTree = {
          url: parts.join("/"), // this is the 2nd tree URL
          name: secondTreeName,
          mainTreeName: treeName
        };
        break;
      }
    }
  } else if (query.tt) {
    secondTree = {url: undefined, name: query.tt, mainTreeName: undefined};
  }
  return [url, secondTree];
};

const fetchDataAndDispatch = async (dispatch, url, query, narrativeBlocks) => {
  let secondTree;
  [url, secondTree] = processSecondTree(url, query);

  /* fetch the main JSON + the [main] JSON of a second tree if applicable */
  let mainJson;
  try {
    const response = await getDataset(`${url}`);
    mainJson = await response.json();
    if (secondTree) {
      if (!secondTree.url) {
        if (!mainJson.tree_name) throw new Error("Can't fetch second tree if main tree is unnamed");
        secondTree.url = url.replace(mainJson.tree_name, secondTree.name);
      }
      const secondTreeJson = await getDataset(secondTree.url)
        .then((res) => res.json());
      mainJson.treeTwo = secondTreeJson.tree;
      /* TO DO -- we used to fetch both trees at once, and the server would provide
       * the following info accordingly. This required `recomputeReduxState` to be
       * overly complicated. Since we have 2 fetches, could we simplify things
       * and make `recomputeReduxState` for the first tree followed by another
       * state recomputation? */
      if (!mainJson.tree_name) mainJson.tree_name = secondTree.mainTreeName; // TO DO
      mainJson._treeTwoName = secondTree.name; // TO DO
    }

    dispatch({
      type: types.CLEAN_START,
      ...createStateFromQueryOrJSONs({json: mainJson, query, narrativeBlocks})
    });

  } catch (err) {
    console.error(err, err.message);
    dispatch(goTo404(`Couldn't load JSONs for ${url}`));
    return;
  }

  /* do we have frequencies to display? */
  if (mainJson.meta.panels && mainJson.meta.panels.indexOf("frequencies") !== -1) {
    try {
      const frequencyData = await getDataset(url, {type: "tip-frequencies"})
        .then((res) => res.json());
      dispatch(loadFrequencies(frequencyData));
    } catch (err) {
      console.error("Failed to fetch frequencies", err.message)
      dispatch(warningNotification({message: "Failed to fetch frequencies"}));
    }
  }

  /* Get available datasets -- this is needed for the sidebar dataset-change dropdowns etc */
  try {
    const availableDatasets = await fetchJSON(`${charonAPIAddress}/getAvailable?prefix=${window.location.pathname}`)
    dispatch({type: types.SET_AVAILABLE, data: availableDatasets});
  } catch (err) {
    console.error("Failed to fetch available datasets", err.message)
    dispatch(warningNotification({message: "Failed to fetch available datasets"}));
  }

};

export const loadSecondTree = (name, fields) => async (dispatch, getState) => {
  let secondJson;
  try {
    secondJson = await getDataset(fields.join("/"))
      .then((res) => res.json());
  } catch (err) {
    console.error("Failed to fetch additional tree", err.message);
    dispatch(warningNotification({message: "Failed to fetch second tree"}));
    return;
  }
  const oldState = getState();
  const newState = createTreeTooState({treeTooJSON: secondJson.tree, oldState, segment: name});
  dispatch({type: types.TREE_TOO_DATA, segment: name, ...newState});
};


export const loadJSONs = ({url = window.location.pathname, search = window.location.search} = {}) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID});
    }
    const query = queryString.parse(search);

    if (url.indexOf("narratives") !== -1) {
      /* we want to have an additional fetch to get the narrative JSON, which in turn
      tells us which data JSON to fetch... */
      getDatasetFromCharon(url, {narrative: true})
        .then((res) => res.json())
        .then((blocks) => {
          const firstURL = blocks[0].dataset;
          const firstQuery = queryString.parse(blocks[0].query);
          if (query.n) firstQuery.n = query.n;
          fetchDataAndDispatch(dispatch, firstURL, firstQuery, blocks);
        })
        .catch((err) => {
          console.error("Error obtaining narratives", err.message);
          dispatch(goTo404(`Couldn't load narrative for ${url}`));
        });
    } else {
      fetchDataAndDispatch(dispatch, url, query);
    }
  };
};
