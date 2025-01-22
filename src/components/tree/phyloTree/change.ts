import { Selection } from "d3-selection";
import { Transition } from "d3-transition";
import { timerFlush } from "d3-timer";
import { calcConfidenceWidth } from "./confidence";
import { applyToChildren, setDisplayOrder } from "./helpers";
import { timerStart, timerEnd } from "../../../util/perf";
import { NODE_VISIBLE } from "../../../util/globals";
import { getBranchVisibility, strokeForBranch } from "./renderers";
import { shouldDisplayTemporalConfidence } from "../../../reducers/controls";
import { makeTipLabelFunc } from "./labels";
import { ChangeParams, PhyloNode, PhyloTreeType, PropsForPhyloNodes, SVGProperty, TreeElement } from "./types";

/* loop through the nodes and update each provided prop with the new value
 * additionally, set d.update -> whether or not the node props changed
 */
const updateNodesWithNewData = (
  nodes: PhyloNode[],
  newNodeProps: PropsForPhyloNodes,
): void => {
  // console.log("update nodes with data for these keys:", Object.keys(newNodeProps));
  // let tmp = 0;
  nodes.forEach((d, i) => {
    d.update = false;
    for (const key in newNodeProps) {
      const val = newNodeProps[key][i];
      if (val !== d[key]) {
        d[key] = val;
        d.update = true;
        // tmp++;
      }
    }
  });
  // console.log("marking ", tmp, " nodes for update");
};


/* svgSetters defines how attrs & styles should be applied to which class (e.g. ".tip").
 * E.g. which node attribute should be used?!?
 * Note that only the relevant functions are called on a transition.
 */
const svgSetters = {
  attrs: {
    ".tip": {
      r: (d: PhyloNode) => d.r,
      cx: (d: PhyloNode) => d.xTip,
      cy: (d: PhyloNode) => d.yTip
    },
    ".branch": {
    },
    ".vaccineCross": {
      d: (d: PhyloNode) => d.vaccineCross
    },
    ".conf": {
      d: (d: PhyloNode) => d.confLine
    }
  },
  styles: {
    ".tip": {
      fill: (d: PhyloNode) => d.fill,
      stroke: (d: PhyloNode) => d.tipStroke,
      visibility: (d: PhyloNode) => d.visibility === NODE_VISIBLE ? "visible" : "hidden"
    },
    ".conf": {
      stroke: (d: PhyloNode) => d.branchStroke,
      "stroke-width": calcConfidenceWidth
    },
    // only allow stroke to be set on individual branches
    ".branch": {
      "stroke-width": (d: PhyloNode) => d["stroke-width"] + "px", // style - as per drawBranches()
      stroke: (d: PhyloNode) => strokeForBranch(d), // TODO: revisit if we bring back SVG gradients
      cursor: (d: PhyloNode) => d.visibility === NODE_VISIBLE ? "pointer" : "default",
      visibility: getBranchVisibility
    }
  }
};


type UpdateCall = (selection: Transition<SVGGElement, PhyloNode, SVGGElement | null, unknown>) => void;


/** createUpdateCall
 * returns a function which can be called as part of a D3 chain in order to modify
 * the SVG elements.
 * svgSetters (see above) are used to actually modify the property on the element,
 * so the given property must also be present there!
 */
function createUpdateCall(
  treeElem: TreeElement,

  /** e.g. ["visibility", "stroke-width"] */
  properties: Set<SVGProperty>,
): UpdateCall {
  return (selection) => {
    // First: the properties to update via d3Selection.attr call
    if (svgSetters.attrs[treeElem]) {
      [...properties].filter((x) => svgSetters.attrs[treeElem][x])
        .forEach((attrName) => {
          // console.log(`applying attr ${attrName} to ${treeElem}`)
          selection.attr(attrName, svgSetters.attrs[treeElem][attrName]);
        });
    }
    // Second: the properties to update via d3Selection.style call
    if (svgSetters.styles[treeElem]) {
      [...properties].filter((x) => svgSetters.styles[treeElem][x])
        .forEach((styleName) => {
          // console.log(`applying style ${styleName} to ${treeElem}`)
          selection.style(styleName, svgSetters.styles[treeElem][styleName]);
        });
    }
  };
}

const genericSelectAndModify = (
  svg: Selection<SVGGElement | null, unknown, null, unknown>,
  treeElem: TreeElement,
  updateCall: UpdateCall,
  transitionTime: number,
): void => {
  // console.log("general svg update for", treeElem);

  svg.selectAll<SVGGElement, PhyloNode>(treeElem)
    .filter((d) => d.update)
    .transition().duration(transitionTime)
    .call(updateCall);
  if (!transitionTime) {
    timerFlush();
  }

};

/* use D3 to select and modify elements, such that a given element is only ever modified _once_
 * @elemsToUpdate {set} - the class names to select, e.g. ".tip" or ".branch"
 * @svgPropsToUpdate {set} - the props (styles & attrs) to update. The respective functions are defined above
 * @transitionTime {INT} - in ms. if 0 then no transition (timerFlush is used)
 * @extras {dict} - extra keywords to tell this function to call certain phyloTree update methods. In flux.
 */
export const modifySVG = function modifySVG(
  this: PhyloTreeType,
  elemsToUpdate: Set<TreeElement>,
  svgPropsToUpdate: Set<SVGProperty>,
  transitionTime: number,
  extras: Extras,
): void {
  let updateCall: UpdateCall;
  const classesToPotentiallyUpdate: TreeElement[] = [".tip", ".vaccineDottedLine", ".vaccineCross", ".branch"]; /* order is respected */
  /* treat stem / branch specially, but use these to replace a normal .branch call if that's also to be applied */
  if (elemsToUpdate.has(".branch.S") || elemsToUpdate.has(".branch.T")) {
    const applyBranchPropsAlso = elemsToUpdate.has(".branch");
    if (applyBranchPropsAlso) classesToPotentiallyUpdate.splice(classesToPotentiallyUpdate.indexOf(".branch"), 1);
    const ST: Array<".S" | ".T"> = [".S", ".T"];
    ST.forEach((x, STidx) => {
      if (elemsToUpdate.has(`.branch${x}`)) {
        if (applyBranchPropsAlso) {
          updateCall = (selection) => {
            createUpdateCall(".branch", svgPropsToUpdate)(selection); /* the "normal" branch changes to apply */
            selection.attr("d", (d) => d.branch[STidx]); /* change the path (differs between .S and .T) */
          };
        } else {
          updateCall = (selection) => {
            selection.attr("d", (d) => d.branch[STidx]);
          };
        }

        genericSelectAndModify(this.svg, `.branch${x}`, updateCall, transitionTime);
      }
    });
  }

  classesToPotentiallyUpdate.forEach((el) => {
    if (elemsToUpdate.has(el)) {
      updateCall = createUpdateCall(el, svgPropsToUpdate);
      genericSelectAndModify(this.svg, el, updateCall, transitionTime);
    }
  });

  /* special cases not listed in classesToPotentiallyUpdate */
  if (extras.hideTipLabels) {
    this.removeTipLabels();
  } else if (elemsToUpdate.has('.tipLabel')) {
    this.updateTipLabels();
  }
  if (elemsToUpdate.has('.grid')) {
    if (this.grid && this.layout !== "unrooted") this.addGrid();
    else this.hideGrid();
  }
  if (elemsToUpdate.has('.regression')) {
    this.removeRegression();
    if (this.regression) this.drawRegression();
  }

  /* confidence intervals */
  if (extras.removeConfidences && this.confidencesInSVG) {
    this.removeConfidence(); /* do not use a transition time - it's too clunky (too many elements?) */
  } else if (extras.showConfidences && !this.confidencesInSVG) {
    this.drawConfidence(); /* see comment above */
  } else if (elemsToUpdate.has(".conf") && this.confidencesInSVG) {
    if (shouldDisplayTemporalConfidence(true, this.distance, this.layout)) {
      updateCall = createUpdateCall(".conf", svgPropsToUpdate);
      genericSelectAndModify(this.svg, ".conf", updateCall, transitionTime);
    } else {
      this.removeConfidence(); /* see comment above */
    }
  }

  /* background temporal time slice */
  if (extras.timeSliceHasPotentiallyChanged) {
    this.showTemporalSlice();
  }

  /* branch labels */
  if (extras.newBranchLabellingKey) {
    this.removeBranchLabels();
    if (extras.newBranchLabellingKey !== "none") {
      this.drawBranchLabels(extras.newBranchLabellingKey);
    }
  } else if (elemsToUpdate.has('.branchLabel')) {
    this.updateBranchLabels(transitionTime);
  }

  if (this.measurementsColorGrouping) {
    this.drawMeasurementsColoringCrosshair();
  } else {
    this.removeMeasurementsColoringCrosshair();
  }
};

/* instead of modifying the SVG the "normal" way, this is sometimes too janky (e.g. when we need to move everything)
 * step 1: fade out & remove everything except tips.
 * step 2: when step 1 has finished, move tips across the screen.
 * step 3: when step 2 has finished, redraw everything. No transition here.
 */
export const modifySVGInStages = function modifySVGInStages(
  this: PhyloTreeType,
  elemsToUpdate: Set<TreeElement>,
  svgPropsToUpdate: Set<SVGProperty>,
  transitionTimeFadeOut: number,
  transitionTimeMoveTips: number,
  extras: Extras,
): void {
  elemsToUpdate.delete(".tip");
  this.hideGrid();
  let inProgress = 0; /* counter of transitions currently in progress */

  const step3 = () => {
    this.drawBranches();
    if (this.params.showGrid) this.addGrid();
    this.svg.selectAll(".tip").remove();
    this.updateTipLabels();
    this.drawTips();
    if (this.vaccines) this.drawVaccines();
    if (this.measurementsColorGrouping) {
      this.drawMeasurementsColoringCrosshair();
    }
    this.showTemporalSlice();
    if (this.regression) this.drawRegression();
    if (elemsToUpdate.has(".branchLabel")) this.drawBranchLabels(extras.newBranchLabellingKey || this.params.branchLabelKey);
  };

  /* STEP 2: move tips */
  const step2 = () => {
    if (!--inProgress) { /* decrement counter. When hits 0 run block */
      this.setClipMask();
      const updateTips = createUpdateCall(".tip", svgPropsToUpdate);
      genericSelectAndModify(this.svg, ".tip", updateTips, transitionTimeMoveTips);
      setTimeout(step3, transitionTimeMoveTips);
    }
  };

  /* STEP 1. remove everything (via opacity) */
  this.confidencesInSVG = false;
  this.svg.selectAll([...elemsToUpdate].join(", "))
    .transition().duration(transitionTimeFadeOut)
    .style("opacity", 0)
    .remove()
    .on("start", () => inProgress++)
    .on("end", step2);
  this.hideTemporalSlice();
  this.removeMeasurementsColoringCrosshair();
  if (!transitionTimeFadeOut) timerFlush();
};


interface Extras {
  removeConfidences: boolean
  showConfidences: boolean
  newBranchLabellingKey?: string

  timeSliceHasPotentiallyChanged?: boolean
  hideTipLabels?: boolean
}


/* the main interface to changing a currently rendered tree.
 * simply call change and tell it what should be changed.
 * try to do a single change() call with as many things as possible in it
 */
export const change = function change(
  this: PhyloTreeType,
  {
    changeColorBy = false,
    changeVisibility = false,
    changeTipRadii = false,
    changeBranchThickness = false,
    showConfidences = false,
    removeConfidences = false,
    zoomIntoClade = false,
    svgHasChangedDimensions = false,
    animationInProgress = false,
    changeNodeOrder = false,
    focus = false,
    newDistance = undefined,
    newLayout = undefined,
    updateLayout = undefined,
    newBranchLabellingKey = undefined,
    showAllBranchLabels = undefined,
    newTipLabelKey = undefined,
    branchStroke = undefined,
    tipStroke = undefined,
    fill = undefined,
    visibility = undefined,
    tipRadii = undefined,
    branchThickness = undefined,
    scatterVariables = undefined,
    performanceFlags = undefined,
    newMeasurementsColorGrouping = undefined,
  }: ChangeParams
): void {
  // console.log("\n** phylotree.change() (time since last run:", Date.now() - this.timeLastRenderRequested, "ms) **\n\n");
  timerStart("phylotree.change()");
  const elemsToUpdate = new Set<TreeElement>(); /* what needs updating? E.g. ".branch", ".tip" etc */
  const nodePropsToModify: PropsForPhyloNodes = {}; /* which properties (keys) on the nodes should be updated (before the SVG) */
  const svgPropsToUpdate = new Set<SVGProperty>(); /* which SVG properties shall be changed. E.g. "fill", "stroke" */
  const useModifySVGInStages = newLayout; /* use modifySVGInStages rather than modifySVG. Not used often. */


  /* calculate dt */
  const idealTransitionTime = 500;
  let transitionTime = idealTransitionTime;
  if ((Date.now() - this.timeLastRenderRequested) < idealTransitionTime * 2 || performanceFlags.get("skipTreeAnimation")===true) {
    transitionTime = 0;
  }

  /* the logic of converting what react is telling us to change
  and what SVG elements, node properties, svg props we actually change */
  if (changeColorBy) {
    /* check that fill & stroke are defined */
    elemsToUpdate.add(".branch").add(".tip").add(".conf");
    svgPropsToUpdate.add("stroke").add("fill");
    nodePropsToModify.branchStroke = branchStroke;
    nodePropsToModify.tipStroke = tipStroke;
    nodePropsToModify.fill = fill;
  }
  if (changeVisibility) {
    /* check that visibility is not undefined */
    /* in the future we also change the branch visibility (after skeleton merge) */
    elemsToUpdate.add(".tip").add(".tipLabel").add(".branchLabel");
    svgPropsToUpdate.add("visibility").add("cursor");
    nodePropsToModify.visibility = visibility;
  }
  if (changeTipRadii) {
    elemsToUpdate.add(".tip");
    svgPropsToUpdate.add("r");
    nodePropsToModify.r = tipRadii;
  }
  if (changeBranchThickness) {
    elemsToUpdate.add(".branch").add(".conf");
    svgPropsToUpdate.add("stroke-width");
    nodePropsToModify["stroke-width"] = branchThickness;
  }
  if (newDistance || newLayout || updateLayout || zoomIntoClade || svgHasChangedDimensions || changeNodeOrder) {
    elemsToUpdate.add(".tip").add(".branch.S").add(".branch.T").add(".branch");
    elemsToUpdate.add(".vaccineCross").add(".vaccineDottedLine").add(".conf");
    elemsToUpdate.add('.branchLabel').add('.tipLabel');
    elemsToUpdate.add(".grid").add(".regression");
    svgPropsToUpdate.add("cx").add("cy").add("d").add("opacity")
      .add("visibility");
  }

  if (changeNodeOrder) {
    setDisplayOrder({nodes: this.nodes, focus});
    this.setDistance();
  }

  /* change the requested properties on the nodes */
  updateNodesWithNewData(this.nodes, nodePropsToModify);

  // recalculate gradients here?
  if (changeColorBy) {
    this.updateColorBy();
    this.measurementsColorGrouping = newMeasurementsColorGrouping;
  }
  // recalculate existing regression if needed
  if (changeVisibility && this.regression) {
    elemsToUpdate.add(".regression");
    this.calculateRegression(); // Note: must come after `updateNodesWithNewData()`
  }
  /* some things need to update d.inView and/or d.update. This should be centralised */
  /* TODO: list all functions which modify these */
  if (zoomIntoClade) { /* must happen below updateNodesWithNewData */
    this.nodes.forEach((d) => {
      d.inView = false;
      d.update = true;
    });
    /* if clade is terminal, use the parent as the zoom node */
    this.zoomNode = zoomIntoClade.n.hasChildren ?
      zoomIntoClade :
      zoomIntoClade.n.parent.shell;
    applyToChildren(this.zoomNode, (d: PhyloNode) => {d.inView = true;});
  }
  if (svgHasChangedDimensions || changeNodeOrder) {
    this.nodes.forEach((d) => {d.update = true;});
  }

  /* run calculations as needed - these update properties on the phylotreeNodes (similar to updateNodesWithNewData) */
  /* distance */
  if (newDistance || updateLayout) this.setDistance(newDistance);
  /* focus */
  if (updateLayout) setDisplayOrder({nodes: this.nodes, focus});
  /* layout (must run after distance and focus) */
  if (newDistance || newLayout || updateLayout || changeNodeOrder) {
    this.setLayout(newLayout || this.layout, scatterVariables);
  }
  /* show confidences - set this param which actually adds the svg paths for
     confidence intervals when mapToScreen() gets called below */
  if (showConfidences) this.params.confidence = true;
  /* keep the state of phylotree in sync with redux (more complex than it should be) */
  if (showAllBranchLabels!==undefined) {
    this.params.showAllBranchLabels=showAllBranchLabels;
    elemsToUpdate.add('.branchLabel');
  }
  /* mapToScreen */
  if (
    svgPropsToUpdate.has("stroke-width") ||
    newDistance ||
    newLayout ||
    changeNodeOrder ||
    updateLayout ||
    zoomIntoClade ||
    svgHasChangedDimensions ||
    showConfidences
  ) {
    this.mapToScreen();
  }
  /* tip label key change -> update callback used */
  if (newTipLabelKey) {
    this.callbacks.tipLabel = makeTipLabelFunc(newTipLabelKey);
    elemsToUpdate.add('.tipLabel'); /* will trigger d3 commands as required */
  }

  const extras: Extras = { removeConfidences, showConfidences, newBranchLabellingKey };
  extras.timeSliceHasPotentiallyChanged = changeVisibility || newDistance !== undefined;
  extras.hideTipLabels = animationInProgress || newTipLabelKey === 'none';
  if (useModifySVGInStages) {
    this.modifySVGInStages(elemsToUpdate, svgPropsToUpdate, transitionTime, 1000, extras);
  } else {
    this.modifySVG(elemsToUpdate, svgPropsToUpdate, transitionTime, extras);
  }
  this.timeLastRenderRequested = Date.now();
  timerEnd("phylotree.change()");
};
