import { decodeMeasurementColorBy, isMeasurementColorBy } from "../../../actions/measurements";
import { calculateStrokeColors, getBrighterColor } from "../../../util/colorHelpers";
import { ChangeParams, PhyloTreeType } from "../phyloTree/types";
import { TreeComponentProps, TreeComponentState } from "../types";

export const changePhyloTreeViaPropsComparison = (
  mainTree: boolean,
  phylotree: PhyloTreeType,
  oldProps: TreeComponentProps,
  newProps: TreeComponentProps,
): {
  newState: Partial<TreeComponentState> | false
  change: boolean
} => {
  const args: ChangeParams = {};
  const newState: Partial<TreeComponentState> = {};
  /* do not use oldProps.tree or newTreeRedux */
  const oldTreeRedux = mainTree ? oldProps.tree : oldProps.treeToo;
  const newTreeRedux = mainTree ? newProps.tree : newProps.treeToo;

  /* zoom to a clade / reset zoom to entire tree */
  const zoomChange = oldTreeRedux.idxOfInViewRootNode !== newTreeRedux.idxOfInViewRootNode;

  const dateRangeChange = oldProps.dateMinNumeric !== newProps.dateMinNumeric ||
                          oldProps.dateMaxNumeric !== newProps.dateMaxNumeric;

  const filterChange = oldProps.filters !== newProps.filters;

  /* do any properties on the tree object need to be updated?
  Note that updating properties itself won't trigger any visual changes */
  phylotree.dateRange = [newProps.dateMinNumeric, newProps.dateMaxNumeric];

  /* colorBy change? */
  if (!!newTreeRedux.nodeColorsVersion &&
      (oldTreeRedux.nodeColorsVersion !== newTreeRedux.nodeColorsVersion ||
      newProps.colorByConfidence !== oldProps.colorByConfidence)) {
    args.changeColorBy = true;
    args.branchStroke = calculateStrokeColors(newTreeRedux, true, newProps.colorByConfidence, newProps.colorBy);
    args.tipStroke = calculateStrokeColors(newTreeRedux, false, newProps.colorByConfidence, newProps.colorBy);
    args.fill = args.tipStroke.map(getBrighterColor);
    args.newMeasurementsColorGrouping = isMeasurementColorBy(newProps.colorBy) ? decodeMeasurementColorBy(newProps.colorBy) : undefined;
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

  /* explode! */
  if (oldProps.explodeAttr !== newProps.explodeAttr) {
    args.changeNodeOrder = true;
    args.focus = newProps.focus;
  }

  /* enable/disable focus */
  if (oldProps.focus !== newProps.focus) {
    args.focus = newProps.focus;
    args.updateLayout = true;
  }
  /* re-focus on changes */
  else if (oldProps.focus === true &&
           newProps.focus === true &&
           (zoomChange || dateRangeChange || filterChange)) {
    args.focus = true;
    args.updateLayout = true;
  }

  /* change in key used to define branch labels, tip labels */
  if (oldProps.canRenderBranchLabels===true && newProps.canRenderBranchLabels===false) {
    args.newBranchLabellingKey = "none";
  } else if (
    (oldProps.canRenderBranchLabels===false && newProps.canRenderBranchLabels===true) ||
    (oldProps.selectedBranchLabel !== newProps.selectedBranchLabel) ||
    (oldProps.scatterVariables.showBranches===false && newProps.scatterVariables.showBranches===true)
  ) {
    args.newBranchLabellingKey = newProps.selectedBranchLabel;
  }
  if (oldProps.showAllBranchLabels!==newProps.showAllBranchLabels) {
    args.showAllBranchLabels = newProps.showAllBranchLabels;
  }

  if (oldProps.tipLabelKey !== newProps.tipLabelKey) {
    args.newTipLabelKey = newProps.tipLabelKey;
  }

  /* show / remove confidence intervals across the tree */
  if (
    (oldProps.temporalConfidence.display === true && newProps.temporalConfidence.display === false) ||
    (oldProps.temporalConfidence.on === true && newProps.temporalConfidence.on === false)
  ) {
    args.removeConfidences = true;
  } else if (newProps.temporalConfidence.display === true && oldProps.temporalConfidence.on === false && newProps.temporalConfidence.on === true) {
    args.showConfidences = true;
  }

  if ((newProps.layout==="scatter" || newProps.layout==="clock") && (oldProps.scatterVariables!==newProps.scatterVariables)) {
    args.updateLayout = true;
    args.scatterVariables = newProps.scatterVariables;
  }
  if (oldProps.layout !== newProps.layout) {
    args.newLayout = newProps.layout;
  }


  if (zoomChange) {
    const rootNode = phylotree.nodes[newTreeRedux.idxOfInViewRootNode];
    args.zoomIntoClade = rootNode;
    if (newProps.layout === "unrooted") {
      args.updateLayout = true;
    }
  }

  if (oldProps.width !== newProps.width || oldProps.height !== newProps.height) {
    args.svgHasChangedDimensions = true;
  }
  if (mainTree && oldProps.showTreeToo !== newProps.showTreeToo) {
    args.svgHasChangedDimensions = true;
  }

  const change = Object.keys(args).length > 0;
  if (change) {
    args.animationInProgress = newProps.animationPlayPauseButton === "Pause";
    args.performanceFlags = newProps.performanceFlags;
    // console.log('\n\n** ', phylotree.id, 'changePhyloTreeViaPropsComparison **', args);
    phylotree.change(args);
  }
  return {
    newState: Object.keys(newState).length ? newState : false,
    change,
  };
};
