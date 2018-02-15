import { rgb } from "d3-color";
import { mediumTransitionDuration } from "../../../util/globals";
import { calcStrokeCols } from "../treeHelpers";
import { viewEntireTree } from "./callbacks";
/**
 * function to help determine what parts of phylotree should update
 * @param {obj} props redux props
 * @param {obj} nextProps next redux props
 * @param {obj} tree phyloTree object (stored in the state of the Tree component)
 * @return {obj} values are mostly bools, but not always
 */
export const salientPropChanges = (props, nextProps, tree) => {
  const dataInFlux = !nextProps.tree.loaded;
  const newData = tree === null && nextProps.tree.loaded;
  // const visibility = !!nextProps.tree.visibilityVersion && props.tree.visibilityVersion !== nextProps.tree.visibilityVersion;
  // const tipRadii = !!nextProps.tree.tipRadiiVersion && props.tree.tipRadiiVersion !== nextProps.tree.tipRadiiVersion;
  // const colorBy = !!nextProps.tree.nodeColorsVersion &&
  //     (props.tree.nodeColorsVersion !== nextProps.tree.nodeColorsVersion ||
  //     nextProps.colorByConfidence !== props.colorByConfidence);
  // const branchThickness = props.tree.branchThicknessVersion !== nextProps.tree.branchThicknessVersion;
  const layout = props.layout !== nextProps.layout;
  const distanceMeasure = props.distanceMeasure !== nextProps.distanceMeasure;
  const rerenderAllElements = nextProps.quickdraw === false && props.quickdraw === true;
  const resetViewToRoot = props.tree.idxOfInViewRootNode !== 0 && nextProps.tree.idxOfInViewRootNode === 0;
  /* branch labels & confidence use 0: no change, 1: turn off, 2: turn on */
  const branchLabels = props.showBranchLabels === nextProps.showBranchLabels ? 0 : nextProps.showBranchLabels ? 2 : 1;
  const confidence = props.temporalConfidence.on === nextProps.temporalConfidence.on && props.temporalConfidence.display === nextProps.temporalConfidence.display ? 0 :
    (props.temporalConfidence.on === false && nextProps.temporalConfidence.on === false) ? 0 :
      (nextProps.temporalConfidence.display === false || nextProps.temporalConfidence.on === false) ? 1 :
        (nextProps.temporalConfidence.display === true && nextProps.temporalConfidence.on === true) ? 2 : 0;

  /* sometimes we may want smooth transitions */
  let branchTransitionTime = false; /* false = no transition. Use when speed is critical */
  const tipTransitionTime = false;
  if (nextProps.colorByConfidence !== props.colorByConfidence) {
    branchTransitionTime = mediumTransitionDuration;
  }

  return {
    dataInFlux,
    newData,
    visibility: false,
    tipRadii: false,
    colorBy: false,
    layout,
    distanceMeasure,
    branchThickness: false,
    branchTransitionTime,
    tipTransitionTime,
    branchLabels,
    resetViewToRoot,
    confidence,
    quickdraw: nextProps.quickdraw,
    rerenderAllElements
  };
};

export const changePhyloTreeViaPropsComparison = (props, nextProps, tree) => {
  console.log('changePhyloTreeViaPropsComparison')
  const args = {};

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

  tree.change(args);
};

/**
 * effect (in phyloTree) the necessary style + attr updates
 * @param {obj} changes see salientPropChanges above
 * @param {obj} nextProps next redux props
 * @param {obj} tree phyloTree object
 * @return {null} causes side-effects via phyloTree object
 */
export const updateStylesAndAttrs = (that, changes, nextProps, tree) => {
  /* the objects storing the changes to make to the tree */
  // const tipAttrToUpdate = {};
  // const tipStyleToUpdate = {};
  // const branchAttrToUpdate = {};
  // const branchStyleToUpdate = {};

  // if (changes.visibility) {
  //   tipStyleToUpdate["visibility"] = nextProps.tree.visibility;
  // }
  // if (changes.tipRadii) {
  //   tipAttrToUpdate["r"] = nextProps.tree.tipRadii;
  // }
  // if (changes.colorBy) {
  //   tipStyleToUpdate["fill"] = nextProps.tree.nodeColors.map((col) => {
  //     return rgb(col).brighter([0.65]).toString();
  //   });
  //   const branchStrokes = calcStrokeCols(nextProps.tree, nextProps.colorByConfidence, nextProps.colorBy);
  //   branchStyleToUpdate["stroke"] = branchStrokes;
  //   tipStyleToUpdate["stroke"] = branchStrokes;
  // }
  // if (changes.branchThickness) {
  //   // console.log("branch width change detected - update branch stroke-widths")
  //   branchStyleToUpdate["stroke-width"] = nextProps.tree.branchThickness;
  // }
  /* implement style * attr changes */
  // if (Object.keys(branchAttrToUpdate).length || Object.keys(branchStyleToUpdate).length) {
  //   // console.log("applying branch attr", Object.keys(branchAttrToUpdate), "branch style changes", Object.keys(branchStyleToUpdate))
  //   tree.updateMultipleArray(".branch", branchAttrToUpdate, branchStyleToUpdate, changes.branchTransitionTime, changes.quickdraw);
  // }
  // if (Object.keys(tipAttrToUpdate).length || Object.keys(tipStyleToUpdate).length) {
  //   // console.log("applying tip attr", Object.keys(tipAttrToUpdate), "tip style changes", Object.keys(tipStyleToUpdate))
  //   tree.updateMultipleArray(".tip", tipAttrToUpdate, tipStyleToUpdate, changes.tipTransitionTime, changes.quickdraw);
  // }

  if (changes.layout) { /* swap layouts */
    tree.updateLayout(nextProps.layout, mediumTransitionDuration);
  }
  if (changes.distanceMeasure) { /* change distance metrics */
    tree.updateDistance(nextProps.distanceMeasure, mediumTransitionDuration);
  }
  if (changes.branchLabels === 2) {
    tree.showBranchLabels();
  } else if (changes.branchLabels === 1) {
    tree.hideBranchLabels();
  }
  if (changes.confidence === 1) {
    tree.removeConfidence(mediumTransitionDuration);
  } else if (changes.confidence === 2) {
    if (changes.layout) { /* setTimeout else they come back in before the branches have transitioned */
      setTimeout(() => tree.drawConfidence(mediumTransitionDuration), mediumTransitionDuration * 1.5);
    } else {
      tree.drawConfidence(mediumTransitionDuration);
    }
  } else if (nextProps.temporalConfidence.on && (changes.branchThickness || changes.colorBy)) {
    /* some updates may necessitate an updating of the CIs (e.g. ∆ branch thicknesses) */
    tree.updateConfidence(changes.tipTransitionTime);
  }
  if (changes.resetViewToRoot) {
    viewEntireTree.bind(that)();
  }
  if (changes.rerenderAllElements) {
    tree.rerenderAllElements();
  }
};
