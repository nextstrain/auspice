
const updateNodesWithNewData = (nodes, data) => {
  console.log("update nodes with data for these keys:", Object.keys(data));
  let tmp = 0;
  nodes.forEach((d, i) => {
    d.update = false;
    for (let key in data) { // eslint-disable-line
      const val = data[key][i];
      if (val !== d[key]) {
        d[key] = val;
        d.update = true;
        tmp++;
      }
    }
  });
  console.log("changed ", tmp, " things")
};

const isValid = {
  ".branch": ["stroke", "path"],
  ".tip": ["stroke", "fill"]
};

const createUpdateCall = (treeElem, attrs, styles) => (selection) => {
  [...attrs].filter((x) => isValid[treeElem].indexOf(x) !== -1)
    .forEach((attrName) => {
      selection.attr(attrName, (d) => d[attrName]);
    });
  [...styles].filter((x) => isValid[treeElem].indexOf(x) !== -1)
    .forEach((styleName) => {
      selection.style(styleName, (d) => d[styleName]);
    });
};

export const change = function change({
  colorBy = false,
  stroke = undefined,
  fill = undefined
}) {
  console.log("\n** change **\n\n");
  const data = {};

  const toChange = {
    elems: new Set(),
    styles: new Set(),
    attrs: new Set()
  };

  console.log(colorBy)

  /* the logic of converting what react is telling us to change
  and what we actually change */
  if (colorBy) {
    toChange.styles.add("stroke").add("fill");
    data.stroke = stroke;
    data.fill = fill;
    toChange.elems.add(".branch").add(".tip");
  }

  /* run calculations as needed */

  /* change nodes as necessary */
  updateNodesWithNewData(this.nodes, data);

  /* calculate dt */
  const dt = 700;

  /* strip out toChange.elems that are not necesary */

  /* svg change elements */
  toChange.elems.forEach((treeElem) => {
    console.log("updating treeElem", treeElem);
    const updateCall = createUpdateCall(treeElem, toChange.attrs, toChange.styles);
    this.svg.selectAll(treeElem)
      .filter((d) => d.update)
      .transition().duration(dt)
      .call(updateCall);
  });

};
