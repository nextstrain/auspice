import { select } from "d3-selection";
import 'd3-transition';
import { calculateStrokeColors, getBrighterColor } from "../../../util/colorHelpers";
import { decodeMeasurementColorBy, isMeasurementColorBy } from "../../../actions/measurements";
import * as callbacks from "./callbacks";
import { makeTipLabelFunc } from "../phyloTree/labels";
import { PhyloTreeType } from "../phyloTree/types";
import { TreeComponent } from "../tree";
import { TreeComponentProps } from "../types";

export const renderTree = (
  that: TreeComponent,
  main: boolean,
  phylotree: PhyloTreeType,
  props: TreeComponentProps,
): void => {
  const ref = main ? that.domRefs.mainTree : that.domRefs.secondTree;
  const treeState = main ? props.tree : props.treeToo;
  if (!treeState.loaded) {
    console.warn("can't run renderTree (not loaded)");
    return;
  }
  // calculate if branch labels should be rendered
  let renderBranchLabels = props.canRenderBranchLabels;
  if (Object.prototype.hasOwnProperty.call(props.scatterVariables, "showBranches") && props.scatterVariables.showBranches===false) {
    renderBranchLabels=false;
  }
  const tipStrokeColors = calculateStrokeColors(treeState, false, props.colorByConfidence, props.colorBy);

  phylotree.render({
    svg: select(ref),
    layout: props.layout,
    distance: props.distanceMeasure,
    focus: props.focus,
    parameters: { /* modifies PhyloTree's defaults */
      grid: true,
      confidence: props.temporalConfidence.display,
      branchLabelKey: renderBranchLabels && props.selectedBranchLabel,
      showAllBranchLabels: props.showAllBranchLabels,
      orientation: main ? [1, 1] : [-1, 1],
      tipLabels: true,
      showTipLabels: true
    },
    callbacks: {
      onTipHover: callbacks.onTipHover.bind(that),
      onTipClick: callbacks.onTipClick.bind(that),
      onBranchHover: callbacks.onBranchHover.bind(that),
      onBranchClick: callbacks.onBranchClick.bind(that),
      onBranchLeave: callbacks.onBranchLeave.bind(that),
      onTipLeave: callbacks.onTipLeave.bind(that),
      tipLabel: makeTipLabelFunc(props.tipLabelKey)
    },
    branchThickness: treeState.branchThickness, /* guaranteed to be in redux by now */
    visibility: treeState.visibility,
    drawConfidence: props.temporalConfidence.on,
    vaccines: treeState.vaccines,
    branchStroke: calculateStrokeColors(treeState, true, props.colorByConfidence, props.colorBy),
    tipStroke: tipStrokeColors,
    tipFill: tipStrokeColors.map(getBrighterColor),
    tipRadii: treeState.tipRadii,
    dateRange: [props.dateMinNumeric, props.dateMaxNumeric],
    scatterVariables: props.scatterVariables,
    measurementsColorGrouping: isMeasurementColorBy(props.colorBy) ? decodeMeasurementColorBy(props.colorBy) : undefined,
  });
};
