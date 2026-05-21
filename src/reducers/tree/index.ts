import { AnyAction } from "@reduxjs/toolkit";
import { removeNodeAttrs } from "../../util/treeMiscHelpers";
import * as types from "../../actions/types";
import { TreeState, TreeTooState } from "./types";
import type { UpdateMetadataAction } from "../../actions/updateMetadata/updateMetadata.types"

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
    hoveredLegendSwatch: false,
    branchThickness: null,
    branchThicknessVersion: 0,
    vaccines: false,
    version: 0,
    idxOfInViewRootNode: 0,
    totalStateCounts: {},
    observedMutations: {},
    availableBranchLabels: [],
    streams: {},
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
        focusNodes: action.focusNodes,
      };
      return {
        ...state,
        ...newStates,
      };
    }
    case types.SET_FOCUS:
      return {
        ...state,
        focusNodes: action.focusNodes || undefined,
      }
    case types.UPDATE_TIP_RADII:
      return {
        ...state,
        tipRadii: action.data,
        tipRadiiVersion: action.version,
        hoveredLegendSwatch: action.hoveredLegendSwatch,
      };
    case types.NEW_COLORS:
      return {
        ...state,
        nodeColors: action.nodeColors,
        nodeColorsVersion: action.version,
      };
    case types.CHANGE_STREAM_TREE_BRANCH_LABEL:
      return {...state, streams: action.streams}
    case types.TREE_TOO_DATA:
      return action.tree;
    case types.UPDATE_METADATA: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const { tree: newData } = action as UpdateMetadataAction;
      if (!newData) return state;

      // add data into `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      for (const node of state.nodes) {
        for (const [attrName, attrData] of Object.entries(newData.nodeAttrs[node.name] || {})) {
          if (!attrData) continue;
          node.node_attrs[attrName] = attrData;
        }
      }
      return {
        ...state,
        totalStateCounts: newData.totalStateCounts,
        nodeAttrKeys: newData.nodeAttrKeys,
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
