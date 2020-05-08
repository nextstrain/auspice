import { combineReducers } from "redux";
import metadata from "../../../src/reducers/metadata";
import tree from "../../../src/reducers/tree";
import frequencies from "../../../src/reducers/frequencies";
import entropy from "../../../src/reducers/entropy";
import controls from "../../../src/reducers/controls";
import browserDimensions from "../../../src/reducers/browserDimensions";
import notifications from "../../../src/reducers/notifications";
import narrative from "../../../src/reducers/narrative";
import treeToo from "../../../src/reducers/treeToo";
import general from "../../../src/reducers/general";
import editor from "./editor";

const rootReducer = combineReducers({
  metadata,
  tree,
  frequencies,
  controls,
  entropy,
  browserDimensions,
  notifications,
  narrative,
  treeToo,
  general,
  editor
});

export default rootReducer;
