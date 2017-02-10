import { parseGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { updateNodeColors } from "./treeProperties";

export const TOGGLE_BRANCH_LABELS = "TOGGLE_BRANCH_LABELS";
export const LEGEND_ITEM_MOUSEENTER = "LEGEND_ITEM_MOUSEENTER";
export const LEGEND_ITEM_MOUSELEAVE = "LEGEND_ITEM_MOUSELEAVE";
export const BRANCH_MOUSEENTER = "BRANCH_MOUSEENTER";
export const BRANCH_MOUSELEAVE = "BRANCH_MOUSELEAVE";
export const NODE_MOUSEENTER = "NODE_MOUSEENTER";
export const NODE_MOUSELEAVE = "NODE_MOUSELEAVE";
export const SEARCH_INPUT_CHANGE = "SEARCH_INPUT_CHANGE";
export const CHANGE_LAYOUT = "CHANGE_LAYOUT";
export const CHANGE_DISTANCE_MEASURE = "CHANGE_DISTANCE_MEASURE";
export const CHANGE_DATE_MIN = "CHANGE_DATE_MIN";
export const CHANGE_DATE_MAX = "CHANGE_DATE_MAX";
export const CHANGE_ABSOLUTE_DATE_MIN = "CHANGE_ABSOLUTE_DATE_MIN";
export const CHANGE_ABSOLUTE_DATE_MAX = "CHANGE_ABSOLUTE_DATE_MAX";
export const CHANGE_COLOR_BY = "CHANGE_COLOR_BY";
export const SET_COLOR_SCALE = "SET_COLOR_SCALE";
export const NEW_DATASET = "NEW_DATASET";
export const RESET_CONTROLS = "RESET_CONTROLS";

const colorScaleWrapper = function (colorBy, tree, sequences, colorOptions, newVersion) {
  const colorScale = getColorScale(colorBy, tree, sequences, colorOptions, newVersion);
  if (colorBy.slice(0, 3) === "gt-" && sequences.geneLength) {
    colorScale.genotype = parseGenotype(colorBy, sequences.geneLength);
  }
  return colorScale;
};

export const updateColorScale = function () {
  return function (dispatch, getState) {
    console.log("colorScale updated")
    const { controls, tree, sequences, metadata } = getState();
    const previousVersion = controls.colorScale ? controls.colorScale.version : 0;
    dispatch({
      type: SET_COLOR_SCALE,
      data: colorScaleWrapper(controls.colorBy, tree, sequences, metadata.colorOptions, previousVersion + 1)
    });
  };
};

/* this is a thunk so it can dispatch multiple actions
   here is where the colorScale is calculated
*/
export const changeColorBy = function (colorBy) {
  return function (dispatch) {
    dispatch({
      type: CHANGE_COLOR_BY,
      data: colorBy
    });
    // update the colorScale - NB this won't have an effect unless the tree etc are loaded
    dispatch(updateColorScale());
    dispatch(updateNodeColors());
  };
};
