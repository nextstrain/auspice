import { AnyAction } from "@reduxjs/toolkit";
import { countTraitsAcrossTree } from "../../util/treeCountingHelpers";
import { addNodeAttrs, removeNodeAttrs } from "../../util/treeMiscHelpers";
import * as types from "../../actions/types";
import { TreeState, TreeTooState } from "./types";

export const getDefaultTreeState = (): TreeState | TreeTooState => {
  return {
    loaded: false,
    nodes: null,
    name: undefined,
    visibility: null,
    visibilityVersion: 0,
    nodeColors: null,
    nodeColorsVersion: 0,
    tipRadii: null,
    tipRadiiVersion: 0,
    branchThickness: null,
    branchThicknessVersion: 0,
    vaccines: false,
    version: 0,
    idxOfInViewRootNode: 0,
    totalStateCounts: {},
    observedMutations: {},
    availableBranchLabels: [],
    selectedClade: undefined
  };
};


const Tree = (
  state: TreeState = getDefaultTreeState(),
  action: AnyAction,
): TreeState => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      return action.tree;
    case types.DATA_INVALID:
      return {
        ...state,
        loaded: false,
      };
    case types.CHANGE_EXPLODE_ATTR: /* fallthrough */
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fallthrough */
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS: {
      const newStates: Partial<TreeState> = {
        visibility: action.visibility,
        visibilityVersion: action.visibilityVersion,
        branchThickness: action.branchThickness,
        branchThicknessVersion: action.branchThicknessVersion,
        idxOfInViewRootNode: action.idxOfInViewRootNode,
        idxOfFilteredRoot: action.idxOfFilteredRoot,
        cladeName: action.cladeName,
        selectedClade: action.cladeName,
      };
      return {
        ...state,
        ...newStates,
      };
    }
    case types.UPDATE_TIP_RADII:
      return {
        ...state,
        tipRadii: action.data,
        tipRadiiVersion: action.version,
      };
    case types.NEW_COLORS:
      return {
        ...state,
        nodeColors: action.nodeColors,
        nodeColorsVersion: action.version,
      };
    case types.TREE_TOO_DATA:
      return action.tree;
    case types.ADD_EXTRA_METADATA: {
      // add data into `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      addNodeAttrs(state.nodes, action.newNodeAttrs);
      // add the new nodeAttrKeys to ensure tip labels get updated
      const nodeAttrKeys = new Set(state.nodeAttrKeys);
      Object.keys(action.newColorings).forEach((attr) => nodeAttrKeys.add(attr));
      // add the new non-continuous colorings to totalStateCounts so that they can function as filters
      const nonContinuousColorings = Object.keys(action.newColorings).filter((coloring: string) => {
        return action.newColorings[coloring].type !== "continuous"
      });
      return {
        ...state,
        totalStateCounts: {
          ...state.totalStateCounts,
          ...countTraitsAcrossTree(state.nodes, nonContinuousColorings, false, true)
        },
        nodeAttrKeys
      };
    }
    case types.REMOVE_METADATA: {
      // remove data from `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      removeNodeAttrs(state.nodes, action.nodeAttrsToRemove);
      const nodeAttrKeys = new Set(state.nodeAttrKeys);
      const totalStateCounts = {...state.totalStateCounts};
      action.nodeAttrsToRemove.forEach((attrKey: string): void => {
        nodeAttrKeys.delete(attrKey);
        if (attrKey in totalStateCounts) {
          delete totalStateCounts[attrKey];
        }
      })
      return {
        ...state,
        totalStateCounts,
        nodeAttrKeys,
      }
    }
    default:
      return state;
  }
};

export default Tree;
