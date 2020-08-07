import { determineColorByGenotypeMutType, calcNodeColor } from "../util/colorHelpers";
import { isColorByGenotype } from "../util/getGenotype";
import { calcColorScale } from "../util/colorScale";
import { timerStart, timerEnd } from "../util/perf";
import { changeMutType } from "./entropy";
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

    /* step 3: change in mutType? */
    const colorByMutType = determineColorByGenotypeMutType(colorBy);
    const newMutType = colorByMutType !== controls.mutType ? colorByMutType : false;

    timerEnd("changeColorBy calculations"); /* end timer before dispatch */

    /* step 4: dispatch */

    /*
     * Changing the mutType must happen _before_ updating colors because the
     * entropy bars need to be recomputed for the new mutType before applying
     * the new genotype colorBy.  Otherwise, the entropy component tries to
     * apply the new genotype colorBy to bars of the wrong mutType, which in
     * turn causes all sorts of errors ("entropy out of sync" and selected
     * positions not matching the data bars).
     *
     * The state dependencies are a bit tangled here, but de-tangling them is a
     * larger project for another time.
     *
     *   -trs, 14 Nov 2018
     */
    if (newMutType) {
      dispatch(changeMutType(newMutType));
    }

    dispatch({
      type: types.NEW_COLORS,
      colorBy,
      colorScale,
      nodeColors,
      nodeColorsToo,
      version: colorScale.version
    });

    /* step 5 - frequency dispatch */
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
