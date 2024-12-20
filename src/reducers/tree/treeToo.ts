import { AnyAction } from "@reduxjs/toolkit";
import { getDefaultTreeState } from ".";
import { addNodeAttrs, removeNodeAttrs } from "../../util/treeMiscHelpers";
import * as types from "../../actions/types";
import { TreeTooState } from "./types";

const treeToo = (
  state: TreeTooState = getDefaultTreeState(),
  action: AnyAction,
): TreeTooState => {
  /* There are only a few actions we should always listen for, as they can change
  the presence / absence of the second tree */
  switch (action.type) {
    case types.DATA_INVALID:
      return {
        ...state,
        loaded: false,
      };
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      if (action.treeToo) {
        return action.treeToo;
      }
      return getDefaultTreeState();
    case types.TREE_TOO_DATA:
      return action.treeToo;
    default:
      // no default case
  }

  /* All other actions can only modify an existing tree, so if one doesn't exist then
  return early */
  if (!state.loaded) {
    return state;
  }

  switch (action.type) {
    case types.REMOVE_TREE_TOO:
      return getDefaultTreeState();
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fallthrough */
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS:
      if (action.tangleTipLookup) {
        return {
          ...state,
          tangleTipLookup: action.tangleTipLookup,
          visibility: action.visibilityToo,
          visibilityVersion: action.visibilityVersionToo,
          branchThickness: action.branchThicknessToo,
          branchThicknessVersion: action.branchThicknessVersionToo,
          idxOfInViewRootNode: action.idxOfInViewRootNodeToo,
          idxOfFilteredRoot: action.idxOfFilteredRootToo,
        };
      }
      return state;
    case types.UPDATE_TIP_RADII:
      return {
        ...state,
        tipRadii: action.dataToo,
        tipRadiiVersion: action.version,
      };
    case types.NEW_COLORS:
      if (action.nodeColorsToo) {
        return {
          ...state,
          nodeColors: action.nodeColorsToo,
          nodeColorsVersion: action.version,
        };
      }
      return state;
    case types.ADD_EXTRA_METADATA:
      // add data into `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      addNodeAttrs(state.nodes, action.newNodeAttrs);
      return state;
    case types.REMOVE_METADATA:
      // remove data from `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      removeNodeAttrs(state.nodes, action.nodeAttrsToRemove);
      return state;
    default:
      return state;
  }
};

export default treeToo;
