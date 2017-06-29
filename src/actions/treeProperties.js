import { calcVisibility,
   calcTipRadii,
   calcTipCounts,
   makeParentVisible,
   calcBranchThickness } from "../util/treeHelpers";
import { determineColorByGenotypeType } from "../util/urlHelpers";
import { changeColorBy } from "./colors";
import * as types from "./types";
import { defaultColorBy } from "../util/globals";

const updateVisibility = () => {
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    dispatch({
      type: types.UPDATE_TIP_VISIBILITY,
      data: calcVisibility(tree, controls),
      version: tree.visibilityVersion + 1
    });
  };
};

/* this must be called AFTER Visibility is updated */
const updateBranchThickness = (idxOfInViewRootNode = 0) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.nodes) {
      /* step 1: recalculate tipCounts over the tree */
      calcTipCounts(tree.nodes[0], tree.visibility);
      /* step 2: re-calculate branchThickness & dispatch*/
      dispatch({
        type: types.UPDATE_BRANCH_THICKNESS,
        data: calcBranchThickness(tree.nodes, tree.visibility, idxOfInViewRootNode),
        version: tree.branchThicknessVersion + 1
      });
    }
  };
};

export const restrictTreeToSingleTip = function (tipIdx) {
  /* this fn causes things to fall out of sync with the "inView" attr of nodes
  you should run updateVisibleTipsAndBranchThicknesses to get things back in sync */
  return (dispatch, getState) => {
    const { tree } = getState();
    /* make the tip and all the parents down to the root visibile */
    const visibility = new Array(tree.nodes.length);
    visibility.fill(false);
    visibility[tipIdx] = true;
    makeParentVisible(visibility, tree.nodes[tipIdx]);
    dispatch({
      type: types.UPDATE_TIP_VISIBILITY,
      data: visibility.map((cv) => cv ? "visible" : "hidden"),
      version: tree.visibilityVersion + 1
    });
    dispatch(updateBranchThickness());
  };
};

export const updateVisibleTipsAndBranchThicknesses = function () {
  /* this fn doesn't need arguments as it relies on the "inView" attr of nodes */
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    dispatch({
      type: types.UPDATE_TIP_VISIBILITY,
      data: calcVisibility(tree, controls),
      version: tree.visibilityVersion + 1
    });
    dispatch(updateBranchThickness());
  };
};

/* when tip max / min changes, we need to (a) update the controls reducer
with the new value(s), (b) update the tree visibility */
export const changeDateFilter = function (newMin, newMax) {
  return (dispatch, getState) => {
  // console.log("changeDateFilter", newMin, newMax)
    const { tree } = getState();
    if (newMin) {
      dispatch({type: types.CHANGE_DATE_MIN, data: newMin});
    }
    if (newMax) {
      dispatch({type: types.CHANGE_DATE_MAX, data: newMax});
    }
    /* initially, the tree isn't loaded, so don't bother trying to do things */
    if (tree.loaded) {
      dispatch(updateVisibility());
      dispatch(updateBranchThickness());
    }
  };
};

export const changeAnalysisSliderValue = function (value) {
  return (dispatch, getState) => {
    const { tree } = getState();
    dispatch({type: types.CHANGE_ANALYSIS_VALUE, value});
    /* initially, the tree isn't loaded, so don't bother trying to do things */
    if (tree.loaded) {
      dispatch(updateVisibility());
      dispatch(updateBranchThickness());
    }
  };
};

/* zoomToClade takes care of setting tipVis and branchThickness.
Note that the zooming / tree stuff is done imperitively by phyloTree */
export const zoomToClade = function (idxOfInViewRootNode) {
  return (dispatch) => {
    dispatch(updateVisibility());
    dispatch(updateBranchThickness(idxOfInViewRootNode));
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
    dispatch(updateVisibility());
    dispatch(updateBranchThickness());
  };
};

export const changeMutType = (data) => {
  return (dispatch, getState) => {
    const { controls } = getState();
    const g = determineColorByGenotypeType(controls.colorBy);
    if (g && g !== data) {
      dispatch(changeColorBy(defaultColorBy));
    }
    dispatch({type: types.TOGGLE_MUT_TYPE, data});
  };
};

export const toggleTemporalConfidence = () => ({
  type: types.TOGGLE_TEMPORAL_CONF
});
