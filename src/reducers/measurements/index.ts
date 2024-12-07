import { AnyAction } from "@reduxjs/toolkit";
import {
  CHANGE_MEASUREMENTS_COLLECTION,
  CLEAN_START,
  URL_QUERY_CHANGE_WITH_COMPUTED_STATE
} from "../../actions/types";
import { MeasurementsState } from "./types";

export const getDefaultMeasurementsState = (): MeasurementsState => ({
  error: undefined,
  loaded: false,
  defaultCollectionKey: undefined,
  collections: undefined,
  collectionToDisplay: undefined
});

const measurements = (
  state: MeasurementsState = getDefaultMeasurementsState(),
  action: AnyAction,
): MeasurementsState => {
  switch (action.type) {
    case CLEAN_START: // fallthrough
    case URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      return { ...action.measurements };
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
