import { calcTipVisibility,
	 calcTipRadii,
	 calcTipCounts,
	 calcBranchThickness } from "../util/treeHelpers";
import * as types from "./types";

const updateTipVisibility = () => {
  return (dispatch, getState) => {
    const { tree, controls } = getState();
    dispatch({
      type: types.UPDATE_TIP_VISIBILITY,
      data: calcTipVisibility(tree, controls),
      version: tree.tipVisibilityVersion + 1
    });
  };
};

/* this must be called AFTER tipVisibility is updated */
const updateBranchThickness = (idxOfInViewRootNode = 0) => {
  return (dispatch, getState) => {
    const { tree } = getState();
    if (tree.nodes) {
      /* step 1: recalculate tipCounts over the tree
      note that the tips (actually the nodes) already have
      d["tip-visible"] set (from calcTipVisibility) */
      calcTipCounts(tree.nodes[0]);
      /* step 2: re-calculate branchThickness & dispatch*/
      dispatch({
				type: types.UPDATE_BRANCH_THICKNESS,
				data: calcBranchThickness(tree.nodes, idxOfInViewRootNode),
				version: tree.branchThicknessVersion + 1
      });
    }
  };
};

export const restrictTreeToSingleTip = function (restrict, tipIdx = undefined) {
	return (dispatch, getState) => {
		const { tree, controls } = getState();
		if (restrict === 1) {
			// console.log("restrict")
			const vis = tree.nodes.map((d, idx) => {
				d["tip-visible"] = idx === tipIdx ? 1 : 0;
				return idx === tipIdx ? "visible" : "hidden";
			});
			dispatch({
				type: types.UPDATE_TIP_VISIBILITY,
				data: vis,
				version: tree.tipVisibilityVersion + 1
			});
			dispatch(updateBranchThickness());
		} else {
			// console.log("return")
			dispatch({
				type: types.UPDATE_TIP_VISIBILITY,
				data: calcTipVisibility(tree, controls),
				version: tree.tipVisibilityVersion + 1
			});
			dispatch(updateBranchThickness());
		}
	}
}


/* when tip max / min changes, we need to (a) update the controls reducer
with the new value(s), (b) update the tree tipVisibility */
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
		if (tree.loadStatus === 2) {
			dispatch(updateTipVisibility());
			dispatch(updateBranchThickness());
		}
  };
};

/* zoomToClade takes care of setting tipVis and branchThickness.
Note that the zooming / tree stuff is done imperitively by phyloTree */
export const zoomToClade = function (idxOfInViewRootNode) {
	return (dispatch) => {
		dispatch(updateTipVisibility());
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
    dispatch(updateTipVisibility());
    dispatch(updateBranchThickness());
  };
};
