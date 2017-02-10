import { calcTipVisibility, calcTipRadii, calcNodeColor } from "../util/treeHelpers";
import * as controlTypes from "./controls";

export const UPDATE_TIP_VISIBILITY = "UPDATE_TIP_VISIBILITY";
export const UPDATE_TIP_RADII = "UPDATE_TIP_RADII";
export const UPDATE_NODE_COLORS = "UPDATE_NODE_COLORS";

const updateTipVisibility = () => {
  return (dispatch, getState) => {
    const { tree, metadata, controls } = getState();
    dispatch({
      type: UPDATE_TIP_VISIBILITY,
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
      dispatch({type: controlTypes.CHANGE_DATE_MIN, data: newMin});
    }
    if (newMax) {
      dispatch({type: controlTypes.CHANGE_DATE_MAX, data: newMax});
    }
    dispatch(updateTipVisibility());
  };
};


const updateTipRadii = () => {
  return (dispatch, getState) => {
    const { controls, sequences, tree } = getState();
    dispatch({
      type: UPDATE_TIP_RADII,
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
      dispatch({type: controlTypes.LEGEND_ITEM_MOUSEENTER,
                data: label});
    } else {
      dispatch({type: controlTypes.LEGEND_ITEM_MOUSELEAVE});
    }
    dispatch(updateTipRadii());
  };
};

export const updateNodeColors = () => {
  return (dispatch, getState) => {
    const { controls, sequences, tree } = getState();
    const data = calcNodeColor(tree, controls.colorScale, sequences);
    if (data) {
      dispatch({
        type: UPDATE_NODE_COLORS,
        data: calcNodeColor(tree, controls.colorScale, sequences),
        version: tree.nodeColorsVersion + 1
      });
    }
  };
};
