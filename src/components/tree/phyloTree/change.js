
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

const validAttrs = ["r"];
const validStyles = ["stroke", "fill", "visibility"];
const validForThisElem = {
  ".branch": ["stroke", "path"],
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
  /* arrays of data (the same length as nodes) */
  stroke = undefined,
  fill = undefined,
  visibility = undefined,
  tipRadii = undefined
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


  /* run calculations as needed */

  /* change nodes as necessary */
  updateNodesWithNewData(this.nodes, nodePropsToModify);

  /* calculate dt */
  const dt = 700;

  /* strip out elemsToUpdate that are not necesary! */

  /* svg change elements */
  elemsToUpdate.forEach((treeElem) => {
    console.log("updating treeElem", treeElem);
    const updateCall = createUpdateCall(treeElem, svgPropsToUpdate);
    this.svg.selectAll(treeElem)
      .filter((d) => d.update)
      .transition().duration(dt)
      .call(updateCall);
  });

};
