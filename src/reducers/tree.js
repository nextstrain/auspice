import * as types from "../actions/types";
import { processNodes, calcLayouts } from "../util/processNodes";
import d3 from "d3";

/* A version increase (i.e. props.version !== nextProps.version) necessarily implies
that the tree is loaded as they are set on the same action */

const getDefaultState = function () {
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
    version: 0
  };
};

const Tree = (state = getDefaultState(), action) => {
  switch (action.type) {
  case types.NEW_DATASET:
    /* loaded returns to the default (false) */
    const nodes = processNodes(d3.layout.tree().size([1, 1]).nodes(action.tree));
    nodes[0].parent = nodes[0]; // make root its own parent
    calcLayouts(nodes, ["div", "num_date"]);
    return Object.assign({}, getDefaultState(), {
      inViewRootNodeIdx: 0,
      nodes: nodes
    });
  case types.DATA_VALID:
    return Object.assign({}, state, {
      loaded: true,
      version: state.version + 1
    });
  case types.CHANGE_DATES_VISIBILITY_THICKNESS: /* fall-through */
  case types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS:
    return Object.assign({}, state, {
      visibility: action.visibility,
      visibilityVersion: action.visibilityVersion,
      branchThickness: action.branchThickness,
      branchThicknessVersion: action.branchThicknessVersion
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
  default:
    return state;
  }
};

export default Tree;
