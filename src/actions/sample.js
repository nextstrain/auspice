import { calcNodeColor } from "../util/colorHelpers";
import {RESAMPLE} from "./types";

/**
 * Currently this is changing the values behind the selected color-by.
 *
 * TODO: generalise to any trait
 * TODO: Frequencies need updating?
 * TODO: second tree
 */
export const sampleTraitFromUncertainty = ({trait, returnToOriginal=false}) => {
  console.log(`sampleTraitFromUncertainty trait=${trait} returnToOriginal=${returnToOriginal}`);
  return (dispatch, getState) => {
    const { controls, tree } = getState();

    tree.nodes.forEach((n) => {
      if (n.node_attrs[trait] && n.node_attrs[trait].confidence) {
        if (returnToOriginal) {
          if (!n.node_attrs[trait].originalValue) {
            console.error("Original state not saved...");
            return;
          }
          n.node_attrs[trait].value = n.node_attrs[trait].originalValue;
        } else {
          if (!n.node_attrs[trait].originalValue) {
            n.node_attrs[trait].originalValue = n.node_attrs[trait].value; // allows us to go back to original state
          }
          if (Array.isArray(n.node_attrs[trait].confidence)) {
            n.node_attrs[trait].value = sampleUniformlyBetweenBounds(n.node_attrs[trait].confidence);
          } else {
            n.node_attrs[trait].value = sampleFromDiscreteDistribution(n.node_attrs[trait].confidence);
          }
        }
      }
    });

    const colorBy = controls.colorBy;
    const dispatchObj = {type: RESAMPLE};

    if (trait === colorBy) {
      /* if the current color-by is the trait we're resampling, then we need to update the node colors */
      dispatchObj.nodeColors = calcNodeColor(tree, controls.colorScale);
      dispatchObj.nodeColorsVersion = tree.nodeColorsVersion+1;
    }
    dispatch(dispatchObj);
  };
};


function sampleFromDiscreteDistribution(confidenceObj) {
  /* based on the algorithm behind R's `sample` function */
  // to-do: if the probabilities don't sum to 1 the output will be biased towards the final value
  const values = Object.keys(confidenceObj);
  const probabilities = Object.values(confidenceObj);
  const n = values.length;
  const cumulativeProbs = new Array(n);
  cumulativeProbs[0] = probabilities[0];
  for (let i = 1; i<n; i++) {
    cumulativeProbs[i] = probabilities[i] + cumulativeProbs[i-1];
  }
  const rU = Math.random();
  let j;
  for (j=0; j<(n-1); j++) {
    if (rU <= cumulativeProbs[j]) break;
  }
  return values[j];
}

function sampleUniformlyBetweenBounds(bounds) {
  return bounds[0] + (bounds[1]-bounds[0])*Math.random();
}
