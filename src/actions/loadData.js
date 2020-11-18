import queryString from "query-string";
import * as types from "./types";
import { getServerAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState, getNarrativePageFromQuery } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON, fetchWithErrorHandling } from "../util/serverInteraction";
import { warningNotification, errorNotification } from "./notifications";
import { hasExtension, getExtension } from "../util/extensions";
import { parseMarkdownNarrativeFile } from "../util/parseNarrative";
import { NoContentError } from "../util/exceptions";
import { parseMarkdown } from "../util/parseMarkdown";
import { updateColorByWithRootSequenceData } from "../actions/colors";

/**
 * Sends a GET request to the `/charon` web API endpoint requesting data.
 *
 * If the request is successful then the `Response` object is returned.
 * Note that a redirected response can still be successful.
 *
 * Unsuccessful responses result in an `Error` being thrown.
 * If the response is 204 then a `NoContentError` is thrown.
 *
 * @param {String} prefix: the main dataset information pertaining to the query,
 *  e.g. 'flu'
 * @param {Object} additionalQueries: additional information to be parsed as a
 *  query string such as `type` (`String`) or `narrative` (`Boolean`).
 */
const getDatasetFromCharon = async (prefix, {type, narrative=false}={}) => {
  let path = `${getServerAddress()}/${narrative?"getNarrative":"getDataset"}`;
  path += `?prefix=${prefix}`;
  if (type) path += `&type=${type}`;
  return await fetchWithErrorHandling(path);
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
const getHardcodedData = async (prefix, {type="mainJSON"}={}) => {
  const datapaths = getExtension("hardcodedDataPaths");
  return await fetchWithErrorHandling(datapaths[type]);
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
export const collectDatasetFetchUrls = (url) => {
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
    /* No Content (204) errors are special cases where there is no dataset, but the URL is valid */
    if (err instanceof NoContentError) {
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

  /* Attempt to fetch the root-sequence JSON, which may or may not exist */
  try {
    const rootSequenceData = await getDataset(mainDatasetUrl, {type: "root-sequence"})
      .then((res) => res.json());
    dispatch({type: types.SET_ROOT_SEQUENCE, data: rootSequenceData});
    dispatch(updateColorByWithRootSequenceData());
  } catch (err) {
    // We don't log anything as it's not unexpected to be missing the root-sequence JSON
    // console.log("Failed to get the root-sequence JSON", err.message);
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

function addEndOfNarrativeBlock(narrativeBlocks) {
  const lastContentSlide = narrativeBlocks[narrativeBlocks.length-1];
  const endOfNarrativeSlide = Object.assign({}, lastContentSlide, {
    __html: undefined,
    isEndOfNarrativeSlide: true
  });
  narrativeBlocks.push(endOfNarrativeSlide);
}

const narrativeFetchingErrorNotification = (err, failedTreeName, fallbackTreeName) => {
  return errorNotification({
    message: `Error fetching one of the datasets.
      Using the YAML-defined dataset (${fallbackTreeName}) instead.`,
    details: `Could not fetch dataset "${failedTreeName}". Make sure this dataset exists
      and is spelled correctly.
      Error details:
        status: ${err.status};
        message: ${err.message}`
  });
};

const fetchAndCacheNarrativeDatasets = async (dispatch, blocks, query) => {
  const jsons = {};
  const startingBlockIdx = getNarrativePageFromQuery(query, blocks);
  const startingDataset = blocks[startingBlockIdx].dataset;
  const startingTreeName = collectDatasetFetchUrls(startingDataset)[0];
  const landingSlide = {
    mainTreeName: startingTreeName,
    secondTreeDataset: false,
    secondTreeName: false
  };
  const treeNames = blocks.map((block) => collectDatasetFetchUrls(block.dataset)[0]);

  // TODO:1050
  // 1. allow frequencies to be loaded for a narrative dataset here
  // 2. allow loading dataset for secondTreeName

  // We block and await for the landing dataset
  jsons[startingTreeName] = await
  getDataset(startingTreeName)
      .then((res) => res.json())
      .catch((err) => {
        if (startingTreeName !== treeNames[0]) {
          dispatch(narrativeFetchingErrorNotification(err, startingTreeName, treeNames[0]));
          // Assuming block[0] is the one that was set properly for all legacy narratives
          return getDataset(treeNames[0])
            .then((res) => res.json());
        }
        throw err;
      });
  landingSlide.json = jsons[startingTreeName];
  // Dispatch landing dataset
  dispatch({
    type: types.CLEAN_START,
    pathnameShouldBe: startingDataset,
    ...createStateFromQueryOrJSONs({
      ...landingSlide,
      query,
      narrativeBlocks: blocks,
      dispatch
    })
  });

  // The other datasets are fetched asynchronously
  for (const treeName of treeNames) {
  // With this there's no need for Set above
    jsons[treeName] = jsons[treeName] ||
      getDataset(treeName)
        .then((res) => res.json())
        .catch((err) => {
          dispatch(narrativeFetchingErrorNotification(err, treeName, treeNames[0]));
          // We fall back to the first (YAML frontmatter) slide's dataset
          return jsons[treeNames[0]];
        });
  }
  // Dispatch jsons object containing promises corresponding to each fetch to be stored in redux cache.
  // They are potentially unresolved. We await them upon retreieving from the cache - see actions/navigation.js.
  dispatch({
    type: types.CACHE_JSONS,
    jsons
  });
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
      tells us which data JSON to fetch.
      Note that up until v2.16 the client expected the narrative to have been converted
      to JSON by the server. To facilitate backward compatibility (e.g. in the case where
      the client is >2.16, but the server is using an older version of the API)
      if the file doesn't look like markdown we will attempt to parse it as JSON */
      getDatasetFromCharon(url, {narrative: true, type: "md"})
        .then((res) => res.text())
        .then((res) => parseMarkdownNarrativeFile(res, parseMarkdown))
        .catch((err) => {
          // errors from `parseMarkdownNarrativeFile` indicating that the file doesn't look
          // like markdown will have the fileContents attached to them
          if (!err.fileContents) throw err;
          console.error("Narrative file doesn't appear to be markdown! Attempting to parse as JSON.");
          return JSON.parse(err.fileContents);
        })
        .then((blocks) => {
          addEndOfNarrativeBlock(blocks);
          return fetchAndCacheNarrativeDatasets(dispatch, blocks, query);
        })
        .catch((err) => {
          console.error("Error obtaining narratives", err.message);
          dispatch(goTo404(`Couldn't load narrative for ${url}`));
        });
    }
  };
};
