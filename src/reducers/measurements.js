import {
  CHANGE_MEASUREMENTS_COLLECTION,
  LOAD_MEASUREMENTS,
  UPDATE_MEASUREMENTS_ERROR,
  URL_QUERY_CHANGE_WITH_COMPUTED_STATE
} from "../actions/types";

export const getDefaultMeasurementsState = () => ({
  error: undefined,
  loaded: false,
  defaultCollectionKey: "",
  collections: [],
  collectionToDisplay: {}
});

const measurements = (state = getDefaultMeasurementsState(), action) => {
  switch (action.type) {
    case URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      return { ...action.measurements };
    case LOAD_MEASUREMENTS:
      return {
        ...state,
        loaded: true,
        defaultCollectionKey: action.defaultCollectionKey,
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
