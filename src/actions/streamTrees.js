
import { TOGGLE_STREAM_TREE, CHANGE_STREAM_TREE_BRANCH_LABEL } from "./types";
import { partitionIntoStreams } from "../util/partitionIntoStreams";

export function toggleStreamTree() {
  return function(dispatch, getState) {
    const {controls, tree} = getState();
    const showStreamTrees = !controls.showStreamTrees;
    const streams = partitionIntoStreams(showStreamTrees, controls.streamTreeBranchLabel, tree.nodes, tree.visibility, controls.colorScale, controls.absoluteDateMinNumeric, controls.absoluteDateMaxNumeric)
    dispatch({type: TOGGLE_STREAM_TREE, showStreamTrees, streams})
  }
}

export function changeStreamTreeBranchLabel(newLabel) {
  return function(dispatch, getState) {
    const {controls, tree} = getState();
    const showStreamTrees = newLabel!=='none';
    const streams = partitionIntoStreams(showStreamTrees, newLabel, tree.nodes, tree.visibility, controls.colorScale, controls.absoluteDateMinNumeric, controls.absoluteDateMaxNumeric)
    dispatch({
      type: CHANGE_STREAM_TREE_BRANCH_LABEL,
      streams,
      showStreamTrees,
      streamTreeBranchLabel: newLabel
    })
  }
}
