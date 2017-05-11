/*eslint dot-notation: 0*/
import * as types from "../actions/types";
import * as globals from "../util/globals";
import getColorScale from "../util/getColorScale";
import moment from 'moment';
import d3 from "d3";
import { determineColorByGenotypeType } from "../util/urlHelpers";

/*
  we don't actually need to have legendBoundsMap default if regions will always be the
  default colorBy. this is saftey in case we change that.
  continuous in state is to be true whenever the color scale is continuous
  as opposed to discrete/categorical. we need a legendBoundsMap in the former, not the latter
*/

/* defaultState is a fn so that we can re-create it
at any time, e.g. if we want to revert things (e.g. on dataset change)
*/
const getDefaultState = function () {
  return {
    showBranchLabels: false,
    selectedLegendItem: null,
    selectedBranch: null,
    selectedNode: null,
    region: null,
    search: null,
    strain: null,
    splitTreeAndMap: false,
    mutType: globals.mutType,
    layout: globals.defaultLayout,
    distanceMeasure: globals.defaultDistanceMeasure,
    dateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    dateMax: moment().format("YYYY-MM-DD"),
    absoluteDateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    absoluteDateMax: moment().format("YYYY-MM-DD"),
    colorBy: globals.defaultColorBy,
    colorScale: getColorScale(globals.defaultColorBy, {}, {}, {}, 1),
    analysisSlider: false,
    geoResolution: globals.defaultGeoResolution,
    datasetPathName: null,
    filters: {},
    dateScale: d3.time.scale().domain([new Date(2000, 0, 0), new Date(2100, 0, 0)]).range([2000, 2100]),
    dateFormat: d3.time.format("%Y-%m-%d")
  };
};

const Controls = (state = getDefaultState(), action) => {
  switch (action.type) {
  case types.RESET_CONTROLS:
    return getDefaultState();
  case types.NEW_DATASET:
    return Object.assign({}, state, {
      datasetPathName: action.data
    });
  case types.TOGGLE_BRANCH_LABELS:
    return Object.assign({}, state, {
      showBranchLabels: !state.showBranchLabels
    });
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
  case types.CHANGE_LAYOUT:
    return Object.assign({}, state, {
      layout: action.data
    });
  case types.CHANGE_DISTANCE_MEASURE:
    return Object.assign({}, state, {
      distanceMeasure: action.data
    });
  case types.CHANGE_DATE_MIN:
    return Object.assign({}, state, {
      dateMin: action.data
    });
  case types.CHANGE_DATE_MAX:
    return Object.assign({}, state, {
      dateMax: action.data
    });
  case types.CHANGE_ABSOLUTE_DATE_MIN:
    return Object.assign({}, state, {
      absoluteDateMin: action.data
    });
  case types.CHANGE_ABSOLUTE_DATE_MAX:
    return Object.assign({}, state, {
      absoluteDateMax: action.data
    });
  case types.CHANGE_COLOR_BY:
    const newState = Object.assign({}, state, {
      colorBy: action.data
    });
    /* may need to toggle the entropy selector AA <-> NUC */
    if (determineColorByGenotypeType(action.data)) {
      newState.mutType = determineColorByGenotypeType(action.data);
    }
    return newState;
  case types.SET_COLOR_SCALE:
    return Object.assign({}, state, {
      colorScale: action.data
    });
  case types.CHANGE_GEO_RESOLUTION:
    return Object.assign({}, state, {
      geoResolution: action.data
    });
  /* metadata in may affect the date ranges, etc */
  case types.RECEIVE_METADATA:
    const extras = {};
    if (action.data.date_range) {
      if (action.data.date_range.date_min) {
        extras["dateMin"] = action.data.date_range.date_min;
        extras["absoluteDateMin"] = action.data.date_range.date_min;
      }
      if (action.data.date_range.date_max) {
        extras["dateMax"] = action.data.date_range.date_max;
        extras["absoluteDateMax"] = action.data.date_range.date_max;
      }
    }

    if (action.data.analysisSlider) {
      extras["analysisSlider"] = {key: action.data.analysisSlider, valid: false};
    }

    /* If the default color by (set when this reducer was initialised)
    isn't an option in the JSON, provide a fallback */
    const available_colorBy = Object.keys(action.data.color_options);
    if (available_colorBy.indexOf(globals.defaultColorBy) === -1) {
      /* remove "gt" */
      const gtIdx = available_colorBy.indexOf("gt");
      if (gtIdx > -1) {
        available_colorBy.splice(gtIdx, 1);
      }
      extras["colorBy"] = available_colorBy[0];
    }

    // Check if there were defaults provided in the meta JSON; these overrides all other defaults.
    if (action.data.defaults) {
      if (action.data.defaults.geoResolution) {
        extras["geoResolution"] = action.data.defaults.geoResolution;
      }
      if (action.data.defaults.colorBy) {
        extras["colorBy"] = action.data.defaults.colorBy;
      }
      if (action.data.defaults.distanceMeasure) {
        extras["distanceMeasure"] = action.data.defaults.distanceMeasure;
      }
      if (action.data.defaults.layout) {
        extras["layout"] = action.data.defaults.layout;
      }
    }
    return Object.assign({}, state, extras);

  case types.APPLY_FILTER_QUERY:
    // values arrive as array
    const filters = Object.assign({}, state.filters, {});
    filters[action.fields] = action.values;
    // console.log(filters)
    return Object.assign({}, state, {
      filters
    });
  case types.TOGGLE_MUT_TYPE:
    return Object.assign({}, state, {
      mutType: action.data
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
      }
    )});
  default:
    return state;
  }
};

export default Controls;
