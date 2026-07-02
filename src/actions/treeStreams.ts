import { TOGGLE_STREAM_TREE, TOGGLE_STREAM_TREE_LABELS, CHANGE_STREAM_TREE_BRANCH_LABEL } from "./types";
import { processStreams, labelStreamMembership, isNodeWithinAnotherStream, autoPartitionStreams, AUTO_STREAM_LABEL, AUTO_STREAM_TIP_THRESHOLD } from "../util/treeStreams";
import { ThunkFunction } from "../store";
import { getParentStream } from "../components/tree/phyloTree/helpers";
import { updateVisibleTipsAndBranchThicknesses } from "./tree";
import { warningNotification } from "./notifications";

export function toggleStreamTree(): ThunkFunction {
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

    /* Re-enable by rebuilding streams fresh via changeStreamTreeBranchLabel rather than
     * re-processing the streams already in the store: processStreams mutates its input
     * (e.g. renderingOrder / per-node stream fields), which violates redux immutability
     * when run on store state and aborts the redraw. */
    dispatch(changeStreamTreeBranchLabel(controls.streamTreeBranchLabel));
  }
} 


export function changeStreamTreeBranchLabel(newLabel): ThunkFunction {
  return function(dispatch, getState) {
    const {controls, tree} = getState();
    const isAuto = newLabel === AUTO_STREAM_LABEL;

    if (!isAuto && isNodeWithinAnotherStream(tree.nodes[tree.idxOfInViewRootNode], newLabel)) {
      dispatch(warningNotification({message: `Cannot switch streams to ${newLabel} as the subtree we're viewing would be inside a stream`}));
      return;
    }

    const streams = isAuto ?
      autoPartitionStreams(tree.nodes[0], AUTO_STREAM_TIP_THRESHOLD) :
      labelStreamMembership(tree.nodes[0], newLabel);
    processStreams(streams, tree.nodes, tree.visibility, controls.distanceMeasure, controls.colorScale);

    dispatch({type: CHANGE_STREAM_TREE_BRANCH_LABEL, streams, streamTreeBranchLabel: newLabel})
  }
}


export function toggleStreamTreeLabels(): ThunkFunction {
  return function(dispatch, getState) {
    dispatch({type: TOGGLE_STREAM_TREE_LABELS, value: !getState().controls.showStreamTreeLabels});
  }
}
