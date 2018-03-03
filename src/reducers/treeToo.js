import { getValuesAndCountsOfVisibleTraitsFromTree } from "../util/treeTraversals";
import * as types from "../actions/types";
import {getDefaultTreeState, getAttrsOnTerminalNodes} from "./tree";
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
    case types.TREE_TOO_DATA:
      console.log("TREE_TOO_DATA:", action.treeTooState)
      return action.treeTooState;
    // case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fall-through */
    // case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS:
    //   const newStates = {
    //     visibility: action.visibility,
    //     visibilityVersion: action.visibilityVersion,
    //     branchThickness: action.branchThickness,
    //     branchThicknessVersion: action.branchThicknessVersion,
    //     idxOfInViewRootNode: action.idxOfInViewRootNode,
    //     visibleStateCounts: getValuesAndCountsOfVisibleTraitsFromTree(state.nodes, action.visibility, action.stateCountAttrs),
    //     selectedStrain: action.selectedStrain
    //   };
    //   return Object.assign({}, state, newStates);
    // case types.UPDATE_TIP_RADII:
    //   return Object.assign({}, state, {
    //     tipRadii: action.data,
    //     tipRadiiVersion: action.version
    //   });
    // case types.NEW_COLORS:
    //   return Object.assign({}, state, {
    //     nodeColors: action.nodeColors,
    //     nodeColorsVersion: action.version
    //   });
    // case types.ADD_COLOR_BYS:
    //   /* modify in place ?!?! */
    //   for (const node of state.nodes) {
    //     if (action.taxa.indexOf(node.strain) !== -1) {
    //       action.newColorBys.forEach((colorBy, idx) => {
    //         node.attr[colorBy] = action.data[node.strain][idx];
    //       });
    //     }
    //   }
    //   return Object.assign({}, state, {
    //     attrs: getAttrsOnTerminalNodes(state.nodes)
    //   });
    default:
      return state;
  }
};

export default treeToo;
