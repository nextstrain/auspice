import { calcVisibility,
  calcTipRadii,
  calcTipCounts,
  identifyPathToTip,
  calcBranchThickness } from "../components/tree/treeHelpers";
import * as types from "./types";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import { calendarToNumeric } from "../util/dateHelpers";
import { applyToChildren } from "../components/tree/phyloTree/helpers";

export const calculateVisiblityAndBranchThickness = (tree, controls, dates, {idxOfInViewRootNode = 0, tipSelectedIdx = 0} = {}) => {
  const visibility = tipSelectedIdx ? identifyPathToTip(tree.nodes, tipSelectedIdx) : calcVisibility(tree, controls, dates);
  /* recalculate tipCounts over the tree - modifies redux tree nodes in place (yeah, I know) */
  calcTipCounts(tree.nodes[0], visibility);
  /* re-calculate branchThickness (inline) */
  return {
    visibility: visibility,
    visibilityVersion: tree.visibilityVersion + 1,
    branchThickness: calcBranchThickness(tree.nodes, visibility, idxOfInViewRootNode),
    branchThicknessVersion: tree.branchThicknessVersion + 1
  };
};

/**
 * define the visible branches and their thicknesses. This could be a path to a single tip or a selected clade.
 * filtering etc will "turn off" branches, etc etc
 * this fn relies on the "inView" attr of nodes
 * note that this function checks to see if the tree has been defined (different to if it's ready / loaded!)
 * for arg destructuring see https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6/
 * @param  {int} idxOfInViewRootNode If clade selected then start visibility at this index. (root = 0)
 * @param  {int} tipSelectedIdx idx of the selected tip. If not 0 will highlight path to this tip.
 * @return {null} side effects: a single action
 */
export const updateVisibleTipsAndBranchThicknesses = (
  {idxOfInViewRootNode = undefined, tipSelectedIdx = 0} = {}
) => {
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    if (!tree.nodes) {return;}
    const validIdxRoot = idxOfInViewRootNode !== undefined ? idxOfInViewRootNode : tree.idxOfInViewRootNode;
    if (idxOfInViewRootNode !== tree.idxOfInViewRootNode && tree.nodes[0].shell) {
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
    const data = calculateVisiblityAndBranchThickness(tree, controls, {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric}, {tipSelectedIdx, validIdxRoot});
    dispatch({
      type: types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion,
      idxOfInViewRootNode: validIdxRoot,
      stateCountAttrs: Object.keys(controls.filters)
    });
    updateEntropyVisibility(dispatch, getState);
    updateFrequencyDataDebounced(dispatch, getState);
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
    const { tree, controls } = getState();
    if (!tree.nodes) {return;}
    const dates = {
      dateMinNumeric: newMin ? calendarToNumeric(newMin): controls.dateMinNumeric,
      dateMaxNumeric: newMax ? calendarToNumeric(newMax): controls.dateMaxNumeric
    };
    const data = calculateVisiblityAndBranchThickness(tree, controls, dates);
    dispatch({
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
    });
    updateEntropyVisibility(dispatch, getState);
    updateFrequencyDataDebounced(dispatch, getState);
  };
};

export const changeAnalysisSliderValue = (value) => {
  return (dispatch) => {
    dispatch({type: types.CHANGE_ANALYSIS_VALUE, value});
    dispatch(updateVisibleTipsAndBranchThicknesses());
  };
};

const updateTipRadii = () => {
  return (dispatch, getState) => {
    const { controls, tree } = getState();
    dispatch({
      type: types.UPDATE_TIP_RADII,
      data: calcTipRadii(controls.selectedLegendItem, controls.colorScale, tree),
      version: tree.tipRadiiVersion + 1
    });
  };
};

/* when the selected legend item changes
(a) update the controls reducer with the new value
(b)change the tipRadii
*/
export const legendMouseEnterExit = (label = null) => {
  return (dispatch) => {
    if (label) {
      dispatch({type: types.LEGEND_ITEM_MOUSEENTER,
                data: label});
    } else {
      dispatch({type: types.LEGEND_ITEM_MOUSELEAVE});
    }
    dispatch(updateTipRadii());
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
