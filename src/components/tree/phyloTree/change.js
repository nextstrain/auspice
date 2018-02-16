import { timerFlush } from "d3-timer";
import { calcConfidenceWidth } from "./confidence";
import { applyToChildren } from "./helpers";

const updateNodesWithNewData = (nodes, newNodeProps) => {
  console.log("update nodes with data for these keys:", Object.keys(newNodeProps));
  let tmp = 0;
  nodes.forEach((d, i) => {
    d.update = false;
    for (let key in newNodeProps) { // eslint-disable-line
      const val = newNodeProps[key][i];
      if (val !== d[key]) {
        d[key] = val;
        d.update = true;
        tmp++;
      }
    }
  });
  console.log("marking ", tmp, " nodes for update");
};

const genericAttrs = {
  ".branch": new Set(),
  ".tip": new Set(["r"])
};
const genericStyles = {
  ".branch": new Set(["stroke", "stroke-width"]),
  ".tip": new Set(["fill", "visibility", "stroke"])
};
const functionAttrs = {
  ".tip": {
    cx: (d) => d.xTip,
    cy: (d) => d.yTip
  },
  ".vaccineCross": {
    d: (d) => d.vaccineCross
  },
  ".vaccineDottedLine": {
    d: (d) => d.vaccineLine
  },
  ".conf": {
    d: (d) => d.confLine
  }
};
const functionStyles = {
  ".vaccineDottedLine": {
    opacity: (d) => d.that.distance === "num_date" ? 1 : 0
  },
  ".conf": {
    stroke: (d) => d.stroke,
    "stroke-width": calcConfidenceWidth
  }
};

/* Returns a function which can be called as part of a D3 chain in order to modify
 * the appropriate attrs & styles for this treeElem
 */
const createUpdateCall = (treeElem, properties) => (selection) => {
  /* generics - those which are simply taken from the node! */
  if (genericAttrs[treeElem]) {
    [...properties].filter((x) => genericAttrs[treeElem].has(x))
      .forEach((attrName) => {
        console.log("\tadding node attr", attrName);
        selection.attr(attrName, (d) => d[attrName]);
      });
  }
  if (genericStyles[treeElem]) {
    [...properties].filter((x) => genericStyles[treeElem].has(x))
      .forEach((styleName) => {
        console.log("\tadding node style", styleName);
        selection.style(styleName, (d) => d[styleName]);
      });
  }
  /* more complicated, functions defined above */
  if (functionAttrs[treeElem]) {
    [...properties].filter((x) => functionAttrs[treeElem][x])
      .forEach((attrName) => {
        console.log("\tadding fn for attr", attrName);
        selection.attr(attrName, functionAttrs[treeElem][attrName]);
      });
  }
  if (functionStyles[treeElem]) {
    [...properties].filter((x) => functionStyles[treeElem][x])
      .forEach((styleName) => {
        console.log("\tadding fn for style ", styleName);
        selection.attr(styleName, functionStyles[treeElem][styleName]);
      });
  }

};

const genericSelectAndModify = (svg, treeElem, updateCall, transitionTime) => {
  console.log("general svg update for", treeElem);
  svg.selectAll(treeElem)
    .filter((d) => d.update)
    .transition().duration(transitionTime)
    .call(updateCall);
  if (!transitionTime) {
    /* https://github.com/d3/d3-timer#timerFlush */
    timerFlush();
    console.log("\t\t--FLUSHING TIMER--");
  }
};

export const modifySVG = function modifySVG(elemsToUpdate, svgPropsToUpdate, transitionTime, extras) {
  /* elements are often treated differently (of course!) */
  let updateCall;

  /* order is respected */
  const generals = [".tip", ".vaccineDottedLine", ".vaccineCross", ".branch"];

  /* treat stem / branch different, but combine normal .branch calls */
  if (elemsToUpdate.has(".branch.S") || elemsToUpdate.has(".branch.T")) {
    let branchOnlyUpdate = false;
    if (elemsToUpdate.has(".branch")) {
      generals.splice(generals.indexOf(".branch"), 1); // remove .branch from generals
      branchOnlyUpdate = createUpdateCall(".branch", svgPropsToUpdate);
    }
    const generateCombinedUpdateCall = (subClass) => (selection) => {
      if (branchOnlyUpdate) {
        branchOnlyUpdate(selection);
      }
      const subClassIdx = subClass === ".S" ? 0 : 1; /* is the path stored at d.branch[0] or d.branch[1] */
      selection.attr("d", (d) => d.branch[subClassIdx]);
    };
    if (elemsToUpdate.has(".branch.S")) {
      updateCall = generateCombinedUpdateCall(".S");
      genericSelectAndModify(this.svg, ".branch.S", updateCall, transitionTime);
    }
    if (elemsToUpdate.has(".branch.T")) {
      updateCall = generateCombinedUpdateCall(".T");
      genericSelectAndModify(this.svg, ".branch.T", updateCall, transitionTime);
    }
  }

  generals.forEach((el) => {
    if (elemsToUpdate.has(el)) {
      updateCall = createUpdateCall(el, svgPropsToUpdate);
      genericSelectAndModify(this.svg, el, updateCall, transitionTime);
    }
  });

  /* non general */
  if (elemsToUpdate.has('.branchLabel')) {
    this.updateBranchLabels();
  }
  if (elemsToUpdate.has('.tipLabel')) {
    this.updateTipLabels();
  }
  if (elemsToUpdate.has('.grid')) {
    if (this.grid && this.layout !== "unrooted") this.addGrid(this.layout);
    else this.hideGrid();
  }
  if (elemsToUpdate.has('.regression')) {
    this.svg.selectAll(".regression").remove();
    if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
  }

  /* confidences are hard */
  if (extras.removeConfidences) {
    this.removeConfidence(transitionTime);
  } else if (extras.showConfidences) {
    this.drawConfidence(transitionTime);
  } else if (elemsToUpdate.has(".conf") && this.confidencesInSVG) {
    if (this.layout === "rect" && this.distance === "num_date") {
      updateCall = createUpdateCall(".conf", svgPropsToUpdate);
      genericSelectAndModify(this.svg, ".conf", updateCall, transitionTime);
    } else {
      this.removeConfidence(transitionTime);
    }
  }
};

/* the main interface to changing a currently rendered tree.
 * simply call change and tell it what should be changed.
 * try to do a single change() call with as many things as possible in it
 */
export const change = function change({
  /* booleans for what should be changed */
  changeColorBy = false,
  changeVisibility = false,
  changeTipRadii = false,
  changeBranchThickness = false,
  showConfidences = false,
  removeConfidences = false,
  zoomIntoClade = false,
  /* change these things to provided value */
  newDistance = undefined,
  newLayout = undefined,
  /* arrays of data (the same length as nodes) */
  stroke = undefined,
  fill = undefined,
  visibility = undefined,
  tipRadii = undefined,
  branchThickness = undefined
}) {
  console.log("\n** change **\n\n");

  const elemsToUpdate = new Set();
  const nodePropsToModify = {}; /* modify the actual data structure */
  const svgPropsToUpdate = new Set(); /* modify the SVG */

  /* calculate dt */
  const idealTransitionTime = 500;
  let transitionTime = idealTransitionTime;
  if ((Date.now() - this.timeLastRenderRequested) < idealTransitionTime * 2) {
    transitionTime = 0;
  }

  /* the logic of converting what react is telling us to change
  and what SVG elements, node properties, svg props we actually change */
  if (changeColorBy) {
    /* check that fill & stroke are defined */
    elemsToUpdate.add(".branch").add(".tip").add(".conf");
    svgPropsToUpdate.add("stroke").add("fill");
    nodePropsToModify.stroke = stroke;
    nodePropsToModify.fill = fill;
  }
  if (changeVisibility) {
    /* check that visibility is not undefined */
    /* in the future we also change the branch visibility (after skeleton merge) */
    elemsToUpdate.add(".tip");
    svgPropsToUpdate.add("visibility");
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
  if (newDistance || newLayout || zoomIntoClade) {
    elemsToUpdate.add(".tip").add(".branch.S").add(".branch.T");
    elemsToUpdate.add(".vaccineCross").add(".vaccineDottedLine").add(".conf");
    elemsToUpdate.add('.branchLabel').add('.tipLabel');
    elemsToUpdate.add(".grid").add(".regression");
    svgPropsToUpdate.add("cx").add("cy").add("d").add("opacity");
  }

  /* change the requested properties on the nodes */
  updateNodesWithNewData(this.nodes, nodePropsToModify);

  if (zoomIntoClade) { /* must happen below updateNodesWithNewData */
    this.nodes.forEach((d) => {
      d.inView = false;
      d.update = true;
    });
    /* if clade is terminal, use the parent as the zoom node */
    const zoomNode = zoomIntoClade.terminal ? zoomIntoClade.parent : zoomIntoClade;
    applyToChildren(zoomNode, (d) => {d.inView = true;});
  }

  /* run calculations as needed */
  /* distance */
  if (newDistance) this.setDistance(newDistance);
  /* layout (must run after distance) */
  if (newDistance || newLayout) this.setLayout(newLayout || this.layout);
  /* mapToScreen */
  if (
    svgPropsToUpdate.has(["stroke-width"]) ||
    newDistance ||
    newLayout ||
    zoomIntoClade
  ) {
    this.mapToScreen();
  }

  /* svg change elements */
  const extras = {removeConfidences, showConfidences};
  this.modifySVG(elemsToUpdate, svgPropsToUpdate, transitionTime, extras);

  this.timeLastRenderRequested = Date.now();
};
