import { determineColorByGenotypeType, calcColorScaleAndNodeColors } from "../util/colorHelpers";
import { timerStart, timerEnd } from "../util/perf";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import * as types from "./types";

/* providedColorBy: undefined | string */
export const changeColorBy = (providedColorBy = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    timerStart("changeColorBy calculations");
    const { controls, tree, metadata, frequencies } = getState();

    /* bail if all required params aren't (yet) available! */
    if (!(tree.nodes !== null && metadata.loaded)) {
      /* note this *can* run before the tree is loaded - we only need the nodes */
      // console.log("updateColorScale not running due to load statuses of ", "tree nodes are null?", tree.nodes === null, "metadata", metadata.loaded);
      return null;
    }
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;
    const {nodeColors, colorScale, version} = calcColorScaleAndNodeColors(colorBy, controls, tree, metadata);

    /* step 3: change in mutType? */
    const colorByMutType = determineColorByGenotypeType(colorBy);
    const newMutType = colorByMutType !== controls.mutType ? colorByMutType : false;

    timerEnd("changeColorBy calculations"); /* end timer before dispatch */

    /* step 4: dispatch */
    dispatch({
      type: types.NEW_COLORS,
      colorBy,
      colorScale,
      nodeColors,
      version,
      newMutType
    });

    /* step 5 - entropy & frequency dispatches (maybe these could be combined) */
    if (newMutType) {
      updateEntropyVisibility(dispatch, getState);
    }
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }

    return null;
  };
};
