import { combineReducers } from "redux";
import metadata from "./metadata";
import tree from "./tree";
import { TreeState, TreeTooState } from "./tree/types";
import frequencies from "./frequencies";
import entropy from "./entropy";
import controls, { ControlsState } from "./controls";
import browserDimensions from "./browserDimensions";
import notifications from "./notifications";
import narrative, { NarrativeState } from "./narrative";
import treeToo from "./tree/treeToo";
import general from "./general";
import jsonCache from "./jsonCache";
import measurements from "./measurements";

interface RootState {
  metadata: ReturnType<typeof metadata>
  tree: TreeState
  frequencies: ReturnType<typeof frequencies>
  controls: ControlsState
  entropy: ReturnType<typeof entropy>
  browserDimensions: ReturnType<typeof browserDimensions>
  notifications: ReturnType<typeof notifications>
  narrative: NarrativeState
  treeToo: TreeTooState
  general: ReturnType<typeof general>
  jsonCache: ReturnType<typeof jsonCache>
  measurements: ReturnType<typeof measurements>
}

const rootReducer = combineReducers<RootState>({
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
  jsonCache,
  measurements
});

export default rootReducer;
