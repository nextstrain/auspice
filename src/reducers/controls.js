import { numericToCalendar, calendarToNumeric, currentNumDate, currentCalDate } from "../util/dateHelpers";
import { defaultGeoResolution,
  defaultColorBy,
  defaultDateRange,
  defaultDistanceMeasure,
  defaultLayout,
  mutType,
  twoColumnBreakpoint } from "../util/globals";
import * as types from "../actions/types";
import { calcBrowserDimensionsInitialState } from "./browserDimensions";
import { checkColorByConfidence } from "../actions/recomputeReduxState";

/* defaultState is a fn so that we can re-create it
at any time, e.g. if we want to revert things (e.g. on dataset change)
*/
export const getDefaultControlsState = () => {
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
    selectedBranchLabel: false,
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
    panelsAvailable: [],
    panelsToDisplay: [],
    panelLayout: calcBrowserDimensionsInitialState().width > twoColumnBreakpoint ? "grid" : "full",
    showTreeToo: false
  };
};

const Controls = (state = getDefaultControlsState(), action) => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      return action.controls;
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
    case types.CHANGE_BRANCH_LABEL:
      return Object.assign({}, state, {selectedBranchLabel: action.value});
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
        quickdraw: action.data !== "Play",
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
    case types.TREE_TOO_DATA:
      return Object.assign({}, state, {showTreeToo: true});
    case types.TOGGLE_PANEL_DISPLAY:
      return Object.assign({}, state, {
        panelsToDisplay: action.panelsToDisplay,
        panelLayout: action.panelLayout,
        canTogglePanelLayout: action.panelsToDisplay.indexOf("tree") !== -1 && action.panelsToDisplay.indexOf("map") !== -1
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
