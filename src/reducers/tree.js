import * as types from "../actions";
import { gatherTips } from "../util/treeHelpers";
import { processNodes, calcLayouts } from "../util/processNodes";
import d3 from "d3";

const Tree = (state = {
  loading: false,
  tree: null,
  nodes: null,
  error: null,
  root: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_TREE:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_TREE:
    const tree = d3.layout.tree().size([1,1]);
    const nodes = processNodes(tree.nodes(action.data));
    nodes[0].parent = nodes[0]; // make root its own parent
    calcLayouts(nodes, ["div", "num_date"]);

    const dmin = d3.min(nodes.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:1900));
    const dmax = d3.max(nodes.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:2020));
    return Object.assign({}, state, {
      loading: false,
      error: null,
      dateRange: [dmin, dmax],
      nodes: nodes,
      datasetGuid: Math.floor(Math.random() * 100000000000)
    });
  case types.TREE_FETCH_ERROR:
    return Object.assign({}, state, {
      loading: false,
      error: action.data
    });
  default:
    return state;
  }
};

export default Tree;
