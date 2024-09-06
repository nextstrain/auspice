import { pick } from "lodash";
import { measurementIdSymbol } from "../util/globals";
import { defaultMeasurementsControlState, MeasurementsControlState } from "../reducers/controls";
import {
  APPLY_MEASUREMENTS_FILTER,
  CHANGE_MEASUREMENTS_COLLECTION,
  LOAD_MEASUREMENTS
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
  // Checks the current group by is available as a field in collection
  if (!collection.fields.has(newControls.measurementsGroupBy)) {
    // If current group by is not available as a field, then default to the first grouping option.
    [newControls.measurementsGroupBy] = collection.groupings.keys();
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

  if (collection["display_defaults"]) {
    const {
      group_by,
      measurements_display,
      show_overall_mean,
      show_threshold
    } = collection["display_defaults"];

    if (group_by) {
      newControls.measurementsGroupBy = group_by;
    }
    if (measurements_display) {
      newControls.measurementsDisplay = measurements_display;
    }
    if (typeof show_overall_mean === "boolean") {
      newControls.measurementsShowOverallMean = show_overall_mean;
    }
    if (typeof show_threshold === "boolean") {
      newControls.measurementsShowThreshold = show_threshold;
    }
  }

  // Ensure controls use app defaults if no collection defaults are defined
  for (const [key, value] of Object.entries(newControls)) {
    // Skip values that are not undefined because this indicates they are URL params or existing controls
    if (value !== undefined) continue;
    newControls[key] = defaultMeasurementsControlState[key];
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
  // TODO: Load controls from state to get potential url query parameters
  const { tree, controls } = getState();
  if (!tree.loaded) {
    throw new Error("tree not loaded");
  }

  // Get the collection to display to set up default controls
  // TODO: consider url query parameter?
  const collectionToDisplay = getCollectionToDisplay(collections, defaultCollection);

  dispatch({
    type: LOAD_MEASUREMENTS,
    collections,
    collectionToDisplay,
    controls: getCollectionDisplayControls(controls, collectionToDisplay)
  });
};

export const changeMeasurementsCollection = (newCollectionKey) => (dispatch, getState) => {
  const { controls, measurements } = getState();
  const collectionToDisplay = getCollectionToDisplay(measurements.collections, newCollectionKey);

  dispatch({
    type: CHANGE_MEASUREMENTS_COLLECTION,
    collectionToDisplay,
    controls: getCollectionDisplayControls(controls, collectionToDisplay)
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
