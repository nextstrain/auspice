import { TOGGLE_STREAM_TREE, CHANGE_STREAM_TREE_BRANCH_LABEL } from "./types";
import { processStreams, labelStreamMembership, isNodeWithinAnotherStream } from "../util/treeStreams";
import { getParentStream } from "../components/tree/phyloTree/helpers";
import { updateVisibleTipsAndBranchThicknesses } from "./tree";
import { warningNotification } from "./notifications";

export function toggleStreamTree() {
  return function(dispatch, getState) {
    const {controls, tree} = getState();
    const showStreamTrees = !controls.showStreamTrees; // new state
    
    if (showStreamTrees===false) { /* turn off stream trees */
      dispatch({type: TOGGLE_STREAM_TREE, showStreamTrees});
      return;
    }

    if (controls.streamTreeBranchLabel===null || Object.keys(tree.streams).length===0) {
      // toggle switched on without an already set branch label (or there was a default but we
      // started with ?streamLabel=none so we didn't compute any streams)
      // Note: availableStreamLabelKeys can be set in the JSON, so this allows the author to define a default
      // stream tree key while not starting with stream trees displayed
      dispatch(changeStreamTreeBranchLabel(controls.availableStreamLabelKeys[0]));
      return;
    }

    const currentRoot = tree.nodes[tree.idxOfInViewRootNode]
    if (currentRoot && currentRoot.inStream && !currentRoot.streamName) {
      /**
       * This block indicates a situation where we aren't viewing streams, but the current in-view root is _within_ a stream and
       * we're asking to show streams. We can't display a stream starting half-way through the stream, so we can either
       * (a) prevent this action from happening or (b) zoom back out to show the entire stream we're currently within.
       * We do (b) and use a `setTimeout` to ensure that we should the zooming out behaviour before the stream is toggled on.
       * Timeout's are prone to bugs and so improvements here are welcome. TODO XXX
       */
      const newRootNode = getParentStream(currentRoot);
      dispatch(updateVisibleTipsAndBranchThicknesses({root: [newRootNode.arrayIdx, undefined]}));
      window.setTimeout(() => dispatch(toggleStreamTree()), 500)
      return;
    }

    processStreams(tree.streams, tree.nodes, tree.visibility, controls.distanceMeasure, controls.colorScale)
    dispatch({type: TOGGLE_STREAM_TREE, showStreamTrees})
  }
} 


export function changeStreamTreeBranchLabel(newLabel) {
  return function(dispatch, getState) {
    const {controls, tree} = getState();

    if (isNodeWithinAnotherStream(tree.nodes[tree.idxOfInViewRootNode], newLabel)) {
      dispatch(warningNotification({message: `Cannot switch streams to ${newLabel} as the subtree we're viewing would be inside a stream`}));
      return;
    }

    const streams = labelStreamMembership(tree.nodes[0], newLabel);
    processStreams(streams, tree.nodes, tree.visibility, controls.distanceMeasure, controls.colorScale);

    dispatch({type: CHANGE_STREAM_TREE_BRANCH_LABEL, streams, streamTreeBranchLabel: newLabel})
  }
}
