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
  case types.NEW_DATASET:
    /* keep loadStatus @ 1 */
    const nodes = processNodes(d3.layout.tree().size([1, 1]).nodes(action.tree));
    nodes[0].parent = nodes[0]; // make root its own parent
    calcLayouts(nodes, ["div", "num_date"]);
    return Object.assign({}, getDefaultState(), {
      loadStatus: 2,
      inViewRootNodeIdx: 0,
      nodes: nodes
    });
  case types.DATA_VALID:
    return Object.assign({}, state, {
      loadStatus: 2,
      datasetGuid: Math.floor(Math.random() * 100000000000)
    });
  case types.DATA_INVALID:
    return getDefaultState();
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
  case types.NEW_COLORS:
    return Object.assign({}, state, {
      nodeColors: action.nodeColors,
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
