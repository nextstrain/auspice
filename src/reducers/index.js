import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import sequences from "./sequences";
import frequencies from "./frequencies";
import entropy from "./entropy";
import controls from "./controls";

const rootReducer = combineReducers({
  metadata,
  tree,
  sequences,
  frequencies,
  controls,
  entropy
});

export default rootReducer;
