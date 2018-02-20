import { timerFlush } from "d3-timer";
import { calcConfidenceWidth } from "./confidence";
import { applyToChildren } from "./helpers";

/* loop through the nodes and update each provided prop with the new value
 * additionally, set d.update -> whether or not the node props changed
 */
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


/* the following 4 dictionaries define which attrs & styles should (potentially)
 * be applied to which class (e.g. ".tip"). They are either taken directly from the
 * node props (e.g. "fill" is set to the node.fill value) or a custom function
 * is defined here
 */
const setAttrViaNodeProps = {
  ".branch": new Set(),
  ".tip": new Set(["r"])
};
const setStyleViaNodeProps = {
  ".branch": new Set(["stroke", "stroke-width"]),
  ".tip": new Set(["fill", "visibility", "stroke"])
};
const setAttrViaFunction = {
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
const setStyleViaFunction = {
  ".vaccineDottedLine": {
    opacity: (d) => d.that.distance === "num_date" ? 1 : 0
  },
  ".conf": {
    stroke: (d) => d.stroke,
    "stroke-width": calcConfidenceWidth
  }
};

/* Returns a function which can be called as part of a D3 chain in order to modify
 * the appropriate attrs & styles for this treeElem.
 * This checks the above dictionaries to see which properties (attr || style) are
 * valid for each treeElem (className).
 */
const createUpdateCall = (treeElem, properties) => (selection) => {
  /* generics - those which are simply taken from the node! */
  if (setAttrViaNodeProps[treeElem]) {
    [...properties].filter((x) => setAttrViaNodeProps[treeElem].has(x))
      .forEach((attrName) => {
        selection.attr(attrName, (d) => d[attrName]);
      });
  }
  if (setStyleViaNodeProps[treeElem]) {
    [...properties].filter((x) => setStyleViaNodeProps[treeElem].has(x))
      .forEach((styleName) => {
        selection.style(styleName, (d) => d[styleName]);
      });
  }
  /* more complicated, functions defined above */
  if (setAttrViaFunction[treeElem]) {
    [...properties].filter((x) => setAttrViaFunction[treeElem][x])
      .forEach((attrName) => {
        selection.attr(attrName, setAttrViaFunction[treeElem][attrName]);
      });
  }
  if (setStyleViaFunction[treeElem]) {
    [...properties].filter((x) => setStyleViaFunction[treeElem][x])
      .forEach((styleName) => {
        selection.attr(styleName, setStyleViaFunction[treeElem][styleName]);
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

/* use D3 to select and modify elements, such that a given element is only ever modified _once_
 * @elemsToUpdate {set} - the class names to select, e.g. ".tip" or ".branch"
 * @svgPropsToUpdate {set} - the props (styles & attrs) to update. The respective functions are defined above
 * @transitionTime {INT} - in ms. if 0 then no transition (timerFlush is used)
 * @extras {dict} - extra keywords to tell this function to call certain phyloTree update methods. In flux.
 */
export const modifySVG = function modifySVG(elemsToUpdate, svgPropsToUpdate, transitionTime, extras) {
  let updateCall;
  const classesToPotentiallyUpdate = [".tip", ".vaccineDottedLine", ".vaccineCross", ".branch"]; /* order is respected */
  console.log("modifying these elems", elemsToUpdate)
  /* treat stem / branch specially, but use these to replace a normal .branch call if that's also to be applied */
  if (elemsToUpdate.has(".branch.S") || elemsToUpdate.has(".branch.T")) {
    const applyBranchPropsAlso = elemsToUpdate.has(".branch");
    if (applyBranchPropsAlso) classesToPotentiallyUpdate.splice(classesToPotentiallyUpdate.indexOf(".branch"), 1);
    const ST = [".S", ".T"];
    ST.forEach((x, STidx) => {
      if (elemsToUpdate.has(`.branch${x}`)) {
        if (applyBranchPropsAlso) {
          updateCall = (selection) => {
            createUpdateCall(".branch", svgPropsToUpdate)(selection); /* the "normal" branch changes to apply */
            selection.attr("d", (d) => d.branch[STidx]); /* change the path (differs between .S and .T) */
          };
        } else {
          updateCall = (selection) => {selection.attr("d", (d) => d.branch[STidx]);};
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
  if (elemsToUpdate.has('.cladeLabel')) {
    this.updateCladeLabels(transitionTime);
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

  /* confidence intervals */
  if (extras.removeConfidences && this.confidencesInSVG) {
    this.removeConfidence(); /* do not use a transition time - it's too clunky (too many elements?) */
  } else if (extras.showConfidences && !this.confidencesInSVG) {
    this.drawConfidence(); /* see comment above */
  } else if (elemsToUpdate.has(".conf") && this.confidencesInSVG) {
    if (this.layout === "rect" && this.distance === "num_date") {
      updateCall = createUpdateCall(".conf", svgPropsToUpdate);
      genericSelectAndModify(this.svg, ".conf", updateCall, transitionTime);
    } else {
      this.removeConfidence(); /* see comment above */
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
  svgHasChangedDimensions = false,
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
  console.log("\n** phylotree.change() (time since last run:", Date.now() - this.timeLastRenderRequested, "ms) **\n\n");
  console.time("phylotree.change");
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
  if (newDistance || newLayout || zoomIntoClade || svgHasChangedDimensions) {
    elemsToUpdate.add(".tip").add(".branch.S").add(".branch.T");
    elemsToUpdate.add(".vaccineCross").add(".vaccineDottedLine").add(".conf");
    elemsToUpdate.add('.cladeLabel').add('.tipLabel');
    elemsToUpdate.add(".grid").add(".regression");
    svgPropsToUpdate.add("cx").add("cy").add("d").add("opacity");
  }

  /* change the requested properties on the nodes */
  updateNodesWithNewData(this.nodes, nodePropsToModify);

  /* some things need to update d.inView and/or d.update. This should be centralised */
  /* TODO: list all functions which modify these */
  if (zoomIntoClade) { /* must happen below updateNodesWithNewData */
    this.nodes.forEach((d) => {
      d.inView = false;
      d.update = true;
    });
    /* if clade is terminal, use the parent as the zoom node */
    this.zoomNode = zoomIntoClade.terminal ? zoomIntoClade.parent : zoomIntoClade;
    applyToChildren(this.zoomNode, (d) => {d.inView = true;});
  }
  if (svgHasChangedDimensions) {
    this.nodes.forEach((d) => {d.update = true;});
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
    zoomIntoClade ||
    svgHasChangedDimensions
  ) {
    this.mapToScreen();
  }

  /* svg change elements */
  const extras = {removeConfidences, showConfidences};
  this.modifySVG(elemsToUpdate, svgPropsToUpdate, transitionTime, extras);

  this.timeLastRenderRequested = Date.now();
  console.timeEnd("phylotree.change");
};
