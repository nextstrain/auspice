import { pick } from "lodash";
import { measurementIdSymbol } from "../util/globals";
import { defaultMeasurementsControlState, MeasurementsControlState } from "../reducers/controls";
import {
  APPLY_MEASUREMENTS_FILTER,
  CHANGE_MEASUREMENTS_COLLECTION,
  CHANGE_MEASUREMENTS_DISPLAY,
  CHANGE_MEASUREMENTS_GROUP_BY,
  LOAD_MEASUREMENTS,
  TOGGLE_MEASUREMENTS_OVERALL_MEAN,
  TOGGLE_MEASUREMENTS_THRESHOLD,
} from "./types";

/**
 * Find the collection within collections that has a key matching the provided
 * collectionKey.
 *
 * If collectionKey is not provided, returns the first collection.
 * If no matches are found, returns the first collection.
 * If multiple matches are found, only returns the first matching collection.
 *
 * @param {Array<Object>} collections
 * @param {string} collectionKey
 * @returns {Object}
 */
export const getCollectionToDisplay = (collections, collectionKey) => {
  if (!collectionKey) return collections[0];
  const potentialCollections = collections.filter((collection) => collection.key === collectionKey);
  if (potentialCollections.length === 0) return collections[0];
  if (potentialCollections.length > 1) {
    console.error(`Found multiple collections with key ${collectionKey}. Returning the first matching collection only.`);
  }
  return potentialCollections[0];
};

/**
 * Map the controlKey to the default value in collectionDefaults
 * Checks if the collection default is a valid value for the control
 * @param {string} controlKey
 * @param {Object} collection
 * @returns {*}
 */
function getCollectionDefaultControl(controlKey, collection) {
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
    case 'measurementsGroupBy':
      if (defaultControl === undefined || !collection.groupings.has(defaultControl)) {
        if (defaultControl !== undefined) {
          console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be one of collection's groupings. Using first grouping as default`)
        }
        defaultControl = collection.groupings.keys().next().value;
      }
      break;
    case 'measurementsDisplay':
      const expectedValues = ["mean", "raw"];
      if (defaultControl !== undefined && !expectedValues.includes(defaultControl)) {
        console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be one of ${expectedValues}`)
        defaultControl = undefined;
      }
      break;
    case 'measurementsShowOverallMean':
      if (defaultControl !== undefined && typeof defaultControl !== "boolean") {
        console.error(`Ignoring invalid ${displayDefaultKey} value ${defaultControl}, must be a boolean`)
        defaultControl = undefined;
      }
      break;
    case 'measurementsShowThreshold':
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
    case 'measurementsFilters':
      console.debug(`Skipping control key ${controlKey} because it does not have default controls`);
      break;
    default:
      console.error(`Skipping unknown control key ${controlKey}`);
  }
  return defaultControl;
}

/**
 * Constructs the controls redux state for the measurements panel based on
 * config values within the provided collection.
 *
 * If no display defaults are provided, uses the current controls redux state.
 * If the current `measurementsGrouping` does not exist in the collection, then
 * defaults to the first grouping option.
 * @param {Object} collection
 * @returns {MeasurementsControlState}
 */
const getCollectionDisplayControls = (controls, collection) => {
  // Copy current control options for measurements
  const newControls = pick(controls, Object.keys(defaultMeasurementsControlState));
  // Checks the current group by is available as a grouping in collection
  // If it doesn't exist, set to undefined so it will get filled in with collection's default
  if (!collection.groupings.has(newControls.measurementsGroupBy)) {
    newControls.measurementsGroupBy = undefined
  }

  // Verify that current filters are valid for the new collection
  Object.entries(newControls.measurementsFilters).forEach(([field, valuesMap]) => {
    // Delete filter for field that does not exist in the new collection filters
    if (!collection.filters.has(field)) {
      return delete newControls.measurementsFilters[field];
    }
    // Clone nested Map to avoid changing redux state in place
    newControls.measurementsFilters[field] = new Map(valuesMap);
    return [...valuesMap.keys()].forEach((value) => {
      // Delete filter for values that do not exist within the field of the new collection
      if (!collection.filters.get(field).values.has(value)) {
        newControls.measurementsFilters[field].delete(value);
      }
    });
  });

  // Ensure controls use collection's defaults or app defaults if this is
  // the initial loading of the measurements JSON
  for (const [key, value] of Object.entries(newControls)) {
    // Skip values that are not undefined because this indicates they are URL params or existing controls
    if (value !== undefined) continue;
    let defaultControl = getCollectionDefaultControl(key, collection);
    newControls[key] = defaultControl !== undefined ? defaultControl : defaultMeasurementsControlState[key];
  }

  return newControls;
};

export const parseMeasurementsJSON = (json) => {
  const collections = json["collections"];
  if (!collections || collections.length === 0) {
    throw new Error("Measurements JSON does not have collections");
  }

  collections.forEach((collection) => {
    /**
     * Keep backwards compatibility with single value threshold.
     * Make sure thresholds are an array of values so that we don't have to
     * check the data type in the D3 drawing process
     * `collection.thresholds` takes precedence over the deprecated `collection.threshold`
     */
    if (typeof collection.threshold === "number") {
      collection.thresholds = collection.thresholds || [collection.threshold];
      delete collection.threshold;
    }
    /*
     * Create fields Map for easier access of titles and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add any remaining fields
     */
    collection.fields = new Map(
      (collection.fields || [])
        .map(({key, title}) => [key, {title: title || key}])
    );

    /**
     * Create filters Map for easier access of values and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add values
     * If there are no JSON defined filters, then add all fields as filters
     */
    const collectionFiltersArray = collection.filters;
    collection.filters = new Map(
      (collection.filters || [])
        .map((filterField) => [filterField, {values: new Set()}])
    );

    // Create a temp object for groupings to keep track of values and their
    // counts so that we can create a stable default order for grouping field values
    const groupingsValues = collection.groupings.reduce((tempObject, {key}) => {
      tempObject[key] = {};
      return tempObject;
    }, {});

    collection.measurements.forEach((measurement, index) => {
      Object.entries(measurement).forEach(([field, fieldValue]) => {
        // Add remaining field titles
        if (!collection.fields.has(field)) {
          collection.fields.set(field, {title: field});
        }

        // Only save the unique values if the field is in defined filters
        // OR there are no JSON defined filters, so all fields are filters
        if ((collection.filters.has(field)) || !collectionFiltersArray) {
          const filterObject = collection.filters.get(field) || { values: new Set()};
          filterObject.values.add(fieldValue);
          collection.filters.set(field, filterObject);
        }

        // Save grouping field values and counts
        if (field in groupingsValues) {
          const previousValue = groupingsValues[field][fieldValue];
          groupingsValues[field][fieldValue] = previousValue ? previousValue + 1 : 1;
        }
      });

      // Add stable id for each measurement to help visualization
      measurement[measurementIdSymbol] = index;
    });

    // Create groupings Map for easier access of sorted values and to keep groupings ordering
    // Must be done after looping through measurements to build `groupingsValues` object
    collection.groupings = new Map(
      collection.groupings.map(({key, order}) => {
        const valuesByCount = Object.entries(groupingsValues[key])
          // Use the grouping values' counts to sort the values, highest count first
          .sort(([, valueCountA], [, valueCountB]) => valueCountB - valueCountA)
          // Filter out values that already exist in provided order from JSON
          .filter(([fieldValue]) => order ? !order.includes(fieldValue) : true)
          // Create array of field values
          .map(([fieldValue]) => fieldValue);
        return [
          key,
          // Prioritize the provided values order then list values by count
          {values: (order || []).concat(valuesByCount)}
        ];
      })
    );
  });

  return {collections, defaultCollection: json["default_collection"]};
};

export const loadMeasurements = ({collections, defaultCollection}) => (dispatch, getState) => {
  const { tree, controls } = getState();
  if (!tree.loaded) {
    throw new Error("tree not loaded");
  }

  // Get the collection to display to set up default controls
  // TODO: consider url query parameter?
  const collectionToDisplay = getCollectionToDisplay(collections, defaultCollection);
  const newControls = getCollectionDisplayControls(controls, collectionToDisplay);
  const queryParams = createMeasurementsQueryFromControls(newControls, collectionToDisplay);

  dispatch({
    type: LOAD_MEASUREMENTS,
    collections,
    collectionToDisplay,
    controls: newControls,
    queryParams
  });
};

export const changeMeasurementsCollection = (newCollectionKey) => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const collectionToDisplay = getCollectionToDisplay(measurements.collections, newCollectionKey);
  const newControls = getCollectionDisplayControls(controls, collectionToDisplay);
  const queryParams = createMeasurementsQueryFromControls(newControls, collectionToDisplay);

  dispatch({
    type: CHANGE_MEASUREMENTS_COLLECTION,
    collectionToDisplay,
    controls: newControls,
    queryParams
  });
};

/*
 * The filter actions below will create a copy of `controls.measurementsFilters`
 * then clone the nested Map to avoid changing the redux state in place.
 * Tried to use lodash.cloneDeep(), but it did not work for the nested Map
 * - Jover, 19 January 2022
 */
export const applyMeasurementFilter = (field, value, active) => (dispatch, getState) => {
  const { controls } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  measurementsFilters[field].set(value, {active});

  dispatch({
    type: APPLY_MEASUREMENTS_FILTER,
    data: measurementsFilters
  });
};

export const removeSingleFilter = (field, value) => (dispatch, getState) => {
  const { controls } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  measurementsFilters[field].delete(value);

  // If removing the single filter leaves 0 filters for the field, completely
  // remove the field from the filters state
  if (measurementsFilters[field].size === 0) {
    delete measurementsFilters[field];
  }

  dispatch({
    type: APPLY_MEASUREMENTS_FILTER,
    data: measurementsFilters
  });
};

export const removeAllFieldFilters = (field) => (dispatch, getState) => {
  const { controls } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  delete measurementsFilters[field];

  dispatch({
    type: APPLY_MEASUREMENTS_FILTER,
    data: measurementsFilters
  });
};

export const toggleAllFieldFilters = (field, active) => (dispatch, getState) => {
  const { controls } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  for (const fieldValue of measurementsFilters[field].keys()) {
    measurementsFilters[field].set(fieldValue, {active});
  }
  dispatch({
    type: APPLY_MEASUREMENTS_FILTER,
    data: measurementsFilters
  });
};

export const toggleOverallMean = () => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsShowOverallMean";
  const newControls = { [controlKey]: !controls[controlKey] };

  dispatch({
    type: TOGGLE_MEASUREMENTS_OVERALL_MEAN,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay)
  });
}

export const toggleThreshold = () => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsShowThreshold";
  const newControls = { [controlKey]: !controls[controlKey] };

  dispatch({
    type: TOGGLE_MEASUREMENTS_THRESHOLD,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay)
  });
};

export const changeMeasurementsDisplay = (newDisplay) => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsDisplay";
  const newControls = { [controlKey]: newDisplay };

  dispatch({
    type: CHANGE_MEASUREMENTS_DISPLAY,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay)
  });
}

export const changeMeasurementsGroupBy = (newGroupBy) => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const controlKey = "measurementsGroupBy";
  const newControls = { [controlKey]: newGroupBy };

  dispatch({
    type: CHANGE_MEASUREMENTS_GROUP_BY,
    controls: newControls,
    queryParams: createMeasurementsQueryFromControls(newControls, measurements.collectionToDisplay)
  });
}

const controlToQueryParamMap = {
  measurementsDisplay: "m_display",
  measurementsGroupBy: "m_groupBy",
  measurementsShowOverallMean: "m_overallMean",
  measurementsShowThreshold: "m_threshold",
};

function createMeasurementsQueryFromControls(measurementControls, collection) {
  const newQuery = {};
  for (const [controlKey, controlValue] of Object.entries(measurementControls)) {
    const queryKey = controlToQueryParamMap[controlKey];
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
        default:
          console.error(`Ignoring unsupported control ${controlKey}`);
      }
    }
  }
  return newQuery;
}

export function createMeasurementsControlsFromQuery(query){
  const newState = {};
  for (const [controlKey, queryKey] of Object.entries(controlToQueryParamMap)) {
    const queryValue = query[queryKey];
    if (queryValue === undefined) continue;
    let expectedValues = [];
    let conversionFn = () => null;
    switch(queryKey) {
      case "m_display":
        expectedValues = ["mean", "raw"];
        conversionFn = () => queryValue;
        break;
      case "m_groupBy":
        // Accept any value here because we cannot validate the query before
        // the measurements JSON is loaded
        expectedValues = [queryValue];
        conversionFn = () => queryValue;
        break;
      case "m_overallMean": // fallthrough
      case "m_threshold":
        expectedValues = ["show", "hide"];
        conversionFn = () => queryValue === "show" ? true : false;
        break;
    }

    if(expectedValues.includes(queryValue)) {
      newState[controlKey] = conversionFn();
    } else {
      console.error(`Ignoring invalid query param ${queryKey}=${queryValue}, value should be one of ${expectedValues}`);
    }
  }
  return newState;
}
