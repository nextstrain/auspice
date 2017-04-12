import * as types from "../actions/types";
// import { gatherTips } from "../util/treeHelpers";
import { processNodes, calcLayouts } from "../util/processNodes";
import d3 from "d3";
import { calcBranchThickness, calcTipCounts, calcVisibility } from "../util/treeHelpers";


const getDefaultState = function () {
  return {
    loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
    nodes: null,
    error: null,
    visibility: null,
    visibilityVersion: 0,
    nodeColors: null,
    nodeColorsVersion: 0,
    tipRadii: null,
    tipRadiiVersion: 0,
    branchThickness: null,
    branchThicknessVersion: 0
  };
};

const Tree = (state = getDefaultState(), action) => {
  switch (action.type) {
  case types.REQUEST_TREE:
    return Object.assign({}, getDefaultState(), {
      loadStatus: 1,
      error: null
    });
  case types.RECEIVE_TREE:
    /* this function is required to do a number of things, and the order is crucial
    (1) construct the nodes
    (2) calculate tip (node) visibility - uses redux.controls located in action.controls
    (3) calculate tipCounts (not fullTipCounts)
    (4) set branchThickness
    */
    /* step 1 */
    const nodes = processNodes(d3.layout.tree().size([1, 1]).nodes(action.data));
    nodes[0].parent = nodes[0]; // make root its own parent
    calcLayouts(nodes, ["div", "num_date"]);
    /* step 2 */
    const visibility = calcVisibility({nodes}, action.controls);
    /* step 3 - this will set the tipCount property of each node */
    calcTipCounts(nodes[0], visibility);
    /* step 4 */
    const branchThickness = calcBranchThickness(nodes, visibility, 0);
    /* set state */
    console.log("Tree reducer returning now.")
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      inViewRootNodeIdx: 0,
      nodes: nodes,
      branchThickness,
      /* do not change branchThicknessVersion - this is applied by phyloTree.render, not an update method */
      datasetGuid: Math.floor(Math.random() * 100000000000),
      visibility,
      visibilityVersion: 1
    });
  case types.TREE_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  case types.UPDATE_TIP_VISIBILITY:
    return Object.assign({}, state, {
      visibility: action.data,
      visibilityVersion: action.version
    });
  case types.UPDATE_TIP_RADII:
    return Object.assign({}, state, {
      tipRadii: action.data,
      tipRadiiVersion: action.version
    });
  case types.UPDATE_NODE_COLORS:
    return Object.assign({}, state, {
      nodeColors: action.data,
      nodeColorsVersion: action.version
    });
  case types.UPDATE_BRANCH_THICKNESS:
    return Object.assign({}, state, {
      branchThickness: action.data,
      branchThicknessVersion: action.version
    });
  default:
    return state;
  }
};

export default Tree;
