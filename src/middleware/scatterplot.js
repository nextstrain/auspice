/**
 * This middleware adds scatterplot-related information to the NEW_COLORS action
 * when necessary. By overloading a single action, rather than dispatching twice,
 * we guarantee that only one call to PhyloTree's `change()` function is made
 * which avoids hard-to-debug rendering problems where d3 is out-of-sync with state
 */

import { NEW_COLORS } from "../actions/types";
import { isColorByGenotype, makeGenotypeLabel } from "../util/getGenotype";
import { addScatterAxisGivenColorScale, getFirstMatchingScatterVariable, collectAvailableScatterVariables, addScatterAxisInfo } from "../util/scatterplotHelpers";

export const keepScatterplotStateInSync = (store) => (next) => (action) => {
  if (action.type!==NEW_COLORS) return next(action);

  const { controls, metadata, tree } = store.getState(); // state before reaching reducers
  if (controls.layout!=="scatter" || !isColorByGenotype(controls.colorBy)) {
    return next(action);
  }

  const scatterVariables = {...controls.scatterVariables};
  let changed = false;

  /** we consider two cases where previous colorBy was genotype. Firstly,
   * if the genotype has changed, and the scatterplot was rendering the genotype
   * then we need to update the scatterplot variable (incl domain) to the new genotype.
   * (Without this the colours update appropriately, but not the node positions)
   */
  const genotypeLabel = makeGenotypeLabel(action.colorBy); // false if new colorBy is not a genotype
  if (genotypeLabel) {
    changed = true;
    if (scatterVariables.x==="gt") {
      scatterVariables.xLabel = genotypeLabel;
      addScatterAxisGivenColorScale(scatterVariables, action.colorScale, "x");
    }
    if (scatterVariables.y==="gt") {
      scatterVariables.yLabel = genotypeLabel;
      addScatterAxisGivenColorScale(scatterVariables, action.colorScale, "y");
    }
  }

  /** The second case occurs when the action is changing the colorBy from a genotype
   * to a non genotype, and a (or both) scatterplot axis was rendering genotype.
   * Here we need to move to a different scatterplot variable, and we default to the
   * new colorBy.
   */
  if (!genotypeLabel && (scatterVariables.x==="gt" || scatterVariables.y==="gt")) {
    changed=true;
    const availableOptions = collectAvailableScatterVariables(metadata.colorings, action.colorBy);
    if (scatterVariables.y==="gt") {
      const {value, label} = getFirstMatchingScatterVariable(availableOptions, [action.colorBy], scatterVariables.x);
      scatterVariables.y = value;
      scatterVariables.yLabel = label;
      addScatterAxisInfo(scatterVariables, "y", controls, tree, metadata);
    }
    if (scatterVariables.x==="gt") {
      const {value, label} = getFirstMatchingScatterVariable(availableOptions, [action.colorBy], scatterVariables.y);
      scatterVariables.x = value;
      scatterVariables.xLabel = label;
      addScatterAxisInfo(scatterVariables, "x", controls, tree, metadata);
    }
  }
  if (changed) return next({...action, scatterVariables});
  return next(action);
};
