
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

const validAttrs = ["r", "cx", "cy", "d"];
const validStyles = ["stroke", "fill", "visibility", "stroke-width", "opacity"];
const validForThisElem = {
  ".branch": ["stroke", "path", "stroke-width"],
  ".tip": ["stroke", "fill", "visibility", "r"]
};

const createUpdateCall = (treeElem, properties) => (selection) => {
  [...properties].filter((x) => validAttrs.indexOf(x) !== -1)
    .filter((x) => validForThisElem[treeElem].indexOf(x) !== -1)
    .forEach((attrName) => {
      selection.attr(attrName, (d) => d[attrName]);
    });
  [...properties].filter((x) => validStyles.indexOf(x) !== -1)
    .filter((x) => validForThisElem[treeElem].indexOf(x) !== -1)
    .forEach((attrName) => {
      selection.style(attrName, (d) => d[attrName]);
    });
};

export const change = function change({
  /* booleans for what should be changed */
  changeColorBy = false,
  changeVisibility = false,
  changeTipRadii = false,
  changeBranchThickness = false,
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

  /* the logic of converting what react is telling us to change
  and what we actually change */
  if (changeColorBy) {
    /* check that fill & stroke are defined */
    svgPropsToUpdate.add("stroke").add("fill");
    nodePropsToModify.stroke = stroke;
    nodePropsToModify.fill = fill;
    elemsToUpdate.add(".branch").add(".tip");
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
    elemsToUpdate.add(".branch");
    svgPropsToUpdate.add("stroke-width");
    nodePropsToModify["stroke-width"] = branchThickness;
  }


  /* run calculations as needed */

  /* change nodes as necessary */
  updateNodesWithNewData(this.nodes, nodePropsToModify);

  /* calculations that depend on node data appended above */
  if (svgPropsToUpdate.has("stroke-width")) {
    this.mapToScreen();
  }

  /* calculate dt */
  const idealTransitionTime = 500;
  let transitionTime = idealTransitionTime;
  if ((Date.now() - this.timeLastRenderRequested) < idealTransitionTime * 2) {
    transitionTime = 0;
  }
  /* strip out elemsToUpdate that are not necesary! */

  /* svg change elements */

  /* there's different methods here - transition everything, snap,
  hide-some-transition-some-show-all, etc etc */
  elemsToUpdate.forEach((treeElem) => {
    console.log("updating treeElem", treeElem, "transition:", transitionTime);
    const updateCall = createUpdateCall(treeElem, svgPropsToUpdate);
    if (transitionTime) {
      this.svg.selectAll(treeElem)
        .filter((d) => d.update)
        .transition().duration(transitionTime)
        .call(updateCall);
    } else {
      this.svg.selectAll(treeElem)
        .filter((d) => d.update)
        .call(updateCall);
    }
  });
  this.timeLastRenderRequested = Date.now();

};
