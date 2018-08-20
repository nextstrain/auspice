import { debounce } from 'lodash';
import { calcEntropyInView } from "../util/entropy";
import * as types from "./types";

/* debounce works better than throttle, as it _won't_ update while events are still coming in (e.g. dragging the date slider) */
export const updateEntropyVisibility = debounce((dispatch, getState) => {
  const { entropy, controls, tree } = getState();
  if (!tree.nodes ||
    !tree.visibility ||
    !entropy.geneMap ||
    controls.animationPlayPauseButton !== "Play"
  ) {return;}
  const [data, maxYVal] = calcEntropyInView(tree.nodes, tree.visibility, controls.mutType, entropy.geneMap, entropy.showCounts);
  dispatch({type: types.ENTROPY_DATA, data, maxYVal});
}, 500, { leading: true, trailing: true });

export const changeMutType = (newMutType) => (dispatch, getState) => {
  dispatch({type: types.TOGGLE_MUT_TYPE, data: newMutType});
  updateEntropyVisibility(dispatch, getState);
};

export const showCountsNotEntropy = (showCounts) => (dispatch, getState) => {
  dispatch({type: types.ENTROPY_COUNTS_TOGGLE, showCounts});
  updateEntropyVisibility(dispatch, getState);
};

export const changeZoom = (zoomc) => (dispatch, getState) => {
  dispatch({type: types.CHANGE_ZOOM, zoomc});
  updateEntropyVisibility(dispatch, getState);
};
