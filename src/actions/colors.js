import { parseGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { setGenotype } from "../util/setGenotype";
import { calcNodeColor } from "../components/tree/treeHelpers";
import { determineColorByGenotypeType } from "../util/colorHelpers";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import * as types from "./types";

/* providedColorBy: undefined | string */
export const changeColorBy = (providedColorBy = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    /* note this *can* run before the tree is loaded - we only need the nodes */
    const { controls, tree, metadata } = getState();
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;

    /* bail if all required params aren't (yet) available! */
    if (!(tree.nodes !== null && metadata.loaded)) {
      // console.log("updateColorScale not running due to load statuses of ", "tree nodes are null?", tree.nodes === null, "metadata", metadata.loaded);
      return null;
    }

    /* S E T   T H E   G E N O T Y P E    A T    E A C H    N O D E */
    let genotype;
    if (colorBy.slice(0, 3) === "gt-") {
      genotype = parseGenotype(colorBy, controls.geneLength);
      /* turns "gt-nuc_225" -> ["nuc", 224], "gt-HA1_198" -> ["HA1", 197] (notice 1-based -> 0-based) */
      setGenotype(tree.nodes, genotype[0][0], genotype[0][1] + 1);
      /* sets node.currentGt to "A", "T", "S", etc for each node */
    }

    /* C A L C U L A T E    T H E    C O L O U R     S C A L E */
    const version = controls.colorScale === undefined ? 1 : controls.colorScale.version + 1;
    const colorScale = getColorScale(colorBy, tree, controls.geneLength, metadata.colorOptions, version, controls.absoluteDateMaxNumeric);
    if (genotype && controls.geneLength) colorScale.genotype = genotype;
    /* colorScale is an object with keys:
    scale -> d3 color scale function
    continuous -> bool
    colorBy -> string (duplicated unneccesarily)
    legendBoundsMap -> for contnious variables. Keys lower_bound & upper_bound
    version -> INT
    genotype (only if applicable) -> array length 2 (see above) */


    /* step 2: calculate the node colours */
    const nodeColors = calcNodeColor(tree, colorScale);

    /* step 3: change in mutType? */
    const newMutType = determineColorByGenotypeType(colorBy) !== controls.mutType ? determineColorByGenotypeType(colorBy) : false;
    if (newMutType) {
      updateEntropyVisibility(dispatch, getState);
    }
    updateFrequencyDataDebounced(dispatch, getState);

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
