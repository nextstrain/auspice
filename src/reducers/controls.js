import { numericToCalendar, calendarToNumeric, currentNumDate, currentCalDate } from "../util/dateHelpers";
import { flattenTree } from "../components/tree/treeHelpers";
import { defaultGeoResolution,
  defaultColorBy,
  defaultDateRange,
  defaultDistanceMeasure,
  defaultLayout,
  mutType,
  twoColumnBreakpoint,
  reallySmallNumber } from "../util/globals";
import * as types from "../actions/types";
import { calcBrowserDimensionsInitialState } from "./browserDimensions";

export const checkColorByConfidence = (attrs, colorBy) => {
  return colorBy !== "num_date" && attrs.indexOf(colorBy + "_confidence") > -1;
};

const getMinCalDateViaTree = (root) => {
  const minNumDate = root.attr.num_date - 0.01; /* slider should be earlier than actual day */
  return numericToCalendar(minNumDate);
};

const getMaxCalDateViaTree = (tree) => {
  let maxNumDate = reallySmallNumber;
  const nodesArray = flattenTree(tree);
  nodesArray.forEach((node) => {
    if (node.attr) {
      if (node.attr.num_date) {
        if (node.attr.num_date > maxNumDate) {
          maxNumDate = node.attr.num_date;
        }
      }
    }
  });
  maxNumDate += 0.01; /* slider should be later than actual day */
  return numericToCalendar(maxNumDate);
};

/* need a (better) way to keep the queryParams all in "sync" */
export const modifyStateViaURLQuery = (state, query) => {
  // console.log("Query incoming: ", query);
  if (query.l) {
    state["layout"] = query.l;
  }
  if (query.m) {
    state["distanceMeasure"] = query.m;
  }
  if (query.c) {
    state["colorBy"] = query.c;
  }
  if (query.r) {
    state["geoResolution"] = query.r;
  }
  if (query.p && state.canTogglePanelLayout && (query.p === "full" || query.p === "grid")) {
    state["panelLayout"] = query.p;
  }
  if (query.dmin) {
    state["dateMin"] = query.dmin;
    state["dateMinNumeric"] = calendarToNumeric(query.dmin);
  }
  if (query.dmax) {
    state["dateMax"] = query.dmax;
    state["dateMaxNumeric"] = calendarToNumeric(query.dmax);
  }
  for (const filterKey of Object.keys(query).filter((c) => c.startsWith('f_'))) {
    state.filters[filterKey.replace('f_', '')] = query[filterKey].split(',');
  }
  if (query.animate) {
    const params = query.animate.split(',');
    // console.log("start animation!", params);
    window.NEXTSTRAIN.animationStartPoint = calendarToNumeric(params[0]);
    window.NEXTSTRAIN.animationEndPoint = calendarToNumeric(params[1]);
    state.dateMin = params[0];
    state.dateMax = params[1];
    state.dateMinNumeric = calendarToNumeric(params[0]);
    state.dateMaxNumeric = calendarToNumeric(params[1]);
    state.mapAnimationShouldLoop = params[2] === "1";
    state.mapAnimationCumulative = params[3] === "1";
    state.mapAnimationDurationInMilliseconds = parseInt(params[4], 10);
    state.animationPlayPauseButton = "Pause";
  } else {
    state.animationPlayPauseButton = "Play";
  }
  return state;
};

export const restoreQueryableStateToDefaults = (state) => {
  for (const key of Object.keys(state.defaults)) {
    switch (typeof state.defaults[key]) {
      case "string": {
        state[key] = state.defaults[key];
        break;
      }
      case "object": { /* can't use Object.assign, must deep clone instead */
        state[key] = JSON.parse(JSON.stringify(state.defaults[key]));
        break;
      }
      default: {
        console.error("unknown typeof for default state of ", key);
      }
    }
  }
  /* dateMin & dateMax get set to their bounds */
  state["dateMin"] = state["absoluteDateMin"];
  state["dateMax"] = state["absoluteDateMax"];
  state["dateMinNumeric"] = state["absoluteDateMinNumeric"];
  state["dateMaxNumeric"] = state["absoluteDateMaxNumeric"];

  state["panelLayout"] = calcBrowserDimensionsInitialState().width > twoColumnBreakpoint ? "grid" : "full";

  // console.log("state now", state);
  return state;
};

const modifyStateViaMetadata = (state, metadata) => {
  if (metadata.date_range) {
    /* this may be useful if, e.g., one were to want to display an outbreak
    from 2000-2005 (the default is the present day) */
    if (metadata.date_range.date_min) {
      state["dateMin"] = metadata.date_range.date_min;
      state["dateMinNumeric"] = calendarToNumeric(state["dateMin"]);
      state["absoluteDateMin"] = metadata.date_range.date_min;
      state["absoluteDateMinNumeric"] = calendarToNumeric(state["absoluteDateMin"]);
      state["mapAnimationStartDate"] = metadata.date_range.date_min;
    }
    if (metadata.date_range.date_max) {
      state["dateMax"] = metadata.date_range.date_max;
      state["dateMaxNumeric"] = calendarToNumeric(state["dateMax"]);
      state["absoluteDateMax"] = metadata.date_range.date_max;
      state["absoluteDateMaxNumeric"] = calendarToNumeric(state["absoluteDateMax"]);
    }
  }
  if (metadata.analysisSlider) {
    state["analysisSlider"] = {key: metadata.analysisSlider, valid: false};
  }
  if (metadata.author_info) {
    state.filters.authors = [];
    state.defaults.filters.authors = [];
  } else {
    console.error("update meta.json to include author_info.");
  }
  if (metadata.filters) {
    metadata.filters.forEach((v) => {
      state.filters[v] = [];
      state.defaults.filters[v] = [];
    });
  } else {
    console.warn("the meta.json did not include any filters");
  }
  if (metadata.defaults) {
    const keysToCheckFor = ["geoResolution", "colorBy", "distanceMeasure", "layout"];
    const expectedTypes = ["string", "string", "string", "string"];

    for (let i = 0; i < keysToCheckFor.length; i += 1) {
      if (metadata.defaults[keysToCheckFor[i]]) {
        if (typeof metadata.defaults[keysToCheckFor[i]] === expectedTypes[i]) { // eslint-disable-line valid-typeof
          /* e.g. if key=geoResoltion, set both state.geoResolution and state.defaults.geoResolution */
          state[keysToCheckFor[i]] = metadata.defaults[keysToCheckFor[i]];
          state.defaults[keysToCheckFor[i]] = metadata.defaults[keysToCheckFor[i]];
        } else {
          console.error("Skipping (meta.json) default for ", keysToCheckFor[i], "as it is not of type ", expectedTypes[i]);
        }
      }
    }
    // TODO: why are these false / False
    if (metadata.defaults.mapTriplicate) {
      // convert string to boolean; default is true; turned off with either false (js) or False (python)
      state["mapTriplicate"] = (metadata.defaults.mapTriplicate === 'false' || metadata.defaults.mapTriplicate === 'False') ? false : true;
    }
  }

  /* if only map or only tree, then panelLayout must be full */
  if (metadata.panels.indexOf("map") === -1 || metadata.panels.indexOf("tree") === -1) {
    state.panelLayout = "full";
    state.canTogglePanelLayout = false;
  }
  /* annotations in metadata */
  if (!metadata.annotations) {console.error("Metadata needs updating with annotations field. Rerun augur. FATAL.")}
  for (const gene of Object.keys(metadata.annotations)) {
    state.geneLength[gene] = metadata.annotations[gene].end - metadata.annotations[gene].start;
    if (gene !== "nuc") {
      state.geneLength[gene] /= 3;
    }
  }
  return state;
};

const modifyStateViaTree = (state, tree) => {
  state["dateMin"] = getMinCalDateViaTree(tree);
  state["absoluteDateMin"] = getMinCalDateViaTree(tree);
  state["dateMax"] = getMaxCalDateViaTree(tree);
  state["absoluteDateMax"] = getMaxCalDateViaTree(tree);
  /* and their numeric conversions */
  state.dateMinNumeric = calendarToNumeric(state.dateMin);
  state.absoluteDateMinNumeric = calendarToNumeric(state.absoluteDateMin);
  state.dateMaxNumeric = calendarToNumeric(state.dateMax);
  state.absoluteDateMaxNumeric = calendarToNumeric(state.absoluteDateMax);

  /* available tree attrs - based upon the root node */
  state["attrs"] = Object.keys(tree.attr);
  state["temporalConfidence"] = Object.keys(tree.attr).indexOf("num_date_confidence") > -1 ?
    {exists: true, display: true, on: false} : {exists: false, display: false, on: false};
  return state;
};

export const checkAndCorrectErrorsInState = (state, metadata) => {
  /* The one (bigish) problem with this being in the reducer is that
  we can't have any side effects. So if we detect and error introduced by
  a URL QUERY (and correct it in state), we can't correct the URL */

  /* colorBy */
  if (Object.keys(metadata.color_options).indexOf(state.colorBy) === -1 && !state["colorBy"].startsWith("gt-")) {
    const availableNonGenotypeColorBys = Object.keys(metadata.color_options);
    if (availableNonGenotypeColorBys.indexOf("gt") > -1) {
      availableNonGenotypeColorBys.splice(availableNonGenotypeColorBys.indexOf("gt"), 1);
    }
    console.error("Error detected trying to set colorBy to", state.colorBy, "(valid options are", Object.keys(metadata.color_options).join(", "), "). Setting to", availableNonGenotypeColorBys[0]);
    state.colorBy = availableNonGenotypeColorBys[0];
    state.defaults.colorBy = availableNonGenotypeColorBys[0];
  }

  /* colorBy confidence */
  state["colorByConfidence"] = checkColorByConfidence(state["attrs"], state["colorBy"]);

  /* distanceMeasure */
  if (["div", "num_date"].indexOf(state["distanceMeasure"]) === -1) {
    state["distanceMeasure"] = "num_date";
    console.error("Error detected. Setting distanceMeasure to ", state["distanceMeasure"]);
  }

  /* geoResolution */
  const availableGeoResultions = Object.keys(metadata.geo);
  if (availableGeoResultions.indexOf(state["geoResolution"]) === -1) {
    state["geoResolution"] = availableGeoResultions[0];
    console.error("Error detected. Setting geoResolution to ", state["geoResolution"]);
  }

  /* temporalConfidence */
  if (state.temporalConfidence.exists) {
    if (state.layout !== "rect") {
      state.temporalConfidence.display = false;
      state.temporalConfidence.on = false;
    } else if (state.distanceMeasure === "div") {
      state.temporalConfidence.display = false;
      state.temporalConfidence.on = false;
    }
  }

  return state;
};

/* defaultState is a fn so that we can re-create it
at any time, e.g. if we want to revert things (e.g. on dataset change)
*/
const getDefaultState = () => {
  const defaults = {
    distanceMeasure: defaultDistanceMeasure,
    layout: defaultLayout,
    geoResolution: defaultGeoResolution,
    filters: {},
    colorBy: defaultColorBy
  };
  const dateMin = numericToCalendar(currentNumDate() - defaultDateRange);
  const dateMax = currentCalDate();
  const dateMinNumeric = calendarToNumeric(dateMin);
  const dateMaxNumeric = calendarToNumeric(dateMax);
  return {
    defaults,
    canTogglePanelLayout: true,
    selectedLegendItem: null,
    selectedBranch: null,
    selectedNode: null,
    region: null,
    search: null,
    strain: null,
    geneLength: {},
    mutType: mutType,
    temporalConfidence: {exists: false, display: false, on: false},
    layout: defaults.layout,
    distanceMeasure: defaults.distanceMeasure,
    dateMin,
    dateMinNumeric,
    dateMax,
    dateMaxNumeric,
    absoluteDateMin: dateMin,
    absoluteDateMinNumeric: dateMinNumeric,
    absoluteDateMax: dateMax,
    absoluteDateMaxNumeric: dateMaxNumeric,
    colorBy: defaults.colorBy,
    colorByConfidence: {display: false, on: false},
    colorScale: undefined,
    analysisSlider: false,
    geoResolution: defaults.geoResolution,
    filters: {},
    showDownload: false,
    quickdraw: false, // if true, components may skip expensive computes.
    mapAnimationDurationInMilliseconds: 30000, // in milliseconds
    mapAnimationStartDate: null, // Null so it can pull the absoluteDateMin as the default
    mapAnimationCumulative: false,
    mapAnimationShouldLoop: false,
    animationPlayPauseButton: "Play",
    panelLayout: calcBrowserDimensionsInitialState().width > twoColumnBreakpoint ? "grid" : "full"
  };
};

const Controls = (state = getDefaultState(), action) => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: {
      return action.newControls;
    }
    case types.NEW_DATASET: {
      let base = getDefaultState();
      base = modifyStateViaTree(base, action.tree);
      base = modifyStateViaMetadata(base, action.meta);
      base = modifyStateViaURLQuery(base, action.query);
      base = checkAndCorrectErrorsInState(base, action.meta); /* must run last */
      return base;
    }
    case types.LEGEND_ITEM_MOUSEENTER:
      return Object.assign({}, state, {
        selectedLegendItem: action.data
      });
    case types.LEGEND_ITEM_MOUSELEAVE:
      return Object.assign({}, state, {
        selectedLegendItem: null
      });
    case types.BRANCH_MOUSEENTER:
      return Object.assign({}, state, {
        selectedBranch: action.data
      });
    case types.BRANCH_MOUSELEAVE:
      return Object.assign({}, state, {
        selectedBranch: null
      });
    case types.NODE_MOUSEENTER:
      return Object.assign({}, state, {
        selectedNode: action.data
      });
    case types.NODE_MOUSELEAVE:
      return Object.assign({}, state, {
        selectedNode: null
      });
    case types.CHANGE_LAYOUT: {
      const layout = action.data;
      /* temporal confidence can only be displayed for rectangular trees */
      const temporalConfidence = {
        exists: state.temporalConfidence.exists,
        display: state.temporalConfidence.exists && layout === "rect",
        on: false
      };
      return Object.assign({}, state, {
        layout,
        temporalConfidence
      });
    }
    case types.CHANGE_DISTANCE_MEASURE:
      /* while this may change, div currently doesn't have CIs,
      so they shouldn't be displayed. */
      if (state.temporalConfidence.exists) {
        if (state.temporalConfidence.display && action.data === "div") {
          return Object.assign({}, state, {
            distanceMeasure: action.data,
            temporalConfidence: Object.assign({}, state.temporalConfidence, {display: false, on: false})
          });
        } else if (state.layout === "rect" && action.data === "num_date") {
          return Object.assign({}, state, {
            distanceMeasure: action.data,
            temporalConfidence: Object.assign({}, state.temporalConfidence, {display: true})
          });
        }
      }
      return Object.assign({}, state, {
        distanceMeasure: action.data
      });
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      const newDates = {quickdraw: action.quickdraw};
      if (action.dateMin) {
        newDates.dateMin = action.dateMin;
        newDates.dateMinNumeric = action.dateMinNumeric;
      }
      if (action.dateMax) {
        newDates.dateMax = action.dateMax;
        newDates.dateMaxNumeric = action.dateMaxNumeric;
      }
      return Object.assign({}, state, newDates);
    }
    case types.CHANGE_ABSOLUTE_DATE_MIN:
      return Object.assign({}, state, {
        absoluteDateMin: action.data,
        absoluteDateMinNumeric: calendarToNumeric(action.data)
      });
    case types.CHANGE_ABSOLUTE_DATE_MAX:
      return Object.assign({}, state, {
        absoluteDateMax: action.data,
        absoluteDateMaxNumeric: calendarToNumeric(action.data)
      });
    case types.CHANGE_ANIMATION_TIME:
      return Object.assign({}, state, {
        mapAnimationDurationInMilliseconds: action.data
      });
    case types.CHANGE_ANIMATION_CUMULATIVE:
      return Object.assign({}, state, {
        mapAnimationCumulative: action.data
      });
    case types.CHANGE_ANIMATION_LOOP:
      return Object.assign({}, state, {
        mapAnimationShouldLoop: action.data
      });
    case types.MAP_ANIMATION_PLAY_PAUSE_BUTTON:
      return Object.assign({}, state, {
        quickdraw: action.data === "Play" ? false : true,
        animationPlayPauseButton: action.data
      });
    case types.CHANGE_ANIMATION_START:
      return Object.assign({}, state, {
        mapAnimationStartDate: action.data
      });
    case types.CHANGE_PANEL_LAYOUT:
      return Object.assign({}, state, {
        panelLayout: action.data
      });
    case types.NEW_COLORS: {
      const newState = Object.assign({}, state, {
        colorBy: action.colorBy,
        colorScale: action.colorScale,
        colorByConfidence: checkColorByConfidence(state.attrs, action.colorBy)
      });
      if (action.newMutType) {
        newState.mutType = action.newMutType;
      }
      return newState;
    }
    case types.CHANGE_GEO_RESOLUTION:
      return Object.assign({}, state, {
        geoResolution: action.data
      });
    case types.APPLY_FILTER: {
      // values arrive as array
      const filters = Object.assign({}, state.filters, {});
      filters[action.fields] = action.values;
      // console.log(filters)
      return Object.assign({}, state, {
        filters
      });
    }
    case types.TOGGLE_MUT_TYPE:
      return Object.assign({}, state, {
        mutType: action.data
      });
    case types.TOGGLE_TEMPORAL_CONF:
      return Object.assign({}, state, {
        temporalConfidence: Object.assign({}, state.temporalConfidence, {
          on: !state.temporalConfidence.on
        })
      });
    case types.ANALYSIS_SLIDER:
      if (action.destroy) {
        return Object.assign({}, state, {
          analysisSlider: false
        });
      }
      return Object.assign({}, state, {
        analysisSlider: {
          key: state.analysisSlider.key,
          // valid: true, // TESTING ONLY
          valid: false, // FIXME --- This is a temporary hack to disable the analysis slider, while keeping color options
          value: action.maxVal,
          absoluteMinVal: action.minVal,
          absoluteMaxVal: action.maxVal
        }
      });
    case types.CHANGE_ANALYSIS_VALUE:
      return Object.assign({}, state, {
        analysisSlider: Object.assign({}, state.analysisSlider, {
          value: action.value
        })
      });
    case types.TRIGGER_DOWNLOAD_MODAL:
      return Object.assign({}, state, {
        showDownload: true
      });
    case types.DISMISS_DOWNLOAD_MODAL:
      return Object.assign({}, state, {
        showDownload: false
      });
    default:
      return state;
  }
};

export default Controls;
