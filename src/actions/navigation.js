import queryString from "query-string";
import { createStateFromQueryOrJSONs } from "./recomputeReduxState";
import { PAGE_CHANGE, URL_QUERY_CHANGE_WITH_COMPUTED_STATE } from "./types";
import { getDatasetNamesFromUrl } from "./loadData";
import { errorNotification } from "./notifications";

/* Given a URL, what "page" should be displayed?
 * "page" means the main app, splash page, status page etc
 * If in doubt, we go to the datasetLoader page as this will
 * redirect to the splash page if the datasets are unavailable
 */
export const chooseDisplayComponentFromURL = (url) => {
  const parts = url.toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  // todo - use URL() not the above code, but `url` is not actually the URL so...

  if (isNarrativeEditor(parts)) return "debugNarrative";
  if (
    !parts.length ||
    (parts.length === 1 && parts[0] === "") ||
    (parts.length === 1 && parts[0] === "staging") ||
    (parts.length === 1 && parts[0] === "community") ||
    (parts.length === 1 && parts[0] === "narratives") ||
    (parts.length === 2 && parts[0] === "groups")
  ) {
    return "splash";
  } else if (parts[0] === "status") {
    return "status";
  }
  return "datasetLoader"; // fallthrough
};

/*
 * `datasets` is populated with `Dataset()` instances for each dataset in a narrative.
 * Each instance contains promises to represent the main and sidecar datafiles.
 * If the Fetch is not finished, this will wait for it to end. Subsequent awaits will immediately return the result.
 */
const updateNarrativeDataset = async (dispatch, datasets, narrativeBlocks, path, query) => {
  try {
    const [mainTreeName, secondTreeName] = getDatasetNamesFromUrl(path);
    const mainDataset = datasets[mainTreeName];
    const secondDataset = datasets[secondTreeName];
    const mainJson = await mainDataset.main;
    const measurementsData = mainDataset.measurements ? (await mainDataset.measurements) : undefined;
    const secondJson = secondDataset ? (await secondDataset.main) : false;
    dispatch({
      type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE,
      ...createStateFromQueryOrJSONs({
        json: mainJson,
        measurementsData,
        secondTreeDataset: secondJson,
        mainTreeName,
        secondTreeName,
        narrativeBlocks,
        query,
        dispatch
      }),
      pushState: true,
      query
    });
    mainDataset.loadSidecars(dispatch);
  } catch (err) {
    dispatch(errorNotification({
      message: `Error loading the datasets for this narrative slide`,
      details: `Please contact the author of this narrative!`
    }));
    console.error(err);
  }
};

/* changes the state of the page and (perhaps) the dataset displayed.
This function is used throughout the app for all navigation to another page,
Note that this function is not pure, in that it may change the URL

The function allows these behaviors:
Case 1. modify the current redux state via a URL query (used in narratives)
Case 2. modify the current redux state by loading a new dataset, but don't reload the page (e.g. remain within the narrative view)
Case 3. load new dataset & start fresh (used when changing dataset via the drop-down in the sidebar).

ARGUMENTS:
path -              OPTIONAL (default: window.location.pathname) - the destination path - e.g. "zika" or "flu/..." (does not include query)
query -             OPTIONAL (default: queryString.parse(window.location.search)) - see below
push -              OPTIONAL (default: true) - signals that pushState should be used (has no effect on the reducers)
changeDatasetOnly - OPTIONAL (default: false) - enables changing datasets while keeping the tree, etc mounted to the DOM (e.g. whilst changing datasets in a narrative).

*/
export const changePage = ({
  path = undefined,
  query = undefined,
  push = true,
  changeDatasetOnly = false
} = {}) => (dispatch, getState) => {
  const oldState = getState();

  /* set some defaults */
  if (!path) path = window.location.pathname;
  if (!query) query = queryString.parse(window.location.search);
  /* some booleans */
  const pathHasChanged = oldState.general.pathname !== path;

  if (!pathHasChanged) {
    /* Case 1 (see docstring): the path (dataset) remains the same but the state may be modulated by the query */
    const newState = createStateFromQueryOrJSONs(
      { oldState,
        query,
        narrativeBlocks: oldState.narrative.blocks,
        dispatch }
    );
    // same dispatch as case 2 but the state comes from the query not from a JSON
    dispatch({
      type: URL_QUERY_CHANGE_WITH_COMPUTED_STATE,
      ...newState,
      pushState: push,
      query
    });
  } else if (changeDatasetOnly) {
    /* Case 2 (see docstring): the path (dataset) has changed but the we want to remain on the current page and update state with the new dataset */
    updateNarrativeDataset(dispatch, oldState.jsonCache.jsons, oldState.narrative.blocks, path, query);
  } else {
    /* Case 3 (see docstring): the path (dataset) has changed and we want to change pages and set a new state according to the path */
    dispatch({
      type: PAGE_CHANGE,
      path,
      displayComponent: chooseDisplayComponentFromURL(path),
      pushState: push,
      query
    });
  }
};

/* a 404 uses the same machinery as changePage, but it's not a thunk.
 * Note that a 404 maintains the "bad" URL -- see https://github.com/nextstrain/auspice/issues/700
 */
export const goTo404 = (errorMessage) => ({
  type: PAGE_CHANGE,
  displayComponent: "splash",
  errorMessage,
  pushState: true
});

/** The narratives editor is currently only a debugger (and named as such internally)
 * however over time editing capability will be built out. The current proposal is for
 * pathnames such as:
 * /edit/narratives (the drag & drop interface, implemented here)
 * /edit/{pathname} (future, not-yet-implemented functionality)
 */
function isNarrativeEditor(parts) {
  return (parts.length===2 && parts[0]==="edit" && parts[1]==="narratives");
}
