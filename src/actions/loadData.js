import queryString from "query-string";
import * as types from "./types";
import { getServerAddress } from "../util/globals";
import { goTo404 } from "./navigation";
import { createStateFromQueryOrJSONs, createTreeTooState, getNarrativePageFromQuery } from "./recomputeReduxState";
import { loadFrequencies } from "./frequencies";
import { fetchJSON, fetchWithErrorHandling } from "../util/serverInteraction";
import { warningNotification, errorNotification } from "./notifications";
import { parseMarkdownNarrativeFile } from "../util/parseNarrative";
import { NoContentError, FetchError} from "../util/exceptions";
import { parseMarkdown } from "../util/parseMarkdown";
import { updateColorByWithRootSequenceData } from "../actions/colors";
import { explodeTree } from "./tree";

export function getDatasetNamesFromUrl(url) {
  let secondTreeUrl;
  if (url.includes(":")) {
    const parts = url.replace(/^\//, '')
      .replace(/\/$/, '')
      .split(":");
    url = parts[0];
    secondTreeUrl = parts[1];
  }
  if (url.startsWith('/')) url = url.slice(1);
  if (secondTreeUrl && secondTreeUrl.startsWith('/')) {
    secondTreeUrl = secondTreeUrl.slice(1);
  }
  return [url, secondTreeUrl];
}

export const loadSecondTree = (secondTreeUrl, firstTreeUrl) => async (dispatch, getState) => {

  const dataset = new Dataset(secondTreeUrl);
  let secondJson;
  try {
    dataset.fetchMain();
    secondJson = await dataset.main;
  } catch (err) {
    console.error("Failed to fetch additional tree", err.message);
    dispatch(warningNotification({message: "Failed to fetch second tree"}));
    return;
  }

  const oldState = getState();

  /* if the first tree is exploded, then reconstruct it before loading a second tree */
  if (oldState.controls.explodeAttr) {
    dispatch(explodeTree(undefined));
  }

  const newState = createTreeTooState({json: secondJson, oldState, originalTreeUrl: firstTreeUrl, secondTreeUrl: secondTreeUrl, dispatch});
  dispatch({type: types.TREE_TOO_DATA, ...newState});
};

export const loadJSONs = ({url = window.location.pathname, search = window.location.search} = {}) => {
  return async (dispatch, getState) => {
    const { tree } = getState();
    if (tree.loaded) {
      dispatch({type: types.DATA_INVALID}); // "resets" state
    }
    const query = queryString.parse(search);
    if (url.includes("/narratives/")) {
      loadNarrative(dispatch, url, query);
    } else {
      warnDeprecatedQuerySyntax(dispatch, query);
      const [mainName, secondName] = getDatasetNamesFromUrl(url);
      const mainDataset = new Dataset(mainName);
      const secondDataset = secondName ? new Dataset(secondName) : undefined;
      try {
        mainDataset.fetchMain();
        if (secondDataset) secondDataset.fetchMain();
        await dispatchCleanStart(dispatch, mainDataset, secondDataset, query);
      } catch (err) {
        const msg = `Couldn't load JSONs for ${mainDataset.name} ${secondDataset ? `and/or ${secondDataset.name}` : ''}`;
        handleFetchErrors(err, dispatch, msg);
        return;
      }
      await mainDataset.fetchSidecars();
      mainDataset.loadSidecars(dispatch);
      try {
        mainDataset.fetchAvailable();
        dispatch({type: types.SET_AVAILABLE, data: await mainDataset.available});
      } catch (err) {
        console.error("Failed to fetch available datasets", err.message);
        dispatch(warningNotification({message: "Failed to fetch available datasets"}));
      }
    }
  };
};

/* ------------------------------------------------------------------------------------ */

function warnDeprecatedQuerySyntax(dispatch, query) {
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
}

function narrativeFetchingErrorNotification(err) {
  return errorNotification({
    message: `Error fetching one of the datasets. Using the YAML-defined dataset instead.`,
    details: `Could not fetch dataset(s)specified for this slide.
      Make sure these exist and are spelled correctly.
      Error details:
        status: ${err.status};
        message: ${err.message}`
  });
}

/**
 * Dispatch the action which will result in Auspice displaying the dataset(s).
 */
async function dispatchCleanStart(dispatch, main, second, query, narrativeBlocks) {
  const json = await main.main;
  const measurementsData = main.measurements ? (await main.measurements) : undefined;
  const secondTreeDataset = second ? (await second.main) : undefined;
  const pathnameShouldBe = second ? `${main.pathname}:${second.pathname}` : main.pathname;
  dispatch({
    type: types.CLEAN_START,
    pathnameShouldBe: narrativeBlocks ? undefined : pathnameShouldBe,
    ...createStateFromQueryOrJSONs({
      json,
      measurementsData,
      secondTreeDataset,
      query,
      narrativeBlocks,
      mainTreeName: main.pathname,
      secondTreeName: second ? second.pathname : null,
      dispatch
    })
  });
}

async function loadNarrative(dispatch, url, query) {
  /* parse the narrative file itself */
  let blocks;
  try {
    blocks = await fetchAndParseNarrative(url);
  } catch (err) {
    console.error("Error obtaining narratives", err.message);
    return dispatch(goTo404(`Couldn't load narrative for ${url}`));
  }

  /* extract all dataset names defined in the narrative, and create `Dataset` objects for each */
  const {datasets, initialNames, frontmatterNames} = parseNarrativeDatasets(blocks, query);

  /* trigger fetches for the initial dataset(s) & start the visualisation */
  let initialSuccess = true;
  try {
    datasets[initialNames[0]].fetchMain();
    if (initialNames[1]) datasets[initialNames[1]].fetchMain();
    await dispatchCleanStart(dispatch, datasets[initialNames[0]], datasets[initialNames[1]], query, blocks);
  } catch (err1) {
    initialSuccess = false;
    try {
      // if the initial dataset call fails, we try the frontmatter one.
      datasets[frontmatterNames[0]].fetchMain();
      if (frontmatterNames[1]) datasets[frontmatterNames[1]].fetchMain();
      await dispatchCleanStart(dispatch, datasets[frontmatterNames[0]], datasets[frontmatterNames[1]], query, blocks);
      dispatch(narrativeFetchingErrorNotification(err1));
    } catch (err2) {
      return handleFetchErrors(err2, dispatch, "Couldn't load the datasets defined in the narrative.");
    }
  }
  /* fetch & load sidecar files for the main dataset currently being displayed */
  if (initialSuccess) {
    await datasets[initialNames[0]].fetchSidecars();
    datasets[initialNames[0]].loadSidecars(dispatch);
  } else {
    await datasets[frontmatterNames[0]].fetchSidecars();
    datasets[frontmatterNames[0]].loadSidecars(dispatch);
  }

  /* trigger dataset / fetches fill in cache with pending promises */
  Object.values(datasets).forEach((dataset) => {
    dataset.fetchMain();
    dataset.fetchSidecars();
  });
  return dispatch({type: types.CACHE_JSONS, jsons: datasets});
}

function handleFetchErrors(err, dispatch, msg) {
  /* No Content (204) errors are special cases where there is no dataset, but the URL is valid */
  if (err instanceof NoContentError) {
    /* TODO: add more helper functions for moving between pages in auspice */
    dispatch({
      type: types.PAGE_CHANGE,
      displayComponent: "splash",
      pushState: true
    });
  } else {
    console.error(err, err.message);
    dispatch(goTo404(msg));
  }
}

/**
 * @returns {Promise}
 */
function fetchAndParseNarrative(url) {
  const apiCall = `${getServerAddress()}/getNarrative?prefix=${url}&type=md`;
  return fetchWithErrorHandling(apiCall)
    .then((res) => res.text())
    .then((res) => parseMarkdownNarrativeFile(res, parseMarkdown))
    .catch((err) => {
      /* Note that up until v2.16 the client expected the narrative to have been converted
      to JSON by the server. To facilitate backward compatibility (e.g. in the case where
      the client is >2.16, but the server is using an older version of the API)
      if the file doesn't look like markdown we will attempt to parse it as JSON.
      Errors from `parseMarkdownNarrativeFile` indicating that the file doesn't look
      like markdown will have the fileContents attached to them */
      if (!err.fileContents) throw err;
      console.error("Narrative file doesn't appear to be markdown! Attempting to parse as JSON.");
      return JSON.parse(err.fileContents);
    })
    .then((blocks) => {
      addEndOfNarrativeBlock(blocks);
      return blocks;
    });
}

/* this function is exported as auspice.us uses it */
export function addEndOfNarrativeBlock(narrativeBlocks) {
  const lastContentSlide = narrativeBlocks[narrativeBlocks.length-1];
  const endOfNarrativeSlide = Object.assign({}, lastContentSlide, {
    __html: undefined,
    isEndOfNarrativeSlide: true
  });
  narrativeBlocks.push(endOfNarrativeSlide);
}

/**
 * This function returns `Dataset` objects for each of the different datasets in a narrative.
 * Note: "initial": starting page, potentially different to frontmatter
 */
export function parseNarrativeDatasets(blocks, query) {
  let [datasets, initialNames, frontmatterNames] = [{}, [], []];
  const initialBlockIdx = getNarrativePageFromQuery(query, blocks);
  blocks.forEach((block, idx) => {
    const [main, second] = getDatasetNamesFromUrl(block.dataset);
    if (!datasets[main]) datasets[main] = new Dataset(main);
    if (second && !datasets[second]) datasets[second] = new Dataset(second);
    if (idx===0) {frontmatterNames = [main, second];}
    if (idx===initialBlockIdx) {initialNames = [main, second];}
  });
  return {datasets, initialNames, frontmatterNames};
}

/**
 * The Dataset object holds information about a single dataset (e.g. "zika") and
 * corresponding sidecar files. It contains prototypes to help with fetching and loading
 * of these data.
 * This function is exported as auspice.us uses it.
 */
export function Dataset(name) {
  this.name = name;
  this.pathname = undefined; // the dataset name to show. May be different from the name.
  this.apiCalls = {};
  this.apiCalls.main = `${getServerAddress()}/getDataset?prefix=${name}`;
  this.apiCalls.tipFrequencies = `${this.apiCalls.main}&type=tip-frequencies`;
  this.apiCalls.rootSequence = `${this.apiCalls.main}&type=root-sequence`;
  this.apiCalls.measurements = `${this.apiCalls.main}&type=measurements`;
  this.apiCalls.getAvailable = `${getServerAddress()}/getAvailable?prefix=${name}`;
}
Dataset.prototype.fetchMain = function fetchMain() {
  if (this.main) return;
  this.main = fetchWithErrorHandling(this.apiCalls.main)
    .then((res) => {
      this.pathname = queryString.parse(res.url.split("?")[1]).prefix;
      if (this.pathname!==this.name) {
        // eslint-disable-next-line no-console
        console.log(`Pathname for "${this.name}" changing to "${this.pathname}".`);
      }
      return res;
    })
    .then((res) => res.json())
    .then((json) => {
      if (json.meta.panels && json.meta.panels.includes("measurements") && !this.measurements) {
        /**
         * Fetch measurements and store the resulting promise.
         * Avoid the browser's default unhandled promise rejection logging and
         * just resolve to an Error object that will be handled appropriately in loadMeasurements.
         */
        this.measurements = fetchJSON(this.apiCalls.measurements)
          .catch((reason) => Promise.resolve(reason));
      }
      return json;
    });
};
Dataset.prototype.fetchSidecars = async function fetchSidecars() {
  /**
   * If deemed appropriate, fetch sidecars and store the resulting promise as `this.<sidecarName>`.
   * The returned promise will (eventually) be processed by chaining further `then` clauses via
   * the `loadSidecars()` prototype. Because this may happen some time in the future, or even
   * not at all, the promises created here should not reject in order to avoid the browser's default
   * unhandled promise rejection logging. If the fetch fails we instead resolve to an Error object
   * and and it is the responsibility of code which uses these promises to react appropriately.
   */
  const mainJson = await this.main;
  if (!mainJson) throw new Error("Cannot fetch sidecar files since the main JSON didn't succeed.");

  if (mainJson.meta.panels && mainJson.meta.panels.includes("frequencies") && !this.tipFrequencies) {
    this.tipFrequencies = fetchJSON(this.apiCalls.tipFrequencies)
      .catch((reason) => Promise.resolve(reason))
  }

  if (!mainJson.root_sequence && !this.rootSequence) {
    // Note that the browser may log a GET error if the above 404s
    this.rootSequence = fetchJSON(this.apiCalls.rootSequence)
      .catch((reason) => Promise.resolve(reason))
  }
};
Dataset.prototype.loadSidecars = function loadSidecars(dispatch) {
  /* Helper function to load (dispatch) the visualisation of sidecar files.
  `this.<sidecarName>` will be undefined (if the request was never made)
  or a promise which may resolve to the parsed JSON data,
  or reject with a suitable error.
  */
  if (this.tipFrequencies) {
    this.tipFrequencies
      .then((data) => {
        if (data instanceof Error) throw data;
        return data
      })
      .then((data) => dispatch(loadFrequencies(data)))
      .catch((reason) => {
        console.error(reason)
        const message = `Failed to ${reason instanceof FetchError ? 'fetch' : 'parse'} tip frequencies`;
        dispatch(warningNotification({message}));
      });
  }
  if (this.rootSequence) {
    this.rootSequence.then((data) => {
      if (data instanceof Error) throw data;
      return data
    }).then((data) => {
      dispatch({type: types.SET_ROOT_SEQUENCE, data});
      dispatch(updateColorByWithRootSequenceData());
    }).catch((reason) => {
      if (reason instanceof FetchError) {
        // no console error message as root sequence sidecars are often not present
        return
      }
      console.error(reason);
      dispatch(warningNotification({message: "Failed to parse root sequence JSON"}));
    })
  }
};
Dataset.prototype.fetchAvailable = async function fetchAvailable() {
  this.available = fetchJSON(this.apiCalls.getAvailable);
};
