import { rgb } from "d3-color";
import { calcBranchStrokeCols } from "../../../util/colorHelpers";

export const changePhyloTreeViaPropsComparison = (mainTree, phylotree, viewer, oldProps, newProps) => {
  const args = {};
  const newState = {};
  /* do not use oldProps.tree or newTreeRedux */
  const oldTreeRedux = mainTree ? oldProps.tree : oldProps.treeToo;
  const newTreeRedux = mainTree ? newProps.tree : newProps.treeToo;

  /* catch selectedStrain dissapearence seperately to visibility and remove modal */
  if (oldTreeRedux.selectedStrain && !newTreeRedux.selectedStrain) {
    /* TODO change back the tip radius */
    newState.selectedTip = null;
    newState.hovered = null;
  }

  /* colorBy change? */
  if (!!newTreeRedux.nodeColorsVersion &&
      (oldTreeRedux.nodeColorsVersion !== newTreeRedux.nodeColorsVersion ||
      newProps.colorByConfidence !== oldProps.colorByConfidence)) {
    args.changeColorBy = true;
    args.branchStroke = calcBranchStrokeCols(newTreeRedux, newProps.colorByConfidence, newProps.colorBy);
    args.tipStroke = newTreeRedux.nodeColors;
    args.fill = newTreeRedux.nodeColors.map((col) => rgb(col).brighter([0.65]).toString());
  }

  /* visibility */
  if (!!newTreeRedux.visibilityVersion && oldTreeRedux.visibilityVersion !== newTreeRedux.visibilityVersion) {
    args.changeVisibility = true;
    args.visibility = newTreeRedux.visibility;
  }

  /* tip radii */
  if (!!newTreeRedux.tipRadiiVersion && oldTreeRedux.tipRadiiVersion !== newTreeRedux.tipRadiiVersion) {
    args.changeTipRadii = true;
    args.tipRadii = newTreeRedux.tipRadii;
  }

  /* branch thickness (stroke-width) */
  if (oldTreeRedux.branchThicknessVersion !== newTreeRedux.branchThicknessVersion) {
    args.changeBranchThickness = true;
    args.branchThickness = newTreeRedux.branchThickness;
  }

  /* change from timetree to divergence tree */
  if (oldProps.distanceMeasure !== newProps.distanceMeasure) {
    args.newDistance = newProps.distanceMeasure;
  }

  /* change in key used to define branch labels (e.g. aa, clade...) */
  if (oldProps.selectedBranchLabel !== newProps.selectedBranchLabel) {
    args.newBranchLabellingKey = newProps.selectedBranchLabel;
  }


  /* confidence intervals (on means in the SVG, display means shown in the sidebar) */
  if (oldProps.temporalConfidence.display === true && newProps.temporalConfidence.display === false) {
    args.removeConfidences = true;
  } else if (oldProps.temporalConfidence.on === true && newProps.temporalConfidence.on === false) {
    args.removeConfidences = true;
  } else if (newProps.temporalConfidence.display === true && oldProps.temporalConfidence.on === false && newProps.temporalConfidence.on === true) {
    args.showConfidences = true;
  }

  if (oldProps.layout !== newProps.layout) {
    args.newLayout = newProps.layout;
  }

  /* zoom to a clade / reset zoom to entire tree */
  if (oldTreeRedux.idxOfInViewRootNode !== newTreeRedux.idxOfInViewRootNode) {
    const rootNode = phylotree.nodes[newTreeRedux.idxOfInViewRootNode];
    args.zoomIntoClade = rootNode;
    viewer.fitToViewer();
    newState.selectedBranch = newTreeRedux.idxOfInViewRootNode === 0 ? null : rootNode;
    newState.selectedTip = null;
    newState.hovered = null;
  }

  if (oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
    args.svgHasChangedDimensions = true;
  }

  if (Object.keys(args).length) {
    // console.log('\n\n** ', phylotree.debugId, 'changePhyloTreeViaPropsComparison **', args);
    phylotree.change(args);
  }
  return Object.keys(newState).length ? newState : false;
};
