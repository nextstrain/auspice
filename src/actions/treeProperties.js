import { calcTipVisibility, calcTipRadii } from "../util/treeHelpers";
import * as types from "./types";

const updateTipVisibility = () => {
  return (dispatch, getState) => {
    const { tree, metadata, controls } = getState();
    dispatch({
      type: types.UPDATE_TIP_VISIBILITY,
      data: calcTipVisibility(tree, metadata, controls.dateMin, controls.dateMax),
      version: tree.tipVisibilityVersion + 1
    });
  };
};

/* when tip max / min changes, we need to (a) update the controls reducer
with the new value(s), (b) update the tree tipVisibility */
export const changeDateFilter = function (newMin, newMax) {
  return (dispatch) => {
    if (newMin) {
      dispatch({type: types.CHANGE_DATE_MIN, data: newMin});
    }
    if (newMax) {
      dispatch({type: types.CHANGE_DATE_MAX, data: newMax});
    }
    dispatch(updateTipVisibility());
  };
};


const updateTipRadii = () => {
  return (dispatch, getState) => {
    const { controls, sequences, tree } = getState();
    dispatch({
      type: types.UPDATE_TIP_RADII,
      data: calcTipRadii(controls.selectedLegendItem, controls.colorScale, sequences, tree),
      version: tree.tipRadiiVersion + 1
    });
  };
};

/* when the selected legend item changes
(a) update the controls reducer with the new value
(b)change the tipRadii
*/
export const legendMouseEnterExit = function (label = null) {
  return (dispatch) => {
    if (label) {
      dispatch({type: types.LEGEND_ITEM_MOUSEENTER,
                data: label});
    } else {
      dispatch({type: types.LEGEND_ITEM_MOUSELEAVE});
    }
    dispatch(updateTipRadii());
  };
};
