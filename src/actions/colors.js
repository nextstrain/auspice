import { calcNodeColor } from "../util/colorHelpers";
import { isColorByGenotype } from "../util/getGenotype";
import { calcColorScale } from "../util/colorScale";
import { timerStart, timerEnd } from "../util/perf";
import { changeEntropyCdsSelection } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import * as types from "./types";

/* providedColorBy: undefined | string */
export const changeColorBy = (providedColorBy = undefined) => {
  return (dispatch, getState) => {
    timerStart("changeColorBy calculations");
    const { controls, tree, treeToo, metadata, frequencies } = getState();

    /* bail if all required params aren't (yet) available! */
    if (!(tree.nodes !== null && metadata.loaded)) {
      /* note this *can* run before the tree is loaded - we only need the nodes */
      // console.log("updateColorScale not running due to load statuses of ", "tree nodes are null?", tree.nodes === null, "metadata", metadata.loaded);
      return null;
    }
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;
    const colorScale = calcColorScale(colorBy, controls, tree, treeToo, metadata);
    const nodeColors = calcNodeColor(tree, colorScale);
    const nodeColorsToo = treeToo.loaded ? calcNodeColor(treeToo, colorScale) : undefined;

    timerEnd("changeColorBy calculations"); /* end timer before dispatch */

    dispatch(changeEntropyCdsSelection(colorBy));

    dispatch({
      type: types.NEW_COLORS,
      colorBy,
      colorScale,
      nodeColors,
      nodeColorsToo,
      version: colorScale.version
    });

    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }

    return null;
  };
};


export const updateColorByWithRootSequenceData = () => {
  return (dispatch, getState) => {
    const { controls, metadata } = getState();
    if (!metadata.rootSequence) {
      console.error("Missing root sequence");
      return null;
    }
    const colorBy = controls.colorBy;
    if (isColorByGenotype(colorBy)) {
      dispatch(changeColorBy(colorBy));
    }
    return null;
  };
};
