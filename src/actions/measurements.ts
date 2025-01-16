import { batch } from "react-redux";
import { quantile } from "d3-array";
import { cloneDeep } from "lodash";
import { Colorings } from "../metadata";
import { AppDispatch, ThunkFunction } from "../store";
import { colors, measurementIdSymbol } from "../util/globals";
import { ControlsState, defaultMeasurementsControlState, MeasurementsControlState, MeasurementFilters } from "../reducers/controls";
import { getDefaultMeasurementsState } from "../reducers/measurements";
import { infoNotification, warningNotification } from "./notifications";
import {
  ADD_EXTRA_METADATA,
  APPLY_MEASUREMENTS_FILTER,
  CHANGE_MEASUREMENTS_COLLECTION,
  CHANGE_MEASUREMENTS_COLOR_GROUPING,
  CHANGE_MEASUREMENTS_DISPLAY,
  CHANGE_MEASUREMENTS_GROUP_BY,
  REMOVE_METADATA,
  TOGGLE_MEASUREMENTS_OVERALL_MEAN,
  TOGGLE_MEASUREMENTS_THRESHOLD,
} from "./types";
import {
  Collection,
  asCollection,
  asMeasurement,
  isMeasurementsDisplay,
  measurementsDisplayValues,
  Measurement,
  MeasurementsDisplay,
  MeasurementsJson,
  MeasurementsState,
} from "../reducers/measurements/types";
import { changeColorBy } from "./colors";
import { applyFilter, updateVisibleTipsAndBranchThicknesses } from "./tree";

/**
 * Temp object for groupings to keep track of values and their counts so that
 * we can create a stable default order for grouping field values
 */
interface GroupingValues {
  [key: string]: Map<string, number>
}


/* mf_<field> correspond to active measurements filters */
const filterQueryPrefix = "mf_";
type MeasurementsFilterQuery = `mf_${string}`

type QueryBoolean = "show" | "hide"
const queryBooleanValues: QueryBoolean[] = ["show", "hide"];
export const isQueryBoolean = (x: any): x is QueryBoolean => queryBooleanValues.includes(x)
/* Measurements query parameters that are constructed and/or parsed here. */
interface MeasurementsQuery {
  m_collection?: string
  m_display?: MeasurementsDisplay
  m_groupBy?: string
  m_overallMean?: QueryBoolean
  m_threshold?: QueryBoolean
  [key: MeasurementsFilterQuery]: string[]
}
/**
 * Central Query type placeholder!
 * Expected to be the returned object from querystring.parse()
 * https://nodejs.org/docs/latest-v22.x/api/querystring.html#querystringparsestr-sep-eq-options
 */
interface Query extends MeasurementsQuery {
  [key: string]: string | string[]
}


const hasMeasurementColorAttr = "_hasMeasurementColor";
const hasMeasurementColorValue = "true";
interface MeasurementsNodeAttrs {
  [strain: string]: {
    [key: string]: {
      // number for the average measurements value
      // 'true' for the presence of measurements coloring
      value: number | typeof hasMeasurementColorValue
    }
    [hasMeasurementColorAttr]: {
      value: typeof hasMeasurementColorValue
    }
  }
}

/**
 * Using the `m-` prefix to lower chances of generated measurements coloring
 * from clashing with an existing coloring on the tree (similar to how genotype
 * coloring is prefixed by `gt-`). This is paired with encode/decode functions
 * to ensure we have centralized methods for encoding and decoding the
 * measurements coloring in case we need to expand this in the future
 * (e.g. allow multiple groupingValues).
 */
const measurementColoringPrefix = "m-";
export function isMeasurementColorBy(colorBy: string): boolean {
  return colorBy.startsWith(measurementColoringPrefix);
}
export function encodeMeasurementColorBy(groupingValue: string): string {
  return `${measurementColoringPrefix}${groupingValue}`;
}
export function decodeMeasurementColorBy(colorBy: string): string {
  const prefixPattern = new RegExp(`^${measurementColoringPrefix}`);
  return colorBy.replace(prefixPattern, '');
}

/**
 * Find the collection within collections that has a key matching the provided
 * collectionKey. The default collection is defined by the provided defaultKey.
 *
 * If collectionKey is not provided, returns the default collection.
 * If no matches are found, returns the default collection.
 * If multiple matches are found, only returns the first matching collection.
 */
const getCollectionToDisplay = (
  collections: Collection[],
  collectionKey: string,
  defaultKey: string
): Collection => {
  const defaultCollection = collections.filter((collection) => collection.key === defaultKey)[0];
  if (!collectionKey) return defaultCollection;
  const potentialCollections = collections.filter((collection) => collection.key === collectionKey);
  if (potentialCollections.length === 0) return defaultCollection;
  if (potentialCollections.length > 1) {
    console.error(`Found multiple collections with key ${collectionKey}. Returning the first matching collection only.`);
  }
  return potentialCollections[0];
};

/**
 * Map the controlKey to the default value in collectionDefaults
 * Checks if the collection default is a valid value for the control
 */
function getCollectionDefaultControl(
  controlKey: string,
  collection: Collection
): string | boolean | undefined {
  const collectionControlToDisplayDefaults = {
    measurementsGroupBy: 'group_by',
    measurementsDisplay: 'measurements_display',
    measurementsShowOverallMean: 'show_overall_mean',
    measurementsShowThreshold: 'show_threshold'
  }
  const collectionDefaults = collection["display_defaults"] || {};
  const displayDefaultKey = collectionControlToDisplayDefaults[controlKey];
  let defaultControl = collectionDefaults[displayDefaultKey];
  // Check default is a valid value for the control key
  switch (controlKey) {
    case 'measurementsGroupBy': {
      if (defaultControl === undefined || !collection.groupings.has(defaultControl)) {
        if (defaultControl !== undefined) {
          console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be one of collection's groupings. Using first grouping as default`)
        }
        defaultControl = collection.groupings.keys().next().value;
      }
      break;
    }
    case 'measurementsDisplay': {
      if (defaultControl !== undefined && !isMeasurementsDisplay(defaultControl)) {
        console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be one of ${measurementsDisplayValues}`)
        defaultControl = undefined;
      }
      break;
    }
    case 'measurementsShowOverallMean': {
      if (defaultControl !== undefined && typeof defaultControl !== "boolean") {
        console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be a boolean`)
        defaultControl = undefined;
      }
      break;
    }
    case 'measurementsShowThreshold': {
      if (defaultControl !== undefined) {
        if (!Array.isArray(collection.thresholds) ||
            !collection.thresholds.some((threshold) => typeof threshold === "number")) {
          console.error(`Ignoring ${displayDefaultKey} value because collection does not have valid thresholds`)
          defaultControl = undefined;
        } else if (typeof defaultControl !== "boolean") {
          console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be a boolean`)
          defaultControl = undefined;
        }
      }
      break;
    }
    case 'measurementsColorGrouping': // fallthrough
    case 'measurementsFilters': {
      // eslint-disable-next-line no-console
      console.debug(`Skipping control key ${controlKey} because it does not have default controls`);
      break;
    }
    default:
      console.error(`Skipping unknown control key ${controlKey}`);
  }
  return defaultControl;
}

/**
 * Returns the default control state for the provided collection
 * Returns teh default control state for the app if the collection is not loaded yet
 */
function getCollectionDefaultControls(collection: Collection): MeasurementsControlState {
  const defaultControls = {...defaultMeasurementsControlState};
  if (Object.keys(collection).length) {
    for (const [key, value] of Object.entries(defaultControls)) {
      const collectionDefault = getCollectionDefaultControl(key, collection);
      defaultControls[key] = collectionDefault !== undefined ? collectionDefault : value;
    }
  }
  return defaultControls;
}

/**
 * Constructs the controls redux state for the measurements panel based on
 * config values within the provided collection.
 *
 * If no display defaults are provided, uses the current controls redux state.
 * If the current `measurementsGrouping` does not exist in the collection, then
 * defaults to the first grouping option.
 */
const getCollectionDisplayControls = (
  controls: ControlsState,
  collection: Collection
): MeasurementsControlState => {
  // Copy current control options for measurements
  const newControls = cloneDeep(defaultMeasurementsControlState);
  Object.entries(controls).forEach(([key, value]) => {
    if (key in newControls) {
      newControls[key] = cloneDeep(value);
    }
  })
  // Checks the current group by is available as a grouping in collection
  // If it doesn't exist, set to undefined so it will get filled in with collection's default
  if (!collection.groupings.has(newControls.measurementsGroupBy)) {
    newControls.measurementsGroupBy = undefined
  }

  // Verify that current filters are valid for the new collection
  newControls.measurementsFilters = Object.fromEntries(
    Object.entries(newControls.measurementsFilters)
      .map(([field, valuesMap]): [string, Map<string, {active: boolean}>] => {
        // Clone nested Map to avoid changing redux state in place
        // Delete filter for values that do not exist within the field of the new collection
        const newValuesMap = new Map([...valuesMap].filter(([value]) => {
          return collection.filters.get(field)?.values.has(value)
        }));
        return [field, newValuesMap];
      })
      .filter(([field, valuesMap]) => {
        // Delete filter for field that does not exist in the new collection filters
        // or filters where none of the values are valid
        return collection.filters.has(field) && valuesMap.size;
      })
  )

  // Ensure controls use collection's defaults or app defaults if this is
  // the initial loading of the measurements JSON
  const collectionDefaultControls = getCollectionDefaultControls(collection);
  for (const [key, value] of Object.entries(newControls)) {
    // Skip values that are not undefined because this indicates they are URL params or existing controls
    if (value !== undefined) continue;
    newControls[key] = collectionDefaultControls[key]
  }

  // Remove the color grouping value if it is not included for the new group by
  const groupingValues = collection.groupings.get(newControls.measurementsGroupBy).values || [];
  if (newControls.measurementsColorGrouping !== undefined && !groupingValues.includes(newControls.measurementsColorGrouping)) {
    newControls.measurementsColorGrouping = undefined;
  }

  return newControls;
};

const parseMeasurementsJSON = (json: MeasurementsJson): MeasurementsState => {
  const jsonCollections = json["collections"];
  if (!jsonCollections || jsonCollections.length === 0) {
    throw new Error("Measurements JSON does not have collections");
  }

  // Collection properties with the same type as JsonCollection properties.
  const propertiesWithSameType = ["key", "x_axis_label", "display_defaults", "thresholds", "title"];

  const collections = jsonCollections.map((jsonCollection): Collection => {
    const collection: Partial<Collection> = {};
    // Check for properties with the same type that can be directly copied
    for (const collectionProp of propertiesWithSameType) {
      if (collectionProp in jsonCollection) {
        collection[collectionProp] = cloneDeep(jsonCollection[collectionProp]);
      }
    }
    /**
     * Keep backwards compatibility with single value threshold.
     * Make sure thresholds are an array of values so that we don't have to
     * check the data type in the D3 drawing process
     * `collection.thresholds` takes precedence over the deprecated `collection.threshold`
     */
    if (typeof jsonCollection.threshold === "number") {
      collection.thresholds = collection.thresholds || [jsonCollection.threshold];
    }
    /*
     * Create fields Map for easier access of titles and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add any remaining fields
     */
    collection.fields = new Map(
      (jsonCollection.fields || [])
        .map(({key, title}): [string, {title: string}] => [key, {title: title || key}])
    );

    /**
     * Create filters Map for easier access of values and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add values
     * If there are no JSON defined filters, then add all fields as filters
     */
    const collectionFiltersArray = jsonCollection.filters;
    collection.filters = new Map(
      (jsonCollection.filters || [])
        .map((filterField): [string, {values: Set<string>}] => [filterField, {values: new Set()}])
    );

    // Create a temp object for groupings to keep track of values and their
    // counts so that we can create a stable default order for grouping field values
    const groupingsValues: GroupingValues = jsonCollection.groupings.reduce((tempObject, {key}) => {
      tempObject[key] = new Map();
      return tempObject;
    }, {});

    collection.measurements = jsonCollection.measurements.map((jsonMeasurement, index): Measurement => {
      const parsedMeasurement: Partial<Measurement> = {
        [measurementIdSymbol]: index
      }
      Object.entries(jsonMeasurement).forEach(([field, fieldValue]) => {
        /**
         * Convert all measurements metadata (except the `value`) to strings
         * for proper matching with filter queries.
         * This does mean the the `value` cannot be used as a field filter.
         * We can revisit this decision when adding types to measurementsD3
         * because converting `value` to string resulted in a lot of calculation errors
         */
        if (field === "value") {
          parsedMeasurement[field] = Number(fieldValue);
        } else {
          const fieldValueString = fieldValue.toString();
          parsedMeasurement[field] = fieldValueString;

          // Add remaining field titles
          if (!collection.fields.has(field)) {
            collection.fields.set(field, {title: field});
          }

          // Only save the unique values if the field is in defined filters
          // OR there are no JSON defined filters, so all fields are filters
          if ((collection.filters.has(field)) || !collectionFiltersArray) {
            const filterObject = collection.filters.get(field) || { values: new Set()};
            filterObject.values.add(fieldValueString);
            collection.filters.set(field, filterObject);
          }

          // Save grouping field values and counts
          if (field in groupingsValues) {
            const previousValue = groupingsValues[field].get(fieldValueString);
            groupingsValues[field].set(fieldValueString, previousValue ? previousValue + 1 : 1);
          }
        }
      });

      return asMeasurement(parsedMeasurement);
    });

    // Create groupings Map for easier access of sorted values and to keep groupings ordering
    // Must be done after looping through measurements to build `groupingsValues` object
    collection.groupings = new Map(
      jsonCollection.groupings.map(({key, order}): [string, {values: string[]}] => {
        const defaultOrder = order ? order.map((x) => x.toString()) : [];
        const valuesByCount = [...groupingsValues[key].entries()]
          // Use the grouping values' counts to sort the values, highest count first
          .sort(([, valueCountA], [, valueCountB]) => valueCountB - valueCountA)
          // Filter out values that already exist in provided order from JSON
          .filter(([fieldValue]) => !defaultOrder.includes(fieldValue))
          // Create array of field values
          .map(([fieldValue]) => fieldValue);

        return [
          key,
          // Prioritize the provided values order then list values by count
          {values: (defaultOrder).concat(valuesByCount)}
        ];
      })
    );

    return asCollection(collection);
  });

  const collectionKeys = collections.map((collection) => collection.key);
  let defaultCollectionKey = json["default_collection"];
  if (!collectionKeys.includes(defaultCollectionKey)) {
    defaultCollectionKey = collectionKeys[0];
  }
  const collectionToDisplay = collections.filter((collection) => collection.key === defaultCollectionKey)[0];
  return {
    loaded: true,
    error: undefined,
    defaultCollectionKey,
    collections,
    collectionToDisplay
  }
};

export const loadMeasurements = (
  measurementsData: MeasurementsJson | Error,
  dispatch: AppDispatch
): MeasurementsState => {
  let measurementState = getDefaultMeasurementsState();
  /* Just return default state there are no measurements data to load */
  if (!measurementsData) {
    return measurementState
  }

  let warningMessage = "";
  if (measurementsData instanceof Error) {
    console.error(measurementsData);
    warningMessage = "Failed to fetch measurements collections";
  } else {
    try {
      measurementState = { ...measurementState, ...parseMeasurementsJSON(measurementsData) };
    } catch (error) {
      console.error(error);
      warningMessage = "Failed to parse measurements collections";
    }
  }

  if (warningMessage) {
    measurementState.error = warningMessage;
    dispatch(warningNotification({ message: warningMessage }));
  }

  return measurementState;
};

export const changeMeasurementsCollection = (
  newCollectionKey: string
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const collectionToDisplay = getCollectionToDisplay(measurements.collections, newCollectionKey, measurements.defaultCollectionKey);
  const newControls = getCollectionDisplayControls(controls, collectionToDisplay);
  const queryParams = createMeasurementsQueryFromControls(newControls, collectionToDisplay, measurements.defaultCollectionKey);

  batch(() => {
    dispatch({
      type: CHANGE_MEASUREMENTS_COLLECTION,
      collectionToDisplay,
      controls: newControls,
      queryParams
    });

    /* After the collection has been updated, update the measurement coloring data if needed */
    updateMeasurementsColorData(
      newControls.measurementsColorGrouping,
      controls.measurementsColorGrouping,
      controls.colorBy,
      controls.defaults.colorBy,
      dispatch
    );
  });
};

function updateMeasurementsFilters(
  newFilters: MeasurementFilters,
  controls: ControlsState,
  measurements: MeasurementsState,
  dispatch: AppDispatch
): void {
  const newControls: Partial<MeasurementsControlState> = {
    measurementsFilters: newFilters,
  }
  batch(() => {
    dispatch({
      type: APPLY_MEASUREMENTS_FILTER,
      controls: newControls,
      queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay, measurements.defaultCollectionKey)
    });

    /**
     * Filtering does _not_ affect the measurementsColorGrouping value, but
     * the measurements metadata does need to be updated to reflect the
     * filtered measurements
     */
    updateMeasurementsColorData(
      controls.measurementsColorGrouping,
      controls.measurementsColorGrouping,
      controls.colorBy,
      controls.defaults.colorBy,
      dispatch
    );
  });
}

/*
 * The filter actions below will create a copy of `controls.measurementsFilters`
 * then clone the nested Map to avoid changing the redux state in place.
 * Tried to use lodash.cloneDeep(), but it did not work for the nested Map
 * - Jover, 19 January 2022
 */
export const applyMeasurementFilter = (
  field: string,
  value: string,
  active: boolean
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  measurementsFilters[field].set(value, {active});

  updateMeasurementsFilters(measurementsFilters, controls, measurements, dispatch);
};

export const removeSingleFilter = (
  field: string,
  value: string
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  measurementsFilters[field].delete(value);

  // If removing the single filter leaves 0 filters for the field, completely
  // remove the field from the filters state
  if (measurementsFilters[field].size === 0) {
    delete measurementsFilters[field];
  }

  updateMeasurementsFilters(measurementsFilters, controls, measurements, dispatch);
};

export const removeAllFieldFilters = (
  field: string
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  delete measurementsFilters[field];

  updateMeasurementsFilters(measurementsFilters, controls, measurements, dispatch);
};

export const toggleAllFieldFilters = (
  field: string,
  active: boolean
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  for (const fieldValue of measurementsFilters[field].keys()) {
    measurementsFilters[field].set(fieldValue, {active});
  }
  updateMeasurementsFilters(measurementsFilters, controls, measurements, dispatch);
};

export const toggleOverallMean = (): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsShowOverallMean";
  const newControls = { [controlKey]: !controls[controlKey] };

  dispatch({
    type: TOGGLE_MEASUREMENTS_OVERALL_MEAN,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay, measurements.defaultCollectionKey)
  });
}

export const toggleThreshold = (): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsShowThreshold";
  const newControls = { [controlKey]: !controls[controlKey] };

  dispatch({
    type: TOGGLE_MEASUREMENTS_THRESHOLD,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay, measurements.defaultCollectionKey)
  });
};

export const changeMeasurementsDisplay = (
  newDisplay: MeasurementsDisplay
): ThunkFunction => (dispatch, getState) => {
  const { measurements } = getState();
  const controlKey = "measurementsDisplay";
  const newControls = { [controlKey]: newDisplay };

  dispatch({
    type: CHANGE_MEASUREMENTS_DISPLAY,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay, measurements.defaultCollectionKey)
  });
}

export const changeMeasurementsGroupBy = (
  newGroupBy: string
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const groupingValues = measurements.collectionToDisplay.groupings.get(newGroupBy).values || [];
  const newControls: Partial<MeasurementsControlState> = {
    /* If the measurementsColorGrouping is no longer valid, then set to undefined */
    measurementsColorGrouping: groupingValues.includes(controls.measurementsColorGrouping)
      ? controls.measurementsColorGrouping
      : undefined,
    measurementsGroupBy: newGroupBy
  };

  batch(() => {
    dispatch({
      type: CHANGE_MEASUREMENTS_GROUP_BY,
      controls: newControls,
      queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay, measurements.defaultCollectionKey)
    });

    /* After the group by has been updated, update the measurement coloring data if needed */
    updateMeasurementsColorData(
      newControls.measurementsColorGrouping,
      controls.measurementsColorGrouping,
      controls.colorBy,
      controls.defaults.colorBy,
      dispatch
    );
  })
}

export function getActiveMeasurementFilters(
  filters: MeasurementFilters
): {string?: string[]} {
  // Find active filters to filter measurements
  const activeFilters: {string?: string[]} = {};
  Object.entries(filters).forEach(([field, valuesMap]) => {
    activeFilters[field] = activeFilters[field] || [];
    valuesMap.forEach(({active}, fieldValue) => {
      // Save array of active values for the field filter
      if (active) activeFilters[field].push(fieldValue);
    });
  });
  return activeFilters;
}

export function matchesAllActiveFilters(
  measurement: Measurement,
  activeFilters: {string?: string[]}
): boolean {
  for (const [field, values] of Object.entries(activeFilters)) {
    const measurementValue = measurement[field];
    if (values.length > 0 &&
       ((typeof measurementValue === "string") && !values.includes(measurementValue))){
      return false;
    }
  }
  return true;
}

function createMeasurementsColoringData(
  filters: MeasurementFilters,
  groupBy: string,
  groupingValue: string,
  collection: Collection,
): {
  nodeAttrs: MeasurementsNodeAttrs,
  colorings: Colorings,
} {
  const measurementColorBy = encodeMeasurementColorBy(groupingValue);
  const activeMeasurementFilters = getActiveMeasurementFilters(filters);
  const strainMeasurementValues: {[strain: string]: number[]} = collection.measurements
    .filter((m) => m[groupBy] === groupingValue && matchesAllActiveFilters(m, activeMeasurementFilters))
    .reduce((accum, m) => {
      (accum[m.strain] = accum[m.strain] || []).push(m.value)
      return accum
    }, {});

  const nodeAttrs: MeasurementsNodeAttrs = {};
  for (const [strain, measurements] of Object.entries(strainMeasurementValues)) {
    const averageMeasurementValue = measurements.reduce((sum, value) => sum + value) / measurements.length;
    nodeAttrs[strain] = {
      [measurementColorBy]: {
        value: averageMeasurementValue
      },
      [hasMeasurementColorAttr]: {
        value: hasMeasurementColorValue
      }
    };
  }
  const sortedValues = collection.measurements
    .map((m) => m.value)
    .sort((a, b) => a - b);

  // Matching the default coloring for continuous scales
  const colorRange = colors[9];
  const step = 1 / (colorRange.length - 1);
  const measurementsColorScale: [number, string][] = colorRange.map((color, i) => {
    return [quantile(sortedValues, (step * i)), color]
  });

  return {
    nodeAttrs,
    colorings: {
      [measurementColorBy]: {
        title: `Measurements (${groupingValue})`,
        type: "continuous",
        scale: measurementsColorScale,
      },
      [hasMeasurementColorAttr]: {
        title: `Has measurements for ${groupingValue}`,
        type: "boolean",
      }
    }
  };
}

const addMeasurementsColorData = (
  groupingValue: string
): ThunkFunction => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const { nodeAttrs, colorings } = createMeasurementsColoringData(
    controls.measurementsFilters,
    controls.measurementsGroupBy,
    groupingValue,
    measurements.collectionToDisplay,
  );

  dispatch({type: ADD_EXTRA_METADATA, newNodeAttrs: nodeAttrs, newColorings: colorings});
}

function updateMeasurementsColorData(
  newColorGrouping: string,
  oldColorGrouping: string,
  currentColorBy: string,
  defaultColorBy: string,
  dispatch: AppDispatch,
): void {
  /* Remove the measurement metadata and coloring for the old grouping */
  if (oldColorGrouping !== undefined) {
    /* Fallback to the default coloring because the measurements coloring is no longer valid */
    if (newColorGrouping !== oldColorGrouping &&
        currentColorBy === encodeMeasurementColorBy(oldColorGrouping)) {
      dispatch(infoNotification({
        message: "Measurement coloring is no longer valid",
        details: "Falling back to the default color-by"
      }));
      dispatch(changeColorBy(defaultColorBy));
      dispatch(applyFilter("remove", hasMeasurementColorAttr, [hasMeasurementColorValue]));
    }
    dispatch({
      type: REMOVE_METADATA,
      nodeAttrsToRemove: [hasMeasurementColorAttr, encodeMeasurementColorBy(oldColorGrouping)],
    })
  }
  /* If there is a valid new color grouping, then add the measurement metadata and coloring */
  if (newColorGrouping !== undefined) {
    dispatch(addMeasurementsColorData(newColorGrouping));
    dispatch(updateVisibleTipsAndBranchThicknesses());
  }
}

export const applyMeasurementsColorBy = (
  groupingValue: string
): ThunkFunction => (dispatch, getState) => {
  const { controls } = getState();
  /**
   * Batching all dispatch actions together to prevent multiple renders
   * This is also _required_ to prevent error in calcColorScale during extra renders:
   * 1. REMOVE_METADATA removes current measurements coloring from metadata.colorings
   * 2. This triggers the componentDidUpdate in controls/color-by, which dispatches changeColorBy.
   * 3. calcColorScale throws error because the current coloring is no longer valid as it was removed by REMOVE_METADATA in step 1.
   */
  batch(() => {
    if (controls.measurementsColorGrouping !== undefined) {
      dispatch({type: REMOVE_METADATA, nodeAttrsToRemove: [hasMeasurementColorAttr, encodeMeasurementColorBy(controls.measurementsColorGrouping)]});
    }
    if (controls.measurementsColorGrouping !== groupingValue) {
      dispatch({type: CHANGE_MEASUREMENTS_COLOR_GROUPING, controls:{measurementsColorGrouping: groupingValue}});
    }
    dispatch(addMeasurementsColorData(groupingValue));
    dispatch(changeColorBy(encodeMeasurementColorBy(groupingValue)));
    dispatch(applyFilter("add", hasMeasurementColorAttr, [hasMeasurementColorValue]))
  });
}

const controlToQueryParamMap = {
  measurementsDisplay: "m_display",
  measurementsGroupBy: "m_groupBy",
  measurementsShowOverallMean: "m_overallMean",
  measurementsShowThreshold: "m_threshold",
};

export function removeInvalidMeasurementsFilterQuery(
  query: Query,
  newQueryParams: {[key: MeasurementsFilterQuery]: string}
): Query {
  const newQuery = cloneDeep(query);
  // Remove measurements filter query params that are not included in the newQueryParams
  Object.keys(query)
    .filter((queryParam) => queryParam.startsWith(filterQueryPrefix) && !(queryParam in newQueryParams))
    .forEach((queryParam) => delete newQuery[queryParam]);
  return newQuery
}

function createMeasurementsQueryFromControls(
  measurementControls: Partial<MeasurementsControlState>,
  collection: Collection,
  defaultCollectionKey: string
): MeasurementsQuery {
  const newQuery = {
    m_collection: collection.key === defaultCollectionKey ? "" : collection.key
  };
  for (const [controlKey, controlValue] of Object.entries(measurementControls)) {
    let queryKey = controlToQueryParamMap[controlKey];
    const collectionDefault = getCollectionDefaultControl(controlKey, collection);
    const controlDefault = collectionDefault !== undefined ? collectionDefault : defaultMeasurementsControlState[controlKey];
    // Remove URL param if control state is the same as the default state
    if (controlValue === controlDefault) {
      newQuery[queryKey] = "";
    } else {
      switch(controlKey) {
        case "measurementsDisplay": // fallthrough
        case "measurementsGroupBy":
          newQuery[queryKey] = controlValue;
          break;
        case "measurementsShowOverallMean":
          newQuery[queryKey] = controlValue ? "show" : "hide";
          break;
        case "measurementsShowThreshold":
          if (collection.thresholds) {
            newQuery[queryKey] = controlValue ? "show" : "hide";
          } else {
            newQuery[queryKey] = "";
          }
          break;
        case "measurementsFilters":
          // First clear all of the measurements filter query params
          for (const field of collection.filters.keys()) {
            queryKey = filterQueryPrefix + field;
            newQuery[queryKey] = "";
          }
          // Then add back measurements filter query params for active filters only
          for (const [field, values] of Object.entries(controlValue)) {
            queryKey = filterQueryPrefix + field;
            const activeFilterValues = [...values]
              .filter(([_, {active}]) => active)
              .map(([fieldValue]) => fieldValue);
            newQuery[queryKey] = activeFilterValues;
          }
          break;
        default:
          console.error(`Ignoring unsupported control ${controlKey}`);
      }
    }
  }
  return newQuery;
}

/**
 * Parses the current collection's controls from measurements and updates them
 * with valid query parameters.
 *
 * In cases where the query param is invalid, the query param is removed from the
 * returned query object.
 */
export const combineMeasurementsControlsAndQuery = (
  measurements: MeasurementsState,
  query: Query
): {
  collectionToDisplay: Collection,
  collectionControls: MeasurementsControlState,
  updatedQuery: Query,
  newColoringData: undefined | {
    coloringsPresentOnTree: string[],
    colorings: Colorings,
    nodeAttrs: MeasurementsNodeAttrs,
  },
} => {
  const updatedQuery = cloneDeep(query);
  const collectionKeys = measurements.collections.map((collection) => collection.key);
  // Remove m_collection query if it's invalid or the default collection key
  if (!collectionKeys.includes(updatedQuery.m_collection) ||
    updatedQuery.m_collection === measurements.defaultCollectionKey) {
    delete updatedQuery.m_collection;
  }
  // Parse collection's default controls
  const collectionKey = updatedQuery.m_collection || measurements.defaultCollectionKey;
  const collectionToDisplay = getCollectionToDisplay(measurements.collections, collectionKey, measurements.defaultCollectionKey)
  const collectionControls = getCollectionDefaultControls(collectionToDisplay);
  const collectionGroupings = Array.from(collectionToDisplay.groupings.keys());
  // Modify controls via query
  for (const [controlKey, queryKey] of Object.entries(controlToQueryParamMap)) {
    const queryValue = updatedQuery[queryKey];
    if (queryValue === undefined) continue;
    let newControlState = undefined;
    switch(queryKey) {
      case "m_display":
        if (isMeasurementsDisplay(queryValue)) {
          newControlState = queryValue;
        }
        break;
      case "m_groupBy":
        // Verify value is a valid grouping of collection
        if (typeof queryValue === "string" && collectionGroupings.includes(queryValue)) {
          newControlState = queryValue;
        }
        break;
      case "m_overallMean":
        if (isQueryBoolean(queryValue)) {
          newControlState = queryValue === "show";
        }
        break;
      case "m_threshold":
        if (collectionToDisplay.thresholds && isQueryBoolean(queryValue)) {
          newControlState = queryValue === "show";
        }
        break;
      default:
        console.error(`Ignoring unsupported query ${queryKey}`);
    }

    // Remove query if it's invalid or the same as the collection's default controls
    if (newControlState === undefined || newControlState === collectionControls[controlKey]) {
        delete updatedQuery[queryKey];
        continue;
    }
    collectionControls[controlKey] = newControlState
  }

  // Special handling of the filter query since these can be arbitrary query keys `mf_*`
  for (const filterKey of Object.keys(updatedQuery).filter((c) => c.startsWith(filterQueryPrefix))) {
    // Remove and ignore query for invalid fields
    const field = filterKey.replace(filterQueryPrefix, '');
    if (!collectionToDisplay.filters.has(field)) {
      delete updatedQuery[filterKey];
      continue;
    }

    // Remove and ignore query for invalid field values
    let filterValues = updatedQuery[filterKey];
    if (typeof filterValues === "string") {
      filterValues = Array(filterValues);
    }
    const collectionFieldValues = collectionToDisplay.filters.get(field).values;
    const validFilterValues = filterValues.filter((value) => collectionFieldValues.has(value));
    if (!validFilterValues.length) {
      delete updatedQuery[filterKey];
      continue;
    }

    // Set field filter controls and query to the valid filter values
    updatedQuery[filterKey] = validFilterValues;
    const measurementsFilters = {...collectionControls.measurementsFilters};
    measurementsFilters[field] = new Map(measurementsFilters[field]);
    for (const value of validFilterValues) {
      measurementsFilters[field].set(value, {active: true});
    }
    collectionControls.measurementsFilters = measurementsFilters;
  }

  // Special handling of the coloring query since this is _not_ a measurement specific query
  // This must be after handling of filters so that the color data takes filters into account
  let newColoringData = undefined;
  if (typeof(updatedQuery.c) === 'string' && isMeasurementColorBy(updatedQuery.c)) {
    const colorGrouping = decodeMeasurementColorBy(updatedQuery.c);
    const groupingValues = collectionToDisplay.groupings.get(collectionControls.measurementsGroupBy).values || [];
    // If the color grouping value is invalid, then remove the coloring query
    // otherwise create the node attrs and coloring data needed for the measurements color-by
    if (!groupingValues.includes(colorGrouping)) {
      updatedQuery.c = undefined;
    } else {
      collectionControls['measurementsColorGrouping'] = colorGrouping;
      newColoringData = {
        coloringsPresentOnTree: [updatedQuery.c],
        ...createMeasurementsColoringData(
          collectionControls.measurementsFilters,
          collectionControls.measurementsGroupBy,
          colorGrouping,
          collectionToDisplay
        ),
      }
    }
  }
  return {
    collectionToDisplay,
    collectionControls,
    updatedQuery,
    newColoringData,
  }
}
