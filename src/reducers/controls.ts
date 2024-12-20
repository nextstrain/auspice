import { numericToCalendar, calendarToNumeric, currentNumDate, currentCalDate } from "../util/dateHelpers";
import { defaultGeoResolution,
  defaultColorBy,
  defaultDateRange,
  defaultDistanceMeasure,
  defaultLayout,
  defaultFocus,
  controlsHiddenWidth,
  strainSymbol,
  twoColumnBreakpoint } from "../util/globals";
import * as types from "../actions/types";
import { calcBrowserDimensionsInitialState } from "./browserDimensions";
import { doesColorByHaveConfidence } from "../actions/recomputeReduxState";
import { hasMultipleGridPanels } from "../actions/panelDisplay";
import { Distance } from "../components/tree/phyloTree/types";
import { MeasurementsDisplay } from "./measurements/types";


export interface ColorScale {
  colorBy: string
  continuous: boolean
  domain?: unknown[]
  genotype: Genotype | null
  legendBounds?: LegendBounds
  legendLabels?: LegendLabels
  legendValues: LegendValues
  scale: (value: any) => string
  scaleType: ScaleType | null
  version: number
  visibleLegendValues: LegendValues
}

export interface Genotype {
  gene: string
  positions: number[]
  aa: boolean
}

export type Layout = "rect" | "radial" | "unrooted" | "clock" | "scatter"

export type LegendBounds = {
  [key: string | number]: [number, number]
}

/** A map of legendValues to a value for display in the legend. */
export type LegendLabels = Map<unknown, unknown>

/** An array of values to display in the legend. */
// TODO: I think this should be number[] | string[] but that requires adding type guards
export type LegendValues = any[]

export type PerformanceFlags = Map<string, boolean>

export interface SelectedNode {
  existingFilterState: "active" | "inactive" | null
  idx: number
  isBranch: boolean
  name: string
  treeId: string
}

export type ScaleType = "ordinal" | "categorical" | "continuous" | "temporal" | "boolean"

export interface ScatterVariables {
  showBranches?: boolean
  showRegression?: boolean
  x?: string
  xContinuous?: boolean
  xDomain?: number[]
  xTemporal?: boolean
  y?: string
  yContinuous?: boolean
  yDomain?: number[]
  yTemporal?: boolean
}

export interface TemporalConfidence {
  exists: boolean
  display: boolean
  on: boolean
}

interface Defaults {
  distanceMeasure: Distance
  layout: Layout
  focus: boolean
  geoResolution: string
  filters: Record<string, unknown>
  filtersInFooter: string[]
  colorBy: string
  selectedBranchLabel: string
  tipLabelKey: string | symbol
  showTransmissionLines: boolean
  sidebarOpen?: boolean
}

export interface BasicControlsState {
  defaults: Defaults

  absoluteDateMax: string
  absoluteDateMaxNumeric: number
  absoluteDateMin: string
  absoluteDateMinNumeric: number
  analysisSlider: boolean
  animationPlayPauseButton: "Play" | "Pause"
  available?: boolean
  branchLengthsToDisplay: string
  canRenderBranchLabels: boolean
  canTogglePanelLayout: boolean
  colorBy: string
  colorByConfidence: boolean
  coloringsPresentOnTree: Set<string>

  /** subset of coloringsPresentOnTree */
  coloringsPresentOnTreeWithConfidence: Set<string>

  colorScale?: ColorScale
  dateMax: string
  dateMaxNumeric: number
  dateMin: string
  dateMinNumeric: number
  distanceMeasure: Distance
  explodeAttr?: string
  filters: Record<string | symbol, Array<{ value: string, active: boolean }>>
  filtersInFooter: string[]
  focus: boolean
  geoResolution: string
  layout: Layout
  mapAnimationCumulative: boolean
  mapAnimationDurationInMilliseconds: number
  mapAnimationShouldLoop: boolean
  mapAnimationStartDate: unknown
  modal: 'download' | 'linkOut' | null
  normalizeFrequencies: boolean
  panelLayout: string
  panelsAvailable: string[]
  panelsToDisplay: string[]
  performanceFlags: PerformanceFlags
  quickdraw: boolean
  scatterVariables: ScatterVariables
  selectedBranchLabel: string
  selectedNode: SelectedNode | null
  showAllBranchLabels: boolean
  showOnlyPanels: boolean
  showTangle: boolean
  showTransmissionLines: boolean
  showTreeToo: boolean
  sidebarOpen: boolean
  temporalConfidence: TemporalConfidence
  tipLabelKey: string | symbol
  zoomMax?: number
  zoomMin?: number
}

export interface MeasurementFilters {
  [key: string]: Map<string, {active: boolean}>
}
export interface MeasurementsControlState {
  measurementsGroupBy: string | undefined
  measurementsDisplay: MeasurementsDisplay | undefined
  measurementsShowOverallMean: boolean | undefined
  measurementsShowThreshold: boolean | undefined
  measurementsFilters: MeasurementFilters
  measurementsColorGrouping: string | undefined
}

export interface ControlsState extends BasicControlsState, MeasurementsControlState {}

/* defaultState is a fn so that we can re-create it
at any time, e.g. if we want to revert things (e.g. on dataset change)
*/
export const getDefaultControlsState = (): ControlsState => {
  const defaults: Defaults = {
    distanceMeasure: defaultDistanceMeasure,
    layout: defaultLayout,
    focus: defaultFocus,
    geoResolution: defaultGeoResolution,
    filters: {},
    filtersInFooter: [],
    colorBy: defaultColorBy,
    selectedBranchLabel: "none",
    tipLabelKey: strainSymbol,
    showTransmissionLines: true
  };
  // a default sidebarOpen status is only set via JSON, URL query
  // _or_ if certain URL keywords are triggered
  const initialSidebarState = getInitialSidebarState();
  if (initialSidebarState.setDefault) {
    defaults.sidebarOpen = initialSidebarState.sidebarOpen;
  }

  const dateMin = numericToCalendar(currentNumDate() - defaultDateRange);
  const dateMax = currentCalDate();
  const dateMinNumeric = calendarToNumeric(dateMin);
  const dateMaxNumeric = calendarToNumeric(dateMax);
  return {
    defaults,
    available: undefined,
    canTogglePanelLayout: true,
    temporalConfidence: { exists: false, display: false, on: false },
    layout: defaults.layout,
    scatterVariables: {},
    distanceMeasure: defaults.distanceMeasure,
    focus: defaults.focus,
    dateMin,
    dateMinNumeric,
    dateMax,
    dateMaxNumeric,
    absoluteDateMin: dateMin,
    absoluteDateMinNumeric: dateMinNumeric,
    absoluteDateMax: dateMax,
    absoluteDateMaxNumeric: dateMaxNumeric,
    colorBy: defaults.colorBy,
    colorByConfidence: false,
    colorScale: undefined,
    coloringsPresentOnTree: new Set(),
    coloringsPresentOnTreeWithConfidence: new Set(),
    explodeAttr: undefined,
    selectedBranchLabel: "none",
    showAllBranchLabels: false,
    selectedNode: null,
    canRenderBranchLabels: true,
    analysisSlider: false,
    geoResolution: defaults.geoResolution,
    filters: JSON.parse(JSON.stringify(defaults.filters)),
    filtersInFooter: JSON.parse(JSON.stringify(defaults.filtersInFooter)),
    modal: null,
    quickdraw: false, // if true, components may skip expensive computes.
    mapAnimationDurationInMilliseconds: 30000, // in milliseconds
    mapAnimationStartDate: null, // Null so it can pull the absoluteDateMin as the default
    mapAnimationCumulative: false,
    mapAnimationShouldLoop: false,
    animationPlayPauseButton: "Play",
    panelsAvailable: [],
    panelsToDisplay: [],
    panelLayout: calcBrowserDimensionsInitialState().width > twoColumnBreakpoint ? "grid" : "full",
    tipLabelKey: defaults.tipLabelKey,
    showTreeToo: false,
    showTangle: false,
    zoomMin: undefined,
    zoomMax: undefined,
    branchLengthsToDisplay: "divAndDate",
    sidebarOpen: initialSidebarState.sidebarOpen,
    showOnlyPanels: false,
    showTransmissionLines: true,
    normalizeFrequencies: true,
    measurementsGroupBy: undefined,
    measurementsDisplay: undefined,
    measurementsShowOverallMean: undefined,
    measurementsShowThreshold: undefined,
    measurementsColorGrouping: undefined,
    measurementsFilters: {},
    performanceFlags: new Map(),
  };
};

/**
 * Keeping measurements control state separate from getDefaultControlsState
 * in order to be able to differentiate when the page is loaded with and without
 * URL params for the measurements panel.
 *
 * The initial control state is constructed then the URL params update the state.
 * However, the measurements JSON is loaded after this, so it needs a way to
 * differentiate the clean slate vs the added URL params.
 */
export const defaultMeasurementsControlState: MeasurementsControlState = {
  measurementsGroupBy: undefined,
  measurementsDisplay: "mean",
  measurementsShowOverallMean: true,
  measurementsShowThreshold: true,
  measurementsFilters: {},
  measurementsColorGrouping: undefined,
};

/* while this may change, div currently doesn't have CIs, so they shouldn't be displayed. */
export const shouldDisplayTemporalConfidence = (exists, distMeasure, layout) => exists && distMeasure === "num_date" && layout === "rect";

const Controls = (state: ControlsState = getDefaultControlsState(), action): ControlsState => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      return action.controls;
    case types.SET_AVAILABLE:
      return Object.assign({}, state, { available: action.data });
    case types.CHANGE_EXPLODE_ATTR:
      return Object.assign({}, state, {
        explodeAttr: action.explodeAttr,
        colorScale: Object.assign({}, state.colorScale, { visibleLegendValues: action.visibleLegendValues })
      });
    case types.CHANGE_BRANCH_LABEL:
      return Object.assign({}, state, { selectedBranchLabel: action.value });
    case types.TOGGLE_SHOW_ALL_BRANCH_LABELS:
      return Object.assign({}, state, { showAllBranchLabels: action.value });
    case types.CHANGE_LAYOUT:
      return Object.assign({}, state, {
        layout: action.layout,
        canRenderBranchLabels: action.canRenderBranchLabels,
        scatterVariables: action.scatterVariables,
        /* temporal confidence can only be displayed for rectangular trees */
        temporalConfidence: Object.assign({}, state.temporalConfidence, {
          display: shouldDisplayTemporalConfidence(
            state.temporalConfidence.exists,
            state.distanceMeasure,
            action.data
          ),
          on: false
        })
      });
    case types.CHANGE_DISTANCE_MEASURE: {
      const updatesToState: Partial<ControlsState> = {
        distanceMeasure: action.data,
        branchLengthsToDisplay: state.branchLengthsToDisplay
      };
      if (
        shouldDisplayTemporalConfidence(state.temporalConfidence.exists, action.data, state.layout)
      ) {
        updatesToState.temporalConfidence = Object.assign({}, state.temporalConfidence, {
          display: true
        });
      } else {
        updatesToState.temporalConfidence = Object.assign({}, state.temporalConfidence, {
          display: false,
          on: false
        });
      }
      return Object.assign({}, state, updatesToState);
    }
    case types.TOGGLE_FOCUS: {
      return {...state, focus: !state.focus}
    }
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: {
      const newDates: Partial<ControlsState> = { quickdraw: action.quickdraw };
      if (action.dateMin) {
        newDates.dateMin = action.dateMin;
        newDates.dateMinNumeric = action.dateMinNumeric;
      }
      if (action.dateMax) {
        newDates.dateMax = action.dateMax;
        newDates.dateMaxNumeric = action.dateMaxNumeric;
      }
      const colorScale = {...state.colorScale, visibleLegendValues: action.visibleLegendValues};
      return {...state, ...newDates, colorScale};
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
    case types.CHANGE_TIP_LABEL_KEY:
      return {...state, tipLabelKey: action.key};
    case types.TREE_TOO_DATA:
      return action.controls;
    case types.TOGGLE_PANEL_DISPLAY:
      return Object.assign({}, state, {
        panelsToDisplay: action.panelsToDisplay,
        panelLayout: action.panelLayout,
        canTogglePanelLayout: action.canTogglePanelLayout
      });
    case types.NEW_COLORS: {
      const newState = Object.assign({}, state, {
        colorBy: action.colorBy,
        colorScale: action.colorScale,
        colorByConfidence: doesColorByHaveConfidence(state, action.colorBy)
      });
      if (action.scatterVariables) {
        newState.scatterVariables = action.scatterVariables;
      }
      return newState;
    }
    case types.CHANGE_GEO_RESOLUTION:
      return Object.assign({}, state, {
        geoResolution: action.data
      });

    case types.SELECT_NODE: {
      /**
       * We don't store a (reference to) the node itself as that breaks redux's immutability checking,
       * instead we store the information needed to access it from the nodes array(s)
       */
      const existingFilterInfo = (state.filters?.[strainSymbol]||[]).find((info) => info.value===action.name);
      const existingFilterState = existingFilterInfo === undefined ? null :
        existingFilterInfo.active ? 'active' : 'inactive';
      const selectedNode: SelectedNode = {name: action.name, idx: action.idx, existingFilterState, isBranch: action.isBranch, treeId: action.treeId};
      return {...state, selectedNode};
    }
    case types.DESELECT_NODE: {
      return {...state, selectedNode: null}
    }
    case types.APPLY_FILTER: {
      // values arrive as array
      const filters = Object.assign({}, state.filters, {});
      if (action.values.length) { // set the filters to the new values
        filters[action.trait] = action.values;
      } else {                    // remove if no active+inactive filters
        delete filters[action.trait]
      }

      /* In the situation where a node-selected modal is active + we have
      removed or inactivated the corresponding filter, then we want to remove
      the modal */
      let selectedNode = state.selectedNode
      if (selectedNode) {
        const filterInfo = filters?.[strainSymbol]?.find((f)=>f.value===selectedNode.name);
        if (!filterInfo || !filterInfo.active) {
          selectedNode = null;
        }
      }
      return Object.assign({}, state, {
        filters,
        selectedNode,
      });
    }
    case types.TOGGLE_TEMPORAL_CONF:
      return Object.assign({}, state, {
        temporalConfidence: Object.assign({}, state.temporalConfidence, {
          on: !state.temporalConfidence.on
        })
      });
    case types.SET_MODAL:
      return Object.assign({}, state, {
        modal: action.modal || null
      });
    case types.REMOVE_TREE_TOO:
      return Object.assign({}, state, {
        showTreeToo: false,
        showTangle: false,
        canTogglePanelLayout: hasMultipleGridPanels(state.panelsAvailable),
        panelsToDisplay: state.panelsAvailable.slice()
      });
    case types.TOGGLE_TANGLE:
      if (state.showTreeToo) {
        return Object.assign({}, state, { showTangle: !state.showTangle });
      }
      return state;
    case types.TOGGLE_SIDEBAR:
      return Object.assign({}, state, { sidebarOpen: action.value });
    case types.TOGGLE_LEGEND:
      return Object.assign({}, state, { legendOpen: action.value });
    case types.ADD_EXTRA_METADATA: {
      for (const colorBy of Object.keys(action.newColorings)) {
        state.coloringsPresentOnTree.add(colorBy);
      }
      let newState = Object.assign({}, state, { coloringsPresentOnTree: state.coloringsPresentOnTree, filters: state.filters });
      if (action.newGeoResolution && !state.panelsAvailable.includes("map")) {
        newState = {
          ...newState,
          geoResolution: action.newGeoResolution.key,
          canTogglePanelLayout: hasMultipleGridPanels([...state.panelsToDisplay, "map"]),
          panelsAvailable: [...state.panelsAvailable, "map"],
          panelsToDisplay: [...state.panelsToDisplay, "map"]
        };
      }
      return newState;
    }
    case types.REMOVE_METADATA: {
      const coloringsPresentOnTree = new Set(state.coloringsPresentOnTree);
      action.nodeAttrsToRemove.forEach((colorBy: string): void => {
        coloringsPresentOnTree.delete(colorBy);
      })
      return {...state, coloringsPresentOnTree};
    }
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS: {
      const colorScale = Object.assign({}, state.colorScale, { visibleLegendValues: action.visibleLegendValues });
      return Object.assign({}, state, { colorScale: colorScale });
    }
    case types.TOGGLE_TRANSMISSION_LINES:
      return Object.assign({}, state, { showTransmissionLines: action.data });

    case types.LOAD_FREQUENCIES:
      return {...state, normalizeFrequencies: action.normalizeFrequencies};
    case types.FREQUENCY_MATRIX: {
      if (Object.hasOwnProperty.call(action, "normalizeFrequencies")) {
        return Object.assign({}, state, { normalizeFrequencies: action.normalizeFrequencies });
      }
      return state;
    }
    case types.CHANGE_MEASUREMENTS_COLLECTION: // fallthrough
    case types.CHANGE_MEASUREMENTS_COLOR_GROUPING: // fallthrough
    case types.CHANGE_MEASUREMENTS_DISPLAY: // fallthrough
    case types.CHANGE_MEASUREMENTS_GROUP_BY: // fallthrough
    case types.TOGGLE_MEASUREMENTS_OVERALL_MEAN: // fallthrough
    case types.TOGGLE_MEASUREMENTS_THRESHOLD: // fallthrough
    case types.APPLY_MEASUREMENTS_FILTER:
      return {...state, ...action.controls};
    /**
     * Currently the CHANGE_ZOOM action (entropy panel zoom changed) does not
     * update the zoomMin/zoomMax, and as such they only represent the initially
     * requested zoom range. The following commented out code will keep the
     * state in sync, but corresponding changes will be  required to the entropy
     * code.
     */
    // case types.CHANGE_ZOOM: // this is the entropy panel zoom
    //   return {...state, zoomMin: action.zoomc[0], zoomMax: action.zoomc[1]};
    default:
      return state;
  }
};

export default Controls;

function getInitialSidebarState() {
  return {
    sidebarOpen: window.innerWidth > controlsHiddenWidth,
    setDefault: false
  };
}
