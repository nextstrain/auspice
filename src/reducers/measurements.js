import { CHANGE_MEASUREMENTS_COLLECTION, LOAD_MEASUREMENTS } from "../actions/types";

const getDefaultMeasurementsState = () => ({
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
    default:
      return state;
  }
};

export default measurements;
