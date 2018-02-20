import { flattenTree, appendParentsToTree, processVaccines, processNodes } from "../components/tree/treeHelpers";
import { getValuesAndCountsOfVisibleTraitsFromTree, getAllValuesAndCountsOfTraitsFromTree } from "../util/treeTraversals";
import * as types from "../actions/types";

/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action
*/

const getDefaultState = () => {
  return {
    loaded: false,
    nodes: null,
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
    visibleStateCounts: {},
    totalStateCounts: {}
  };
};

const getAttrsOnTerminalNodes = (nodes) => {
  for (const node of nodes) {
    if (!node.hasChildren) {
      return Object.keys(node.attr).filter((v) => v.toLowerCase() !== "strain");
    }
  }
  console.error("Parsed tree without terminal nodes.");
  return undefined;
};

const Tree = (state = getDefaultState(), action) => {
  switch (action.type) {
    case types.NEW_DATASET: {
      /* loaded returns to the default (false) */
      appendParentsToTree(action.tree);
      const nodesArray = flattenTree(action.tree);
      const nodes = processNodes(nodesArray);
      const vaccines = processVaccines(nodes, action.meta.vaccine_choices);
      return Object.assign({}, getDefaultState(), {
        nodes,
        vaccines,
        attrs: getAttrsOnTerminalNodes(nodes)
      });
    }
    case types.DATA_VALID:
      return Object.assign({}, state, {
        loaded: true,
        version: state.version + 1
      });
    case types.DATA_INVALID:
      return Object.assign({}, state, {
        loaded: false
      });
    case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fall-through */
    case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS:
      const newStates = {
        visibility: action.visibility,
        visibilityVersion: action.visibilityVersion,
        branchThickness: action.branchThickness,
        branchThicknessVersion: action.branchThicknessVersion,
        idxOfInViewRootNode: action.idxOfInViewRootNode,
        visibleStateCounts: getValuesAndCountsOfVisibleTraitsFromTree(state.nodes, action.visibility, action.stateCountAttrs)
      };
      /* we only want to calculate totalStateCounts on the first pass */
      if (!state.loaded) {
        newStates.totalStateCounts = getAllValuesAndCountsOfTraitsFromTree(state.nodes, action.stateCountAttrs);
      }
      return Object.assign({}, state, newStates);
    case types.UPDATE_TIP_RADII:
      return Object.assign({}, state, {
        tipRadii: action.data,
        tipRadiiVersion: action.version
      });
    case types.URL_QUERY_CHANGE_WITH_COMPUTED_STATE:
      return action.newTree;
    case types.NEW_COLORS:
      return Object.assign({}, state, {
        nodeColors: action.nodeColors,
        nodeColorsVersion: action.version
      });
    case types.ADD_COLOR_BYS:
      /* modify in place ?!?! */
      for (const node of state.nodes) {
        if (action.taxa.indexOf(node.strain) !== -1) {
          action.newColorBys.map((colorBy, idx) => {
            node.attr[colorBy] = action.data[node.strain][idx];
          });
        }
      }
      return Object.assign({}, state, {
        attrs: getAttrsOnTerminalNodes(state.nodes)
      });
    default:
      return state;
  }
};

export default Tree;
