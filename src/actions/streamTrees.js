
import { TOGGLE_STREAM_TREE } from "./types";
import { partitionIntoStreams } from "../util/partitionIntoStreams";

export function toggleStreamTree() {
  return function(dispatch, getState) {
    const {controls, tree} = getState();
    const showStreamTrees = !controls.showStreamTrees;
    const streams = partitionIntoStreams(showStreamTrees, tree.nodes, tree.visibility, controls.colorScale, controls.absoluteDateMinNumeric, controls.absoluteDateMaxNumeric)
    console.log("THUNK::New streams structure:", streams)
    dispatch({type: TOGGLE_STREAM_TREE, showStreamTrees, streams})
  }
} 