import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import sequences from "./sequences";
import frequencies from "./frequencies";
import entropy from "./entropy";
import controls from "./controls";
import browserDimensions from "./browserDimensions";
import notifications from "./notifications";
import datasets from "./datasets";

const rootReducer = combineReducers({
  metadata,
  tree,
  sequences,
  frequencies,
  controls,
  entropy,
  browserDimensions,
  notifications,
  datasets
});

export default rootReducer;
