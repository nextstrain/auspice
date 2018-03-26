import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import frequencies from "./frequencies";
import entropy from "./entropy";
import controls from "./controls";
import browserDimensions from "./browserDimensions";
import notifications from "./notifications";
import datasets from "./datasets";
import narrative from "./narrative";
import posts from "./posts";
import treeToo from "./treeToo";

const rootReducer = combineReducers({
  metadata,
  tree,
  frequencies,
  controls,
  entropy,
  browserDimensions,
  notifications,
  datasets,
  narrative,
  posts,
  treeToo
});

export default rootReducer;
