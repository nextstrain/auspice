import { parseEncodedGenotype } from "../util/getGenotype";
import getColorScale from "../util/getColorScale";
import { setGenotype } from "../util/setGenotype";
import { calcNodeColor } from "../components/tree/treeHelpers";
import { determineColorByGenotypeType } from "../util/colorHelpers";
import { timerStart, timerEnd } from "../util/perf";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import * as types from "./types";

export const calcColorScaleAndNodeColors = (colorBy, controls, tree, metadata) => {
  let genotype;
  if (colorBy.slice(0, 3) === "gt-" && controls.geneLength) {
    const x = parseEncodedGenotype(colorBy, controls.geneLength);
    if (x.length > 1) {
      console.warn("Cannot deal with multiple proteins yet - using first only.");
    }
    setGenotype(tree.nodes, x[0].prot, x[0].positions); /* modifies nodes recursively */
    genotype = parseEncodedGenotype(colorBy, controls.geneLength);
  }

  /* step 1: calculate the required colour scale */
  const version = controls.colorScale === undefined ? 1 : controls.colorScale.version + 1;
  const colorScale = getColorScale(colorBy, tree, controls.geneLength, metadata.colorOptions, version, controls.absoluteDateMaxNumeric);
  if (genotype) colorScale.genotype = genotype;

  /* step 2: calculate the node colours */
  const nodeColors = calcNodeColor(tree, colorScale);
  return {nodeColors, colorScale, version};
};

export const experimentalChangeColorBy = (gene, positions) => (dispatch, getState) => {
  const { controls, tree, metadata, frequencies } = getState();
  const colorBy = `gt-${gene}_${positions.join(',')}`;

  /* this is the function calcColorScaleAndNodeColors */
  setGenotype(tree.nodes, gene, positions); /* modifies nodes recursively */
  const genotype = positions.map((pos) => [gene, pos - 1]);

  console.log("experimentalChangeColorBy colorBy:", colorBy)

  /* step 1: calculate the required colour scale */
  const version = controls.colorScale === undefined ? 1 : controls.colorScale.version + 1;
  const colorScale = getColorScale(colorBy, tree, controls.geneLength, metadata.colorOptions, version, controls.absoluteDateMaxNumeric);
  if (genotype) colorScale.genotype = genotype;

  /* step 2: calculate the node colours */
  const nodeColors = calcNodeColor(tree, colorScale);

  /* step 4: dispatch */
  dispatch({
    type: types.NEW_COLORS,
    colorBy,
    colorScale,
    nodeColors,
    version,
    newMutType: false
  });
};

/* providedColorBy: undefined | string */
export const changeColorBy = (providedColorBy = undefined) => { // eslint-disable-line import/prefer-default-export
  return (dispatch, getState) => {
    timerStart("changeColorBy calculations");
    const { controls, tree, metadata, frequencies } = getState();
    console.log("NORMAL", controls.geneLength)


    /* bail if all required params aren't (yet) available! */
    if (!(tree.nodes !== null && metadata.loaded)) {
      /* note this *can* run before the tree is loaded - we only need the nodes */
      // console.log("updateColorScale not running due to load statuses of ", "tree nodes are null?", tree.nodes === null, "metadata", metadata.loaded);
      return null;
    }
    const colorBy = providedColorBy ? providedColorBy : controls.colorBy;
    const {nodeColors, colorScale, version} = calcColorScaleAndNodeColors(colorBy, controls, tree, metadata);

    /* step 3: change in mutType? */
    const newMutType = determineColorByGenotypeType(colorBy) !== controls.mutType ? determineColorByGenotypeType(colorBy) : false;
    timerEnd("changeColorBy calculations"); /* end timer before dispatch */
    if (newMutType) {
      updateEntropyVisibility(dispatch, getState);
    }
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
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
