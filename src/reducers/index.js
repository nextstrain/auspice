import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import sequences from "./sequences";


const rootReducer = combineReducers({
  metadata,
  tree,
  sequences
});

export default rootReducer;
