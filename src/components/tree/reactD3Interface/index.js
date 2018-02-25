import { rgb } from "d3-color";
import { calcStrokeCols } from "../treeHelpers";

export const changePhyloTreeViaPropsComparison = (reactThis, nextProps) => {
  const args = {};
  const props = reactThis.props;
  const phylotree = reactThis.state.tree;

  /* colorBy change? */
  if (!!nextProps.tree.nodeColorsVersion &&
      (props.tree.nodeColorsVersion !== nextProps.tree.nodeColorsVersion ||
      nextProps.colorByConfidence !== props.colorByConfidence)) {
    args.changeColorBy = true;
    args.stroke = calcStrokeCols(nextProps.tree, nextProps.colorByConfidence, nextProps.colorBy);
    args.fill = nextProps.tree.nodeColors.map((col) => rgb(col).brighter([0.65]).toString());
  }

  /* visibility */
  if (!!nextProps.tree.visibilityVersion && props.tree.visibilityVersion !== nextProps.tree.visibilityVersion) {
    args.changeVisibility = true;
    args.visibility = nextProps.tree.visibility;
  }

  /* tip radii */
  if (!!nextProps.tree.tipRadiiVersion && props.tree.tipRadiiVersion !== nextProps.tree.tipRadiiVersion) {
    args.changeTipRadii = true;
    args.tipRadii = nextProps.tree.tipRadii;
  }

  /* branch thickness (stroke-width) */
  if (props.tree.branchThicknessVersion !== nextProps.tree.branchThicknessVersion) {
    args.changeBranchThickness = true;
    args.branchThickness = nextProps.tree.branchThickness;
  }

  /* change from timetree to divergence tree */
  if (props.distanceMeasure !== nextProps.distanceMeasure) {
    args.newDistance = nextProps.distanceMeasure;
  }

  /* change in cladeLabellingKey */
  if (props.selectedBranchLabel !== nextProps.selectedBranchLabel) {
    args.newBranchLabellingKey = nextProps.selectedBranchLabel;
  }


  /* confidence intervals (on means in the SVG, display means shown in the sidebar) */
  if (props.temporalConfidence.display === true && nextProps.temporalConfidence.display === false) {
    args.removeConfidences = true;
  } else if (props.temporalConfidence.on === true && nextProps.temporalConfidence.on === false) {
    args.removeConfidences = true;
  } else if (nextProps.temporalConfidence.display === true && props.temporalConfidence.on === false && nextProps.temporalConfidence.on === true) {
    args.showConfidences = true;
  }

  if (props.layout !== nextProps.layout) {
    args.newLayout = nextProps.layout;
  }

  /* zoom to a clade / reset zoom to entire tree */
  if (props.tree.idxOfInViewRootNode !== nextProps.tree.idxOfInViewRootNode) {
    const rootNode = phylotree.nodes[nextProps.tree.idxOfInViewRootNode];
    args.zoomIntoClade = rootNode;
    reactThis.Viewer.fitToViewer();
    reactThis.setState({
      selectedBranch: nextProps.tree.idxOfInViewRootNode === 0 ? null : rootNode,
      selectedTip: null,
      hovered: null
    });
  }

  if (Object.keys(args).length) {
    // console.log('\n\n** changePhyloTreeViaPropsComparison **', args);
    phylotree.change(args);
  }

};
