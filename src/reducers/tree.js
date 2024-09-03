import { countTraitsAcrossTree } from "../util/treeCountingHelpers";
import { addNodeAttrs } from "../util/treeMiscHelpers";
import * as types from "../actions/types";

/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action */

export const getDefaultTreeState = () => {
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


const Tree = (state = getDefaultTreeState(), action) => {
  switch (action.type) {
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    case types.CLEAN_START:
      return action.tree;
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.CHANGE_EXPLODE_ATTR: /* fallthrough */
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fallthrough */
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS: {
      const newStates = {
        visibility: action.visibility,
        visibilityVersion: action.visibilityVersion,
        branchThickness: action.branchThickness,
        branchThicknessVersion: action.branchThicknessVersion,
        idxOfInViewRootNode: action.idxOfInViewRootNode,
        idxOfFilteredRoot: action.idxOfFilteredRoot,
        cladeName: action.cladeName,
        selectedClade: action.cladeName,
      };
      return Object.assign({}, state, newStates);
    }
    case types.UPDATE_TIP_RADII:
      return Object.assign({}, state, {
        tipRadii: action.data,
        tipRadiiVersion: action.version
      });
    case types.NEW_COLORS:
      return Object.assign({}, state, {
        nodeColors: action.nodeColors,
        nodeColorsVersion: action.version
      });
    case types.TREE_TOO_DATA:
      return action.tree;
    case types.ADD_EXTRA_METADATA: {
      // add data into `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      addNodeAttrs(state.nodes, action.newNodeAttrs);
      // add the new nodeAttrKeys to ensure tip labels get updated
      const nodeAttrKeys = new Set(state.nodeAttrKeys);
      Object.keys(action.newColorings).forEach((attr) => nodeAttrKeys.add(attr));
      // add the new colorings to totalStateCounts so that they can function as filters
      return {
        ...state,
        totalStateCounts: {
          ...state.totalStateCounts,
          ...countTraitsAcrossTree(state.nodes, Object.keys(action.newColorings), false, true)
        },
        nodeAttrKeys
      };
    }
    default:
      return state;
  }
};

export default Tree;
