import { connect } from "react-redux";
import UnconnectedTree from "./tree";

const Tree = connect((state) => ({
  tree: state.tree,
  treeToo: state.treeToo,
  quickdraw: state.controls.quickdraw,
  colorBy: state.controls.colorBy,
  colorByConfidence: state.controls.colorByConfidence,
  layout: state.controls.layout,
  temporalConfidence: state.controls.temporalConfidence,
  distanceMeasure: state.controls.distanceMeasure,
  mutType: state.controls.mutType,
  colorScale: state.controls.colorScale,
  metadata: state.metadata,
  showTreeToo: state.controls.showTreeToo,
  panelsToDisplay: state.controls.panelsToDisplay,
  selectedBranchLabel: state.controls.selectedBranchLabel
}))(UnconnectedTree);

export default Tree;
