import { CHANGE_LAYOUT } from "./types";
import { validateScatterVariables, addScatterAxisInfo} from "../util/scatterplotHelpers";

/**
 * Redux Thunk to change a layout, including aspects of the scatterplot / clock layouts.
 */
export const changeLayout = ({layout, showBranches, showRegression, x, xLabel, y, yLabel}) => {
  return (dispatch, getState) => {
    if (window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference) return;
    const { controls, tree, metadata } = getState();

    if (layout==="rect" || layout==="unrooted" || layout==="radial") {
      dispatch({type: CHANGE_LAYOUT, layout, scatterVariables: controls.scatterVariables, canRenderBranchLabels: true});
      return;
    }

    let scatterVariables = (layout==="clock" || layout==="scatter") ?
      validateScatterVariables(controls, metadata, tree, layout==="clock") : // occurs when switching to this layout
      controls.scatterVariables;

    if (x && xLabel) scatterVariables = {...scatterVariables, ...addScatterAxisInfo({x, xLabel}, "x", controls, tree, metadata)};
    if (y && yLabel) scatterVariables = {...scatterVariables, ...addScatterAxisInfo({y, yLabel}, "y", controls, tree, metadata)};
    if (showBranches!==undefined) scatterVariables.showBranches = showBranches;
    if (showRegression!==undefined) scatterVariables.showRegression = showRegression;
    if (layout==="scatter" && (!scatterVariables.xContinuous || !scatterVariables.yContinuous)) {
      scatterVariables.showRegression= false;
    }

    dispatch({
      type: CHANGE_LAYOUT,
      layout: layout || controls.layout,
      scatterVariables: {...scatterVariables}, // ensures redux is aware of change
      canRenderBranchLabels: scatterVariables.showBranches
    });

  };
};
