import * as types from "../actions/types";
// import { gatherTips } from "../util/treeHelpers";
import { processNodes, calcLayouts } from "../util/processNodes";
import d3 from "d3";
import { calcBranchThickness } from "../util/treeHelpers";


const getDefaultState = function () {
  return {
    loadStatus: 0, /* 0: no data, 1: data incoming, 2: data loaded */
    nodes: null,
    error: null,
    tipVisibility: null,
    tipVisibilityVersion: 0,
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
    const tree = d3.layout.tree().size([1, 1]);
    const nodes = processNodes(tree.nodes(action.data));
    nodes[0].parent = nodes[0]; // make root its own parent
    calcLayouts(nodes, ["div", "num_date"]);
    // const dmin = d3.min(nodes.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:1900));
    // const dmax = d3.max(nodes.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:2020));
    return Object.assign({}, state, {
      loadStatus: 2,
      error: null,
      inViewRootNodeIdx: 0,
      // dateRange: [dmin, dmax],
      nodes: nodes,
      branchThickness: calcBranchThickness(nodes, 0), /* set initially */
      branchThicknessVersion: 1,
      datasetGuid: Math.floor(Math.random() * 100000000000)
    });
  case types.TREE_FETCH_ERROR:
    return Object.assign({}, state, {
      loadStatus: 0,
      error: action.data
    });
  case types.UPDATE_TIP_VISIBILITY:
    return Object.assign({}, state, {
      tipVisibility: action.data,
      tipVisibilityVersion: action.version
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
