import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import sequences from "./sequences";
import frequencies from "./frequencies";
import entropy from "./entropy";
import controls from "./controls";
import browserDimensions from "./browserDimensions";
// import map from "./map";
import notifications from "./notifications";

const rootReducer = combineReducers({
  metadata,
  tree,
  sequences,
  frequencies,
  controls,
  entropy,
  browserDimensions,
  notifications
  // map
});

export default rootReducer;
