import { parseGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { calcNodeColor } from "../components/tree/treeHelpers";
import { determineColorByGenotypeType } from "../util/colorHelpers";
import { updateEntropyVisibility } from "./entropy";
import * as types from "./types";

/* providedColorBy: undefined | string */
export const changeColorBy = (providedColorBy = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    const { controls, tree, sequences, metadata } = getState();
    /* step 0: bail if all required params aren't (yet) available! */
    /* note this *can* run before the tree is loaded - we only need the nodes */
    if (!(tree.nodes !== null && sequences.loaded && metadata.loaded)) {
      // console.log(
      //   "updateColorScale not running due to load statuses of ",
      //   "tree nodes are null?", tree.nodes === null,
      //   "sequences", sequences.loaded,
      //   "metadata", metadata.loaded
      // );
      return null;
    }
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;

    /* step 1: calculate the required colour scale */
    const version = controls.colorScale === undefined ? 1 : controls.colorScale.version + 1;
    // console.log("updateColorScale setting colorScale to ", version);
    const colorScale = getColorScale(colorBy, tree, sequences, metadata.colorOptions, version);
    /*   */
    if (colorBy.slice(0, 3) === "gt-" && sequences.geneLength) {
      colorScale.genotype = parseGenotype(colorBy, sequences.geneLength);
    }

    /* step 2: calculate the node colours */
    const nodeColors = calcNodeColor(tree, colorScale, sequences);

    /* step 3: change in mutType? */
    const newMutType = determineColorByGenotypeType(colorBy) !== controls.mutType ? determineColorByGenotypeType(colorBy) : false;
    if (newMutType) {
      updateEntropyVisibility(dispatch, getState);
    }

    /* step 4: dispatch */
    dispatch({
      type: types.NEW_COLORS,
      colorBy,
      colorScale,
      nodeColors,
      version,
      newMutType
    });

    return null;
  };
};
