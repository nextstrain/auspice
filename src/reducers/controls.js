/*eslint dot-notation: 0*/
import * as types from "../actions/types";
import * as globals from "../util/globals";
import getColorScale from "../util/getColorScale";
import moment from 'moment';
import d3 from "d3";

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
    layout: globals.defaultLayout,
    distanceMeasure: globals.defaultDistanceMeasure,
    dateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    dateMax: moment().format("YYYY-MM-DD"),
    absoluteDateMin: moment().subtract(globals.defaultDateRange, "years").format("YYYY-MM-DD"),
    absoluteDateMax: moment().format("YYYY-MM-DD"),
    colorBy: globals.defaultColorBy,
    colorScale: getColorScale(globals.defaultColorBy, {}, {}, {}, 1),
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
    return Object.assign({}, state, {
      colorBy: action.data
    });
  case types.SET_COLOR_SCALE:
    return Object.assign({}, state, {
      colorScale: action.data
    });
  case types.CHANGE_GEO_RESOLUTION:
    return Object.assign({}, state, {
      geoResolution: action.data
    });
  /* metadata in may affect the date ranges... */
  case types.RECEIVE_METADATA:
    const dates = {};
    /* do each of the 4 conditions manually as they're different... */
    if ("absoluteDateMin" in action) {
      dates["absoluteDateMin"] = action["absoluteDateMin"];
    }
    if ("absoluteDateMax" in action) {
      dates["absoluteDateMax"] = action["absoluteDateMax"];
    }
    /* only change the dateMax / dateMin *if* they're outside bounds */
    if ("dateMax" in action) {
      dates["dateMax"] = action["dateMax"];
    }
    if ("dateMin" in action) {
      dates["dateMin"] = action["dateMin"];
    }
    return Object.assign({}, state, dates);
  case types.APPLY_FILTER_QUERY:
    // values arrive as array
    const filters = Object.assign({}, state.filters, {});
    filters[action.fields] = action.values;
    return Object.assign({}, state, {
      filters
    });
  default:
    return state;
  }
};

export default Controls;
