import queryString from "query-string";
import * as types from "../actions/types";
import { numericToCalendar } from "../util/dateHelpers";
import { urlQueryLabel } from "../util/treeVisibilityHelpers";
import { shouldDisplayTemporalConfidence } from "../reducers/controls";
import { genotypeSymbol, nucleotide_gene, strainSymbol } from "../util/globals";
import { encodeGenotypeFilters, decodeColorByGenotype, isColorByGenotype } from "../util/getGenotype";
import { getFilteredAndIdxOfFilteredRoot } from "../util/treeVisibilityHelpers";
import { removeInvalidMeasurementsFilterQuery } from "../actions/measurements";
import { defaultStatespaceDeme } from "../components/controls/statespace-deme";

export const strainSymbolUrlString = "__strain__";

/**
 * This middleware acts to keep the app state and the URL query state in sync by
 * intercepting actions and updating the URL accordingly. Thus, in theory, this
 * middleware can be disabled and the app will still work as expected.
 *
 * The only modification of redux state by this app is (potentially) an action
 * of type types.UPDATE_PATHNAME which is used to "save" the current pathname
 * so we can diff against a new one.
 *
 * This is the way by which the URL updates (e.g. when the server auto-completes
 * a URL from /flu -> /flu/seasonal/h3n2/ha/3y, when you change the color-by,
 * or when you change dataset via the dropdowns)
 *
 * @param {store} store: a Redux store
 */
export const changeURLMiddleware = (store) => (next) => (action) => {
  const state = store.getState(); // this is "old" state, i.e. before the reducers have updated by this action
  const result = next(action); // send action to other middleware / reducers
  // if (action.dontModifyURL !== undefined) {
  //   console.log("changeURL middleware skipped")
  //   return result;
  // }

  /* starting URL values & flags */
  let query = queryString.parse(window.location.search);
  let pathname = window.location.pathname;

  /* first switch: query change */
  switch (action.type) {
    case types.CLEAN_START: // fallthrough
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      /* don't use queries when debugging a narrative as those URLs aren't intended to be restorable (yet) */
      if (state.general.displayComponent==="debugNarrative") break;
      query = action.query;
      if (query.n === 0) delete query.n;
      if (query.tt) delete query.tt;
      break;
    case types.CHANGE_BRANCH_LABEL:
      query.branchLabel = state.controls.defaults.selectedBranchLabel === action.value ?
        undefined :
        action.value;
      break;
    case types.TOGGLE_SHOW_ALL_BRANCH_LABELS:
      /* This is not yet settable in display_defaults, and thus we want a URL query
      that will still make sense when the default for the given branch labelling is "show all" */
      query.showBranchLabels = action.value ? 'all' : undefined;
      break;
    case types.CHANGE_ZOOM: {
      /* entropy panel genome zoom coordinates. On a page load these queries
      will be combined with the selected CDS from the color-by genotype, or be
      applied to the nuc view. As such, if the entropy panel's selected CDS is
      _not_ the same as the colorBy (if applicable) then we don't set gmin/gmax
      */
      const entropyCdsName = state.entropy.selectedCds===nucleotide_gene ?
        nucleotide_gene :
        state.entropy.selectedCds.name;
      const colorByCdsName = isColorByGenotype(state.controls.colorBy) &&
        decodeColorByGenotype(state.controls.colorBy, state.entropy.genomeMap).gene;
      const bounds = state.entropy.genomeMap[0].range; // guaranteed to exist, as the action comes from <entropy>
      if (
        ((!colorByCdsName || colorByCdsName===nucleotide_gene) && entropyCdsName===nucleotide_gene) ||
        (colorByCdsName===entropyCdsName)
      ) {
        query.gmin = action.zoomc[0] <= bounds[0] ? undefined : action.zoomc[0];
        query.gmax = action.zoomc[1] >= bounds[1] ? undefined : action.zoomc[1];
      } else {
        [query.gmin, query.gmax] = [undefined, undefined];
      }
      break;
    }
    case types.NEW_COLORS:
      query.c = action.colorBy === state.controls.defaults.colorBy ? undefined : action.colorBy;
      break;
    case types.SET_FOCUS:
      if (action.focus === null) {
        delete query.focus;
      }
      else {
        query.focus = action.focus;
      }
      break;
    case types.TOGGLE_TEMPORAL_CONF:
      if ("ci" in query) {
        query.ci = undefined;
      } else {
        // We have to use null here to put "ci" in the query without an "=" after it and a value, i.e. to treat it as a boolean without having "=true"
        query.ci = null;
      }
      break;
    case types.APPLY_FILTER: {
      if (action.trait === genotypeSymbol) {
        query.gt = encodeGenotypeFilters(action.values);
        break;
      }
      const queryKey = action.trait === strainSymbol ? 's' : // for historical reasons, strains get stored under the `s` query key
        `f_${action.trait}`;
      query[queryKey] = action.values
        .filter((item) => item.active) // only active filters in the URL
        .map((item) => item.value)
        .join(',');
      break;
    }
    case types.CHANGE_LAYOUT: {
      const sv = action.scatterVariables;
      query.scatterX = action.layout==="scatter" && state.controls.distanceMeasure!==sv.x ? sv.x : undefined;
      query.scatterY = action.layout==="scatter" && state.controls.colorBy!==sv.y ? sv.y : undefined;
      query.branches = (action.layout==="scatter" || action.layout==="clock") && sv.showBranches===false ? "hide" : undefined;
      query.regression = action.layout==="scatter" && sv.showRegression===true ? "show" :
        action.layout==="clock" && sv.showRegression===false ? "hide" :
          undefined;
      query.l = action.layout === state.controls.defaults.layout ? undefined : action.layout;
      if (!shouldDisplayTemporalConfidence(state.controls.temporalConfidence.exists, state.controls.distanceMeasure, query.l)) {
        query.ci = undefined;
      }
      break;
    }
    case types.CHANGE_GEO_RESOLUTION: {
      query.r = action.data === state.controls.defaults.geoResolution ? undefined : action.data;
      break;
    }
    case types.CHANGE_STATESPACE_DEME: {
      // TODO - this case is correct, but if we subsequently change the geo-res or color-by then it's not
      // easier to just always set it?
      query.statespaceDeme = action.statespaceDeme===defaultStatespaceDeme(state.controls.geoResolution, state.controls.colorBy)
        ? undefined
        : action.statespaceDeme;
      break;
    }
    case types.TOGGLE_TRANSMISSION_LINES: {
      if (action.data === state.controls.defaults.showTransmissionLines) query.transmissions = undefined;
      else query.transmissions = action.data ? 'show' : 'hide';
      break;
    }
    case types.CHANGE_LANGUAGE: {
      query.lang = action.data === state.general.defaults.language ? undefined : action.data;
      break;
    }
    case types.CHANGE_DISTANCE_MEASURE: {
      query.m = action.data === state.controls.defaults.distanceMeasure ? undefined : action.data;
      if (!shouldDisplayTemporalConfidence(state.controls.temporalConfidence.exists, query.m, state.controls.layout)) {
        query.ci = undefined;
      }
      break;
    }
    case types.CHANGE_PANEL_LAYOUT: {
      query.p = action.notInURLState === true ? undefined : action.data;
      break;
    }
    case types.TOGGLE_SIDEBAR: {
      // we never add this to the URL on purpose -- it should be manually set as it specifies a world
      // where resizes can not open / close the sidebar. The exception is if it's toggled, we
      // remove it from the URL query, as it's no longer valid to call it open if it's closed!
      if ("sidebar" in query) {
        query.sidebar = undefined;
      }
      break;
    }
    case types.TOGGLE_LEGEND: {
      // we treat this the same as sidebar above -- it can only be added to the URL manually
      if ("legend" in query) {
        query.legend = undefined;
      }
      break;
    }
    case types.TOGGLE_PANEL_DISPLAY: {
      /* check this against the defaults set by the dataset (and this default is all available panels if not specifically set) */
      if (
        state.controls.defaults.panels.length===action.panelsToDisplay.length &&
        state.controls.defaults.panels.filter((p) => !action.panelsToDisplay.includes(p)).length===0
      ) {
        query.d = undefined;
      } else {
        query.d = action.panelsToDisplay.join(",");
      }
      query.p = action.panelLayout;
      break;
    }
    case types.CHANGE_TIP_LABEL_KEY: {
      query.tl = action.key===state.controls.defaults.tipLabelKey ? undefined :
        action.key===strainSymbol ? strainSymbolUrlString :
        action.key;
      break;
    }
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      if (state.controls.animationPlayPauseButton === "Pause") { // animation in progress - no dates in URL
        query.dmin = undefined;
        query.dmax = undefined;
      } else {
        query.dmin = action.dateMin === state.controls.absoluteDateMin ? undefined : action.dateMin;
        query.dmax = action.dateMax === state.controls.absoluteDateMax ? undefined : action.dateMax;
      }
      break;
    }
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS: {
      // NOTE: `idxOfInViewRootNode` refers to the left tree only (if 2 trees displayed)
      query.label = urlQueryLabel(state.tree.nodes[action.idxOfInViewRootNode], state.tree.availableBranchLabels)
      /* The "zoom to selected" button will zoom to the `idxOfFilteredRoot` (i.e. its behaviour depends on the selected
      filters). If the LHS tree is zoomed to this node, either by chance or by having clicked on the button, then set
      this as query. Any other zoom/filtering action will remove it */
      if (
        /* if there's a label then don't use zoom-to-selected as the label is more specific */
        query.label===undefined &&
        /* The "zoom to selected" button will zoom us to the idxOfFilteredRoot, so check we're
        there - either because we pressed the button or because we clicked that branch */
        action.idxOfFilteredRoot===action.idxOfInViewRootNode &&
        /* Ensure the filtered tips (across the entire tree) are _all_ downstream of the current zoomed node
        i.e. the CA of filtered tips when the entire tree's in view is the same as the current zoom node. See
        <https://github.com/nextstrain/auspice/pull/1321#issuecomment-2914923800> for more context. */
        action.idxOfFilteredRoot===getFilteredAndIdxOfFilteredRoot(state.tree, state.controls, state.tree.nodes.map(() => true)).idxOfFilteredRoot
      ) {
        query.treeZoom="selected"; // using a string value allows for future expansion of functionality
      } else {
        query.treeZoom = undefined
      }
      break;
    }
    case types.MAP_ANIMATION_PLAY_PAUSE_BUTTON:
      if (action.data === "Play") { // animation stopping - restore dates in URL
        query.animate = undefined;
        query.dmin = state.controls.dateMin === state.controls.absoluteDateMin ? undefined : state.controls.dateMin;
        query.dmax = state.controls.dateMax === state.controls.absoluteDateMax ? undefined : state.controls.dateMax;
      }
      break;
    case types.MIDDLEWARE_ONLY_ANIMATION_STARTED: {
      /* animation started - format: start bound, end bound, loop 0|1, cumulative 0|1, speed in ms */
      const a = numericToCalendar(window.NEXTSTRAIN.animationStartPoint);
      const b = numericToCalendar(window.NEXTSTRAIN.animationEndPoint);
      const c = state.controls.mapAnimationShouldLoop ? "1" : "0";
      const d = state.controls.mapAnimationCumulative ? "1" : "0";
      const e = state.controls.mapAnimationDurationInMilliseconds;
      query.animate = `${a},${b},${c},${d},${e}`;
      break;
    }
    case types.PAGE_CHANGE:
      if (action.query) {
        query = action.query;
      } else if (action.displayComponent !== state.general.displayComponent) {
        query = {};
      }
      break;
    case types.TOGGLE_NARRATIVE: {
      /* don't use queries when debugging a narrative as those URLs aren't intended to be restorable (yet) */
      if (state.general.displayComponent==="debugNarrative") break;
      if (action.narrativeOn === true) {
        query = {n: state.narrative.blockIdx};
      } else if (action.narrativeOn === false) {
        query = queryString.parse(state.narrative.blocks[state.narrative.blockIdx].query);
      }
      break;
    }
    case types.CHANGE_MEASUREMENTS_COLLECTION: // fallthrough
    case types.APPLY_MEASUREMENTS_FILTER:
      query = removeInvalidMeasurementsFilterQuery(query, action.queryParams)
      query = {...query, ...action.queryParams};
      break;
    case types.CHANGE_MEASUREMENTS_DISPLAY: // fallthrough
    case types.CHANGE_MEASUREMENTS_GROUP_BY: // fallthrough
    case types.TOGGLE_MEASUREMENTS_OVERALL_MEAN: // fallthrough
    case types.TOGGLE_MEASUREMENTS_THRESHOLD: // fallthrough
      query = {...query, ...action.queryParams};
      break;
    case types.CHANGE_STREAM_TREE_BRANCH_LABEL: {
      const displayDefault = state.metadata?.displayDefaults?.streamLabel;
      const newLabel = action.streamTreeBranchLabel
      query.streamLabel = newLabel===displayDefault ? undefined : newLabel;
      break;
    }
    case types.TOGGLE_STREAM_TREE: {
      const displayDefault = state.metadata?.displayDefaults?.streamLabel;
      if (action.showStreamTrees) { // toggling on
        query.streamLabel = displayDefault===state.controls.streamTreeBranchLabel ? undefined : state.controls.streamTreeBranchLabel;
      } else { // toggling off
        query.streamLabel = displayDefault ? 'none' : undefined;
      }
      break;
    }
    default:
      break;
  }

  /* second switch: path change */
  switch (action.type) {
    case types.CLEAN_START:
      if (typeof action.pathnameShouldBe === "string" && !action.narrative) {
        pathname = action.pathnameShouldBe;
        break;
      }
      /* we also double check that if there are 2 trees both are represented
      in the URL */
      if (action.tree.name && action.treeToo && action.treeToo.name && !action.narrative) {
        const treeUrlShouldBe = `${action.tree.name}:${action.treeToo.name}`;
        if (!window.location.pathname.includes(treeUrlShouldBe)) {
          pathname = treeUrlShouldBe;
        }
      }
      break;
    case types.TOGGLE_NARRATIVE: {
      /* when toggling between the narrative view & the underlying dataset view the intention is to
      have the pathname represent the narrative and the dataset, respectively. However when we are
      editing a narrative we _do not_ want to change the pathname */
      if (state.general.displayComponent==="debugNarrative") break;
      if (action.narrativeOn === true) {
        pathname = state.narrative.pathname;
      } else if (action.narrativeOn === false) {
        pathname = state.narrative.blocks[state.narrative.blockIdx].dataset;
      }
      break;
    }
    case types.PAGE_CHANGE:
      /* desired behaviour depends on the displayComponent selected... */
      if (action.displayComponent === "main" || action.displayComponent === "datasetLoader" || action.displayComponent === "splash") {
        pathname = action.path || pathname;
      } else if (pathname.startsWith(`/${action.displayComponent}`)) {
        // leave the pathname alone!
      } else {
        // fallthrough
        pathname = action.displayComponent;
      }
      break;
    case types.REMOVE_TREE_TOO: {
      pathname = pathname.split(":")[0];
      break;
    }
    case types.TREE_TOO_DATA: {
      const treeUrl = action.tree.name;
      const secondTreeUrl = action.treeToo.name;
      pathname = treeUrl.concat(":", secondTreeUrl);
      break;
    }
    default:
      break;
  }

  Object.keys(query).filter((q) => query[q] === "").forEach((k) => delete query[k]);
  if (state.narrative.display) {
    Object.keys(query).filter((q) => q!=='n').forEach((k) => delete query[k]);
  }
  let search = queryString.stringify(query).replace(/%2C/g, ',').replace(/%2F/g, '/').replace(/%3A/g, ':');
  if (search) {search = "?" + search;}
  if (!pathname.startsWith("/")) {pathname = "/" + pathname;}

  /* now that we have determined our desired pathname & query we modify the URL */
  if (pathname !== window.location.pathname || search !== window.location.search) {
    let newURLString = pathname;
    if (search) {newURLString += search;}
    if (action.pushState) {
      window.history.pushState({}, "", newURLString);
    } else {
      window.history.replaceState({}, "", newURLString);
    }
    next({type: types.UPDATE_PATHNAME, pathname: pathname});
  } else if (pathname !== state.general.pathname && action.type === types.PAGE_CHANGE) {
    next({type: types.UPDATE_PATHNAME, pathname: pathname});
  }

  return result;
};
