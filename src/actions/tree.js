import { calcTipRadii } from "../util/tipRadiusHelpers";
import { strainNameToIdx, calculateVisiblityAndBranchThickness } from "../util/treeVisibilityHelpers";
import * as types from "./types";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import { calendarToNumeric } from "../util/dateHelpers";
import { applyToChildren } from "../components/tree/phyloTree/helpers";
import { constructVisibleTipLookupBetweenTrees } from "../util/treeTangleHelpers";


const applyInViewNodesToTree = (idx, tree) => {
  const validIdxRoot = idx !== undefined ? idx : tree.idxOfInViewRootNode;
  if (idx !== tree.idxOfInViewRootNode && tree.nodes[0].shell) {
    /* a bit hacky, should be somewhere else */
    tree.nodes.forEach((d) => {
      d.shell.inView = false;
      d.shell.update = true;
    });
    if (tree.nodes[validIdxRoot].shell.terminal) {
      applyToChildren(tree.nodes[validIdxRoot].shell.parent, (d) => {d.inView = true;});
    } else {
      applyToChildren(tree.nodes[validIdxRoot].shell, (d) => {d.inView = true;});
    }
  }
  return validIdxRoot;
};

const processSelectedTip = (d, tree, treeToo) => {
  if (!d) {
    return [undefined, undefined, undefined];
  }
  if (d.clear) {
    return [undefined, undefined, undefined];
  }
  if (d.treeIdx) {
    const name = tree.nodes[d.treeIdx].strain;
    const idx2 = treeToo ? strainNameToIdx(treeToo.nodes, name) : undefined;
    return [d.treeIdx, idx2, name];
  }
  if (d.treeTooIdx) {
    const name = treeToo.nodes[d.treeTooIdx].strain;
    const idx1 = strainNameToIdx(tree.nodes, name);
    return [idx1, d.treeTooIdx, name];
  }
  if (tree.selectedStrain) {
    const idx1 = strainNameToIdx(tree.nodes, tree.selectedStrain);
    const idx2 = treeToo ? strainNameToIdx(treeToo.nodes, tree.selectedStrain) : undefined;
    return [idx1, idx2, tree.selectedStrain];
  }
  return [undefined, undefined, undefined];
};

/**
 * define the visible branches and their thicknesses. This could be a path to a single tip or a selected clade.
 * filtering etc will "turn off" branches, etc etc
 * this fn relies on the "inView" attr of nodes
 * note that this function checks to see if the tree has been defined (different to if it's ready / loaded!)
 * for arg destructuring see https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6/
 * @param  {array|undefined} root Change the in-view part of the tree. [root idx tree1, root idx tree2].
 *                                [0, 0]: reset. [undefined, undefined]: do nothing
 * @param  {object} tipSelected
 * @param  {int} idxOfInViewRootNodeTreeToo
= * @return {null} side effects: a single action
 */
export const updateVisibleTipsAndBranchThicknesses = (
  {root = [undefined, undefined], tipSelected = undefined} = {}
) => {
  return (dispatch, getState) => {
    const { tree, treeToo, controls, frequencies } = getState();
    if (!tree.nodes) {return;}
    // console.log("ROOT SETTING TO", root)
    /* mark nodes as "in view" as applicable */
    const rootIdxTree1 = applyInViewNodesToTree(root[0], tree);
    const [tipIdx1, tipIdx2, tipName] = processSelectedTip(tipSelected, tree, controls.showTreeToo ? treeToo : undefined);

    const data = calculateVisiblityAndBranchThickness(
      tree,
      controls,
      {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric},
      {tipSelectedIdx: tipIdx1, validIdxRoot: rootIdxTree1}
    );
    const dispatchObj = {
      type: types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion,
      idxOfInViewRootNode: rootIdxTree1,
      stateCountAttrs: Object.keys(controls.filters),
      selectedStrain: tipName
    };

    if (controls.showTreeToo) {
      const rootIdxTree2 = applyInViewNodesToTree(root[1], treeToo);
      const dataToo = calculateVisiblityAndBranchThickness(
        treeToo,
        controls,
        {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric},
        {tipSelectedIdx: tipIdx2, validIdxRoot: rootIdxTree2}
      );
      dispatchObj.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, data.visibility, dataToo.visibility);
      dispatchObj.visibilityToo = dataToo.visibility;
      dispatchObj.visibilityVersionToo = dataToo.visibilityVersion;
      dispatchObj.branchThicknessToo = dataToo.branchThickness;
      dispatchObj.branchThicknessVersionToo = dataToo.branchThicknessVersion;
      dispatchObj.idxOfInViewRootNodeToo = rootIdxTree2;
      /* tip selected is the same as the first tree - the reducer uses that */
    }
    /* D I S P A T C H */
    dispatch(dispatchObj);
    updateEntropyVisibility(dispatch, getState);
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }
  };
};

/**
 * date changes need to update tip visibility & branch thicknesses
 * this can be done in a single action
 * NB calling this without specifing newMin OR newMax is a no-op
 * @param  {string|false} newMin optional
 * @param  {string|false} newMax optional
 * @return {null} side-effects: a single action
 */
export const changeDateFilter = ({newMin = false, newMax = false, quickdraw = false}) => {
  return (dispatch, getState) => {
    const { tree, treeToo, controls, frequencies } = getState();
    if (!tree.nodes) {return;}
    const dates = {
      dateMinNumeric: newMin ? calendarToNumeric(newMin) : controls.dateMinNumeric,
      dateMaxNumeric: newMax ? calendarToNumeric(newMax) : controls.dateMaxNumeric
    };
    const data = calculateVisiblityAndBranchThickness(tree, controls, dates);
    const dispatchObj = {
      type: types.CHANGE_DATES_VISIBILITY_THICKNESS,
      quickdraw,
      dateMin: newMin ? newMin : controls.dateMin,
      dateMax: newMax ? newMax : controls.dateMax,
      dateMinNumeric: dates.dateMinNumeric,
      dateMaxNumeric: dates.dateMaxNumeric,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion,
      idxOfInViewRootNode: tree.idxOfInViewRootNode,
      stateCountAttrs: Object.keys(controls.filters)
    };
    if (controls.showTreeToo) {
      const dataToo = calculateVisiblityAndBranchThickness(treeToo, controls, dates);
      dispatchObj.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, data.visibility, dataToo.visibility);
      dispatchObj.visibilityToo = dataToo.visibility;
      dispatchObj.visibilityVersionToo = dataToo.visibilityVersion;
      dispatchObj.branchThicknessToo = dataToo.branchThickness;
      dispatchObj.branchThicknessVersionToo = dataToo.branchThicknessVersion;
    }

    /* D I S P A T C H */
    dispatch(dispatchObj);
    updateEntropyVisibility(dispatch, getState);
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }
  };
};

// export const changeAnalysisSliderValue = (value) => {
//   return (dispatch) => {
//     dispatch({type: types.CHANGE_ANALYSIS_VALUE, value});
//     dispatch(updateVisibleTipsAndBranchThicknesses());
//   };
// };

/**
 * NB all params are optional - supplying none resets the tip radii to defaults
 * @param  {string|number} selectedLegendItem value of the attr. if scale is continuous a bound will be used.
 * @param  {int} tipSelectedIdx the strain to highlight (always tree 1)
 * @return {null} side-effects: a single action
 */
export const updateTipRadii = (
  {tipSelectedIdx = false, selectedLegendItem = false} = {}
) => {
  return (dispatch, getState) => {
    const { controls, tree, treeToo } = getState();
    const colorScale = controls.colorScale;
    const d = {
      type: types.UPDATE_TIP_RADII, version: tree.tipRadiiVersion + 1
    };
    const tt = controls.showTreeToo;
    if (tipSelectedIdx) {
      d.data = calcTipRadii({tipSelectedIdx, colorScale, tree});
      if (tt) {
        const idx = strainNameToIdx(treeToo.nodes, tree.nodes[tipSelectedIdx].strain);
        d.dataToo = calcTipRadii({idx, colorScale, tree: treeToo});
      }
    } else if (selectedLegendItem !== false) {
      d.data = calcTipRadii({selectedLegendItem, colorScale, tree});
      if (tt) d.dataToo = calcTipRadii({selectedLegendItem, colorScale, tree: treeToo});
    } else {
      d.data = calcTipRadii({colorScale, tree});
      if (tt) d.dataToo = calcTipRadii({colorScale, tree: treeToo});
    }
    dispatch(d);
  };
};

export const applyFilter = (fields, values, mode = "set") => {
  /* fields: e.g. region || country || authors
  values: list of selected values, e.g [brazil, usa, ...]
  mode: set | add | remove
    set: sets the filter values to those provided
    add: adds the values to the current selection
    remove: vice versa
  */
  return (dispatch, getState) => {
    let newValues;
    if (mode === "set") {
      newValues = values;
    } else {
      const { controls } = getState();
      const currentFields = Object.keys(controls.filters);
      if (mode === "add") {
        if (currentFields.indexOf(fields) === -1) {
          newValues = values;
        } else {
          newValues = controls.filters[fields].concat(values);
        }
      } else if (mode === "remove") {
        if (currentFields.indexOf(fields) === -1) {
          console.error("trying to remove values from an un-initialised filter!");
          return;
        }
        newValues = controls.filters[fields].slice();
        for (const item of values) {
          const idx = newValues.indexOf(item);
          if (idx !== -1) {
            newValues.splice(idx, 1);
          } else {
            console.error("trying to remove filter value ", item, " which was not part of the filter selection");
          }
        }
      }
    }
    dispatch({type: types.APPLY_FILTER, fields, values: newValues});
    dispatch(updateVisibleTipsAndBranchThicknesses());
  };
};

export const toggleTemporalConfidence = () => ({
  type: types.TOGGLE_TEMPORAL_CONF
});
