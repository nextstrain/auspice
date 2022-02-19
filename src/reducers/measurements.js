import { CHANGE_MEASUREMENTS_COLLECTION, LOAD_MEASUREMENTS, UPDATE_MEASUREMENTS_ERROR } from "../actions/types";

const getDefaultMeasurementsState = () => ({
  error: undefined,
  loaded: false,
  collections: [],
  collectionToDisplay: {}
});

const measurements = (state = getDefaultMeasurementsState(), action) => {
  switch (action.type) {
    case LOAD_MEASUREMENTS:
      return {
        ...state,
        loaded: true,
        collections: action.collections,
        collectionToDisplay: action.collectionToDisplay
      };
    case CHANGE_MEASUREMENTS_COLLECTION:
      return {
        ...state,
        loaded: true,
        collectionToDisplay: action.collectionToDisplay
      };
    case UPDATE_MEASUREMENTS_ERROR:
      return {
        ...state,
        loaded: true,
        error: action.data
      };
    default:
      return state;
  }
};

export default measurements;
