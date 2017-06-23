import { parseGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { calcNodeColor } from "../util/treeHelpers";
import * as types from "./types";

const colorScaleWrapper = function (colorBy, tree, sequences, colorOptions, newVersion) {
  const colorScale = getColorScale(colorBy, tree, sequences, colorOptions, newVersion);
  if (colorBy.slice(0, 3) === "gt-" && sequences.geneLength) {
    colorScale.genotype = parseGenotype(colorBy, sequences.geneLength);
  }
  return colorScale;
};



export const updateColorScale = function () {
  return function (dispatch, getState) {
    const { controls, tree, sequences, metadata } = getState();
    /* bail if all required params aren't (yet) available! */
    if (!(tree.loadStatus === 2 && sequences.loadStatus === 2 && metadata.loadStatus === 2)) {
      // console.log(
      //   "updateColorScale not running due to loadStatuses of ",
      //   "tree", tree.loadStatus,
      //   "sequences", sequences.loadStatus,
      //   "metadata", metadata.loadStatus
      // );
      return null;
    }
    // console.log("updateColorScale running");
    const previousVersion = controls.colorScale ? controls.colorScale.version : 0;
    dispatch({
      type: types.SET_COLOR_SCALE,
      data: colorScaleWrapper(controls.colorBy, tree, sequences, metadata.colorOptions, previousVersion + 1)
    });
  };
};

export const updateNodeColors = () => {
  return (dispatch, getState) => {
    const { controls, sequences, tree } = getState();
    if (!controls.colorScale.version) {
      /* bail - the default color scale (version = 0) contains no real information */
      return null;
    }
    const data = calcNodeColor(tree, controls.colorScale, sequences);
    // console.log("updateNodeColors() run with version", controls.colorScale.version, "data:", data)
    if (data) {
      dispatch({
        type: types.UPDATE_NODE_COLORS,
        data,
        version: tree.nodeColorsVersion + 1
      });
    }
  };
};

/* when colorBy changes, it is
(a) stored in reduxState.controls.colorBy
(b) colorScale is recalculated (and stored in reduxState.controls.colorScale)
(c) tree node colors are updated (and stored in reduxState.tree.nodeCOlors)
*/
export const changeColorBy = function (colorBy) {
  return function (dispatch) {
    dispatch({
      type: types.CHANGE_COLOR_BY,
      data: colorBy
    });
    // update the colorScale - NB this won't have an effect unless the tree etc are loaded
    dispatch(updateColorScale());
    dispatch(updateNodeColors());
  };
};
