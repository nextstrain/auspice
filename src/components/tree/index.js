import { connect } from "react-redux";
import UnconnectedTree from "./tree";

export const Tree = connect((state) => ({
  tree: state.tree,
  quickdraw: state.controls.quickdraw,
  colorBy: state.controls.colorBy,
  colorByConfidence: state.controls.colorByConfidence,
  layout: state.controls.layout,
  temporalConfidence: state.controls.temporalConfidence,
  distanceMeasure: state.controls.distanceMeasure,
  mutType: state.controls.mutType,
  colorScale: state.controls.colorScale,
  metadata: state.metadata,
  panelLayout: state.controls.panelLayout,
  selectedBranchLabel: state.controls.selectedBranchLabel
}))(UnconnectedTree);

export const TreeToo = connect((state) => ({
  tree: state.treeToo,
  quickdraw: state.controls.quickdraw,
  colorBy: state.controls.colorBy,
  colorByConfidence: state.controls.colorByConfidence,
  layout: state.controls.layout,
  temporalConfidence: state.controls.temporalConfidence,
  distanceMeasure: state.controls.distanceMeasure,
  mutType: state.controls.mutType,
  colorScale: state.controls.colorScale,
  metadata: state.metadata,
  panelLayout: state.controls.panelLayout,
  selectedBranchLabel: state.controls.selectedBranchLabel
}))(UnconnectedTree);
