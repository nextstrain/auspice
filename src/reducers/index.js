import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import sequences from "./sequences";
import frequencies from "./frequencies";


const rootReducer = combineReducers({
  metadata,
  tree,
  sequences,
  frequencies
});

export default rootReducer;
