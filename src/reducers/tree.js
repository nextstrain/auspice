import * as types from "../actions";
import { gatherTips } from "../util/treeHelpers";

const Tree = (state = {
  loading: false,
  tree: null,
  error: null,
  tips: null,
  root: null
}, action) => {
  switch (action.type) {
  case types.REQUEST_TREE:
    return Object.assign({}, state, {
      loading: true,
      error: null
    });
  case types.RECEIVE_TREE:
    const tips = [];
    gatherTips(action.data, tips);
    const dmin = d3.min(tips.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:1900));
    const dmax = d3.max(tips.map((d) => (typeof d.attr !== "undefined")?d.attr.num_date:2020));
    return Object.assign({}, state, {
      loading: false,
      error: null,
      dateRange: [dmin, dmax],
      tree: action.data,
      tips: tips,
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
