import { connect } from "react-redux";
import UnconnectedTree from "./tree";

const Tree = connect((state) => ({
  tree: state.tree,
  treeToo: state.treeToo,
  selectedNode: state.controls.selectedNode,
  dateMinNumeric: state.controls.dateMinNumeric,
  dateMaxNumeric: state.controls.dateMaxNumeric,
  quickdraw: state.controls.quickdraw,
  colorBy: state.controls.colorBy,
  colorByConfidence: state.controls.colorByConfidence,
  layout: state.controls.layout,
  scatterVariables: state.controls.scatterVariables,
  temporalConfidence: state.controls.temporalConfidence,
  distanceMeasure: state.controls.distanceMeasure,
  explodeAttr: state.controls.explodeAttr,
  colorScale: state.controls.colorScale,
  colorings: state.metadata.colorings,
  genomeMap: state.entropy.genomeMap,
  showTreeToo: state.controls.showTreeToo,
  showTangle: state.controls.showTangle,
  panelsToDisplay: state.controls.panelsToDisplay,
  selectedBranchLabel: state.controls.selectedBranchLabel,
  canRenderBranchLabels: state.controls.canRenderBranchLabels,
  showAllBranchLabels: state.controls.showAllBranchLabels,
  tipLabelKey: state.controls.tipLabelKey,
  narrativeMode: state.narrative.display,
  animationPlayPauseButton: state.controls.animationPlayPauseButton,
  showOnlyPanels: state.controls.showOnlyPanels
}))(UnconnectedTree);

export default Tree;
