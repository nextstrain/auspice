/*eslint max-len: 0*/
import { calcVisibility,
   calcTipRadii,
   calcTipCounts,
   identifyPathToTip,
   calcBranchThickness } from "../util/treeHelpers";
import { determineColorByGenotypeType } from "../util/urlHelpers";
import { changeColorBy } from "./colors";
import * as types from "./types";

const calculateVisiblityAndBranchThickness = (tree, controls, dates, {idxOfInViewRootNode = 0, tipSelectedIdx = 0} = {}) => {
  const visibility = tipSelectedIdx ? identifyPathToTip(tree.nodes, tipSelectedIdx) : calcVisibility(tree, controls, dates);
  /* recalculate tipCounts over the tree - modifies redux tree nodes in place (yeah, I know) */
  calcTipCounts(tree.nodes[0], visibility);
  /* re-calculate branchThickness (inline)*/
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
export const updateVisibleTipsAndBranchThicknesses = function (
  {idxOfInViewRootNode = 0, tipSelectedIdx = 0} = {}) {
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    if (!tree.nodes) {return;}
    const data = calculateVisiblityAndBranchThickness(tree, controls, {dateMin: controls.dateMin, dateMax: controls.dateMax}, {tipSelectedIdx, idxOfInViewRootNode});
    dispatch({
      type: types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion
    });
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
export const changeDateFilter = function ({newMin = false, newMax = false}) {
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    if (!tree.nodes) {return;}
    const dates = {
      dateMin: newMin ? newMin : controls.dateMin,
      dateMax: newMax ? newMax : controls.dateMax
    };
    const data = calculateVisiblityAndBranchThickness(tree, controls, dates);
    dispatch({
      type: types.CHANGE_DATES_VISIBILITY_THICKNESS,
      dateMin: newMin ? newMin : controls.dateMin,
      dateMax: newMax ? newMax : controls.dateMax,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion
    });
  };
};

export const changeAnalysisSliderValue = function (value) {
  return (dispatch) => {
    dispatch({type: types.CHANGE_ANALYSIS_VALUE, value});
    dispatch(updateVisibleTipsAndBranchThicknesses());
  };
};

const updateTipRadii = () => {
  return (dispatch, getState) => {
    const { controls, sequences, tree } = getState();
    dispatch({
      type: types.UPDATE_TIP_RADII,
      data: calcTipRadii(controls.selectedLegendItem, controls.colorScale, sequences, tree),
      version: tree.tipRadiiVersion + 1
    });
  };
};

/* when the selected legend item changes
(a) update the controls reducer with the new value
(b)change the tipRadii
*/
export const legendMouseEnterExit = function (label = null) {
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

export const applyFilterQuery = (filterType, fields, values) => {
  /* filterType: e.g. authers || geographic location
  fields: e.g. region || country || authors
  values: list of selected values, e.g [brazil, usa, ...]
  */
  return (dispatch) => {
    dispatch({type: types.APPLY_FILTER_QUERY,
              // filterType,
              fields,
              values});
    dispatch(updateVisibleTipsAndBranchThicknesses());
  };
};

export const changeMutType = (data) => {
  return (dispatch, getState) => {
    const { controls } = getState();
    const g = determineColorByGenotypeType(controls.colorBy); /* returns "nuc", "aa" of false */
    if (g && g !== data) {
      dispatch(changeColorBy(controls.defaultColorBy));
    }
    dispatch({type: types.TOGGLE_MUT_TYPE, data});
  };
};

export const toggleTemporalConfidence = () => ({
  type: types.TOGGLE_TEMPORAL_CONF
});
