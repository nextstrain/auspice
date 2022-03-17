import * as types from "../actions/types";
import { addNodeAttrs } from "../util/treeMiscHelpers";
import { getDefaultTreeState } from "./tree";
/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action */

const treeToo = (state = getDefaultTreeState(), action) => {

  /* There are only a few actions we should always listen for, as they can change
  the presence / absence of the second tree */
  switch (action.type) {
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
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
    case types.ADD_EXTRA_METADATA:
      // add data into `nodes` in-place, so no redux update will be triggered if you only listen to `nodes`
      addNodeAttrs(state.nodes, action.newNodeAttrs);
      return state;
    default:
      return state;
  }
};

export default treeToo;
