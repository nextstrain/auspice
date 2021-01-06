import * as types from "../actions/types";
import { getDefaultTreeState } from "./tree";
/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action */

const treeToo = (state = getDefaultTreeState(), action) => {
  switch (action.type) {
    // case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE: /* fallthrough */
    // case types.CLEAN_START:
    //   return action.tree;
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.REMOVE_TREE_TOO:
      return getDefaultTreeState();
    case types.CLEAN_START:
      if (action.treeToo) {
        return action.treeToo;
      }
      return state;
    case types.TREE_TOO_DATA:
      return action.treeToo;
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fall-through */
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS:
      if (action.tangleTipLookup) {
        // console.warn("NB missing visibleStateCounts from treeToo here");
        return Object.assign({}, state, {
          tangleTipLookup: action.tangleTipLookup,
          visibility: action.visibilityToo,
          visibilityVersion: action.visibilityVersionToo,
          branchThickness: action.branchThicknessToo,
          branchThicknessVersion: action.branchThicknessVersionToo,
          idxOfInViewRootNode: action.idxOfInViewRootNodeToo,
          idxOfFilteredRoot: action.idxOfFilteredRootToo,
          selectedStrain: action.selectedStrain
        });
      }
      return state;
    case types.UPDATE_TIP_RADII:
      return Object.assign({}, state, {
        tipRadii: action.dataToo,
        tipRadiiVersion: action.version
      });
    case types.NEW_COLORS:
      if (action.nodeColorsToo) {
        return Object.assign({}, state, {
          nodeColors: action.nodeColorsToo,
          nodeColorsVersion: action.version
        });
      }
      return state;
    default:
      return state;
  }
};

export default treeToo;
