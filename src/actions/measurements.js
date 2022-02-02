import { pick } from "lodash";
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
 * @returns {Object}
 */
const getCollectionDisplayControls = (controls, collection) => {
  const measurementsControls = [
    "measurementsGroupBy",
    "measurementsDisplay",
    "measurementsShowOverallMean",
    "measurementsShowThreshold",
    "measurementsFilters"
  ];
  // Copy current control options for measurements
  const newControls = pick(controls, measurementsControls);
  // Checks the current group by is available as a field in collection
  if (!collection.fields.has(newControls.measurementsGroupBy)) {
    // If current group by is not available as a field, then default to the first grouping option.
    newControls.measurementsGroupBy = collection.groupings[0];
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
      measurement_display,
      show_overall_mean,
      show_threshold
    } = collection["display_defaults"];

    if (group_by) {
      newControls.measurementsGroupBy = group_by;
    }
    if (measurement_display) {
      newControls.measurementsDisplay = measurement_display;
    }
    if (typeof show_overall_mean === "boolean") {
      newControls.measurementsShowOverallMean = show_overall_mean;
    }
    if (typeof show_threshold === "boolean") {
      newControls.measurementsShowThreshold = show_threshold;
    }
  }

  return newControls;
};

export const loadMeasurements = (json) => (dispatch, getState) => {
  // TODO: Load controls from state to get potential url query parameters
  const { tree, controls } = getState();
  if (!tree.loaded) {
    throw new Error("tree not loaded");
  }

  const collections = json["collections"];
  if (!collections || collections.length === 0) {
    throw new Error("Measurements JSON does not have collections");
  }

  collections.forEach((collection) => {
    /*
     * Create fields Map for easier access of titles and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add any remaining fields
     */
    const collectionFieldsArray = collection.fields;
    collection.fields = new Map();
    if (collectionFieldsArray && collectionFieldsArray.length > 0) {
      collectionFieldsArray.forEach(({key, title}) => {
        collection.fields.set(key, {title: title || key});
      });
    }

    /**
     * Create filters Map for easier access of values and to keep ordering
     * First add fields from JSON to keep user's ordering
     * Then loop over measurements to add values
     * If there are no JSON defined filters, then add all fields as filters
     */
    const collectionFiltersArray = collection.filters;
    collection.filters = new Map();
    if (collectionFiltersArray && collectionFiltersArray.length > 0) {
      collectionFiltersArray.forEach((filterField) => {
        collection.filters.set(filterField, {values: new Set()});
      });
    }

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
      });

      // Add jitter and stable id for each measurement to help visualization
      // Generate Gaussian jitter with a Box-Muller transform
      measurement["measurementJitter"] = Math.sqrt(-2*Math.log(Math.random()))*Math.cos(2*Math.PI*Math.random());
      measurement["measurementId"] = index;
    });
  });

  // Get the collection to display to set up default controls
  // TODO: consider url query parameter?
  const collectionToDisplay = getCollectionToDisplay(collections, json["default_collection"]);

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
export const toggleSingleFilter = (field, value, active) => (dispatch, getState) => {
  const { controls } = getState();
  const measurementsFilters = {...controls.measurementsFilters};
  measurementsFilters[field] = new Map(measurementsFilters[field]);
  measurementsFilters[field].set(value, {active});

  dispatch({
    type: APPLY_MEASUREMENTS_FILTER,
    data: measurementsFilters
  });
};
