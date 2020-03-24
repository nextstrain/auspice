import queryString from "query-string";
import * as types from "./types";
import { getServerAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON } from "../util/serverInteraction";
import { warningNotification, errorNotification } from "./notifications";
import { hasExtension, getExtension } from "../util/extensions";


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
  let path = `${getServerAddress()}/${narrative?"getNarrative":"getDataset"}`;
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
const getHardcodedData = (prefix, {type="mainJSON"}={}) => {
  const datapaths = getExtension("hardcodedDataPaths");

  const p = fetch(datapaths[type])
    .then((res) => {
      if (res.status !== 200) {
        throw new Error(res.statusText);
      }
      return res;
    });
  return p;
};

const getDataset = hasExtension("hardcodedDataPaths") ? getHardcodedData : getDatasetFromCharon;

/**
 * given a url, which dataset fetches should be made?
 * If a second tree is defined - e.g.
 * `flu/seasonal/h3n2/ha/2y:flu/seasonal/h3n2/na/2y`.
 * then we want to make two fetches - one for
 * `flu/seasonal/h3n2/ha/2y` and one for `flu/seasonal/h3n2/na/2y`.
 *
 * @returns {Array} [0] {string} url, modified as needed to represent main dataset
 *                  [1] {string | undefined} secondTreeUrl, if applicable
 */
const collectDatasetFetchUrls = (url) => {
  let secondTreeUrl;
  if (url.includes(":")) {
    const parts = url.replace(/^\//, '')
      .replace(/\/$/, '')
      .split(":");
    url = parts[0]; // eslint-disable-line no-param-reassign
    secondTreeUrl = parts[1];
  }
  return [url, secondTreeUrl];
};

/**
 * This is for processing a second tree using the deprecated
 * syntax of declaring second trees, e.g. `flu/seasonal/h3n2/ha:na/2y`
 * We are keeping this to allow backwards compatibility.
 *
 * given a url to fetch, check if a second tree is defined.
 * e.g. `ha:na`. If so, then we want to make two fetches,
 * one for `ha` and one for `na`.
 *
 * @returns {Array} [0] {string} url, modified as needed to represent main tree
 *                  [1] {string | undefined} secondTreeUrl
 *                  [2] {string | undefined} string of old syntax
 */
const collectDatasetFetchUrlsDeprecatedSyntax = (url) => {
  let secondTreeUrl;
  let treeName;
  let secondTreeName;
  const parts = url.replace(/^\//, '')
    .replace(/\/$/, '')
    .split("/");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].indexOf(":") !== -1) {
      [treeName, secondTreeName] = parts[i].split(":");
      parts[i] = treeName;
      // this is the first tree URL
      url = parts.join("/"); // eslint-disable-line no-param-reassign
      parts[i] = secondTreeName;
      secondTreeUrl = parts.join("/"); // this is the second tree URL
      break;
    }
  }
  return [url, secondTreeUrl, treeName.concat(":", secondTreeName)];
};

const fetchDataAndDispatch = async (dispatch, url, query, narrativeBlocks) => {
  /* Once upon a time one could specify a second tree via a `?tt=tree_name`.
  This is no longer supported, however we still display an error message. */
  if (query.tt) {
    dispatch(errorNotification({
      message: `Specifing a second tree via '?tt=${query.tt}' is no longer supported.`,
      details: "The new syntax requires the complete name for both trees. " +
        "For example, instead of 'flu/seasonal/h3n2/ha/2y?tt=na' you must " +
        "specify 'flu/seasonal/h3n2/ha/2y:flu/seasonal/h3n2/na/2y' "
    }));
  }
  let pathnameShouldBe = url; /* the pathname to display in the URL */
  let [mainDatasetUrl, secondTreeUrl] = collectDatasetFetchUrls(url);
  /* fetch the dataset JSON + the dataset JSON of a second tree if applicable */
  let datasetJson;
  let secondTreeDataset = false;
  try {
    if (!secondTreeUrl) {
      const mainDatasetResponse = await getDataset(mainDatasetUrl);
      datasetJson = await mainDatasetResponse.json();
      pathnameShouldBe = queryString.parse(mainDatasetResponse.url.split("?")[1]).prefix;
    } else {
      try {
        /* TO DO -- we used to fetch both trees at once, and the server would provide
         * the following info accordingly. This required `recomputeReduxState` to be
         * overly complicated. Since we have 2 fetches, could we simplify things
         * and make `recomputeReduxState` for the first tree followed by another
         * state recomputation? */
        const mainDatasetResponse = await getDataset(mainDatasetUrl);
        datasetJson = await mainDatasetResponse.json();
        secondTreeDataset = await getDataset(secondTreeUrl)
          .then((res) => res.json());
      } catch (e) {
        /* If the url is in the old syntax (e.g. `ha:na`) then `collectDatasetFetchUrls`
         * will return incorrect dataset URLs (perhaps for both trees)
         * In this case, we will try to parse the url again according to the old syntax
         * and try to get the dataset for the main tree and second tree again.
         * Also displays warning to the user to let them know the old syntax is deprecated. */
        let oldSyntax;
        [mainDatasetUrl, secondTreeUrl, oldSyntax] = collectDatasetFetchUrlsDeprecatedSyntax(url);
        pathnameShouldBe = `${mainDatasetUrl}:${secondTreeUrl}`;
        const mainDatasetResponse = await getDataset(mainDatasetUrl);
        datasetJson = await mainDatasetResponse.json();
        secondTreeDataset = await getDataset(secondTreeUrl)
          .then((res) => res.json());
        dispatch(warningNotification({
          message: `Specifing a second tree via "${oldSyntax}" is deprecated.`,
          details: "The url has been modified to reflect the new syntax."
        }));
      }
    }

    dispatch({
      type: types.CLEAN_START,
      pathnameShouldBe,
      ...createStateFromQueryOrJSONs({
        json: datasetJson,
        secondTreeDataset,
        query,
        narrativeBlocks,
        mainTreeName: secondTreeUrl ? mainDatasetUrl : null,
        secondTreeName: secondTreeUrl ? secondTreeUrl : null,
        dispatch
      })
    });

  } catch (err) {
    if (err.message === "No Content") { // status code 204
      /* TODO: add more helper functions for moving between pages in auspice */
      return dispatch({
        type: types.PAGE_CHANGE,
        displayComponent: "splash",
        pushState: true
      });
    }
    console.error(err, err.message);
    dispatch(goTo404(`Couldn't load JSONs for ${url}`));
    return undefined;
  }

  /* do we have frequencies to display? */
  if (datasetJson.meta.panels && datasetJson.meta.panels.indexOf("frequencies") !== -1) {
    try {
      const frequencyData = await getDataset(mainDatasetUrl, {type: "tip-frequencies"})
        .then((res) => res.json());
      dispatch(loadFrequencies(frequencyData));
    } catch (err) {
      console.error("Failed to fetch frequencies", err.message);
      dispatch(warningNotification({message: "Failed to fetch frequencies"}));
    }
  }

  /* Get available datasets -- this is needed for the sidebar dataset-change dropdowns etc */
  try {
    const availableDatasets = await fetchJSON(`${getServerAddress()}/getAvailable?prefix=${window.location.pathname}`);
    dispatch({type: types.SET_AVAILABLE, data: availableDatasets});
  } catch (err) {
    console.error("Failed to fetch available datasets", err.message);
    dispatch(warningNotification({message: "Failed to fetch available datasets"}));
  }
  return undefined;
};

export const loadSecondTree = (secondTreeUrl, firstTreeUrl) => async (dispatch, getState) => {
  let secondJson;
  try {
    secondJson = await getDataset(secondTreeUrl)
      .then((res) => res.json());
  } catch (err) {
    console.error("Failed to fetch additional tree", err.message);
    dispatch(warningNotification({message: "Failed to fetch second tree"}));
    return;
  }
  const oldState = getState();
  const newState = createTreeTooState({treeTooJSON: secondJson.tree, oldState, originalTreeUrl: firstTreeUrl, secondTreeUrl: secondTreeUrl, dispatch});
  dispatch({type: types.TREE_TOO_DATA, ...newState});
};


export const loadJSONs = ({url = window.location.pathname, search = window.location.search} = {}) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID});
    }
    const query = queryString.parse(search);

    if (url.indexOf("narratives") === -1) {
      fetchDataAndDispatch(dispatch, url, query);
    } else {
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
    }
  };
};
