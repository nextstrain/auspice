import { pick } from "lodash";
import { CHANGE_MEASUREMENTS_COLLECTION, LOAD_MEASUREMENTS } from "./types";

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
    "measurementsShowThreshold"
  ];
  // Copy current control options for measurements
  const newControls = pick(controls, measurementsControls);
  // Checks the current group by is available as a field in collection
  if (!collection.fields.has(newControls.measurementsGroupBy)) {
    // If current group by is not available as a field, then default to the first grouping option.
    newControls.measurementsGroupBy = collection.groupings[0];
  }

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
    // Convert provided fields array to Map for easier access and to keep ordering
    const collectionFieldsArray = collection.fields;
    collection.fields = new Map();
    if (collectionFieldsArray && collectionFieldsArray.length > 0) {
      collectionFieldsArray.forEach(({key, title}) => collection.fields.set(key, {title: title || key}));
    }

    // Get all fields from first measurment to include them if they are not in collection.fields
    Object.keys(collection.measurements[0]).forEach((fieldKey) => {
      if (!collection.fields.has(fieldKey)) {
        collection.fields.set(fieldKey, {title: fieldKey});
      }
    });

    // Add jitter and stable id for each measurement
    collection.measurements.forEach((measurement, index) => {
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
