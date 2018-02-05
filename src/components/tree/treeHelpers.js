import { rgb } from "d3-color";
import { interpolateRgb } from "d3-interpolate";
import { scalePow } from "d3-scale";
import { tipRadius, freqScale, tipRadiusOnLegendMatch } from "../../util/globals";

/**
*  For each node visit if node not a hashMap key, insert
*  into array.  Then append node into end of the array.
*  @params node - object to check
*  @param hashMap - object literal used for deduping
*  @param array - final array that nodes are inserted
*/
const visitNode = (node, hashMap, array) => {
  if (!hashMap[node.clade]) {
    hashMap[node.clade] = true;
    array.push(node);
  }
};

/**
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*  hashMap object literal used for deduping.
*  @param root - deserialized JSON root to begin traversal
*  @returns array  - final array of nodes in order with no dups
*/
export const flattenTree = (root) => {

  const stack = [], array = [], hashMap = {};
  stack.push(root);

  while (stack.length !== 0) {
    const node = stack.pop();
    visitNode(node, hashMap, array);
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        stack.push(node.children[i]);
      }
    }
  }

  return array;

};

/**
*  Add reference to node.parent for each node in tree
*  For root add root.parent = root
*  Pre-order tree traversal visits each node using stack.
*  Checks if leaf node based on node.children
*  pushes all children into stack and continues traversal.
*  @param root - deserialized JSON root to begin traversal
*/
export const appendParentsToTree = (root) => {

  root.parent = root;
  const stack = [];
  stack.push(root);

  while (stack.length !== 0) {
    const node = stack.pop();
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        node.children[i].parent = node;
        stack.push(node.children[i]);
      }
    }
  }

};

/**
* for each node, calculate the number of subtending tips (alive or dead)
* side effects: n.fullTipCount for each node
*  @param root - deserialized JSON root to begin traversal
*/
export const calcFullTipCounts = (node) => {
  node.fullTipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcFullTipCounts(node.children[i]);
      node.fullTipCount += node.children[i].fullTipCount;
    }
  } else {
    node.fullTipCount = 1;
  }
};

/**
* for each node, calculate the number of subtending tips which are visible
* side effects: n.tipCount for each node
*  @param root - deserialized JSON root to begin traversal
*/
export const calcTipCounts = (node, visibility) => {
  node.tipCount = 0;
  if (typeof node.children !== "undefined") {
    for (let i = 0; i < node.children.length; i++) {
      calcTipCounts(node.children[i], visibility);
      node.tipCount += node.children[i].tipCount;
    }
  } else {
    node.tipCount = visibility[node.arrayIdx] === "visible" ? 1 : 0;
  }
};

/**
* calculates (and returns) an array of node (branch) thicknesses.
* If the node isn't visible, the thickness is 1.
* No side effects.
* @param nodes - JSON nodes
* @param visibility - visibility array (1-1 with nodes)
* @param rootIdx - nodes index of the currently in-view root
* @returns array of thicknesses (numeric)
*/
export const calcBranchThickness = (nodes, visibility, rootIdx) => {
  let maxTipCount = nodes[rootIdx].tipCount;
  /* edge case: no tips selected */
  if (!maxTipCount) {
    maxTipCount = 1;
  }
  return nodes.map((d, idx) => (
    visibility[idx] === "visible" ? freqScale((d.tipCount + 5) / (maxTipCount + 5)) : 1
  ));
};

/* a getter for the value of the colour attribute of the node provided for the currently set colour
note this is not the colour HEX */
export const getTipColorAttribute = (node, colorScale) => {
  if (colorScale.colorBy.slice(0, 3) === "gt-" && colorScale.genotype) {
    return node.currentGt;
  }
  return node.attr[colorScale.colorBy];
};

/* generates and returns an array of colours (HEXs) for the nodes under the given colorScale */
/* takes around 2ms on a 2000 tip tree */
export const calcNodeColor = (tree, colorScale) => {
  if (tree && tree.nodes && colorScale && colorScale.colorBy) {
    const nodeColorAttr = tree.nodes.map((n) => getTipColorAttribute(n, colorScale));
    // console.log(nodeColorAttr.map((n) => colorScale.scale(n)))
    return nodeColorAttr.map((n) => colorScale.scale(n));
  }
  return null;
};

/**
* equates a single tip and a legend element
* exact match is required for categorical qunantities such as genotypes, regions
* continuous variables need to fall into the interal (lower_bound[leg], leg]
* @param selectedLegendItem - value of the selected tip attribute (numeric or string)
* @param node - node (tip) in question
* @param legendBoundsMap - if falsey, then exact match required. Else contains bounds for match.
* @param colorScale - used to get the value of the attribute being used for colouring
* @returns bool
*/
const determineLegendMatch = (selectedLegendItem, node, legendBoundsMap, colorScale) => {
  const nodeAttr = getTipColorAttribute(node, colorScale);
  if (legendBoundsMap) {
    return (nodeAttr <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
           (nodeAttr > legendBoundsMap.lower_bound[selectedLegendItem]);
  }
  return nodeAttr === selectedLegendItem;
};

/**
* produces the array of tip radii - if nothing's selected this is the hardcoded tipRadius
* if there's a selectedLegendItem, then values will be small (like normal) or big (for those tips selected)
* @param selectedLegendItem - value of the selected tip attribute (numeric or string)
* @param colorScale - node (tip) in question
* @param tree
* @returns null (if data not ready) or array of tip radii
*/
export const calcTipRadii = (selectedLegendItem, colorScale, tree) => {
  if (selectedLegendItem && tree && tree.nodes) {
    const legendMap = colorScale.continuous ? colorScale.legendBoundsMap : false;
    return tree.nodes.map((d) => determineLegendMatch(selectedLegendItem, d, legendMap, colorScale) ? tipRadiusOnLegendMatch : tipRadius);
  } else if (tree && tree.nodes) {
    return tree.nodes.map(() => tipRadius);
  }
  return null; // fallthrough
};

/* recursively mark the parents of a given node active
by setting the node idx to true in the param visArray */
const makeParentVisible = (visArray, node) => {
  if (node.arrayIdx === 0 || visArray[node.parent.arrayIdx]) {
    return; // this is the root of the tree or the parent was already visibile
  }
  visArray[node.parent.arrayIdx] = true;
  makeParentVisible(visArray, node.parent);
};

/**
 * Create a visibility array to show the path through the tree to the selected tip
 * @param  {array} nodes redux tree nodes
 * @param  {int} tipIdx idx of the selected tip
 * @return {array} visibility array (values of "visible" | "hidden")
 */
export const identifyPathToTip = (nodes, tipIdx) => {
  const visibility = new Array(nodes.length).fill(false);
  visibility[tipIdx] = true;
  makeParentVisible(visibility, nodes[tipIdx]); /* recursive */
  return visibility.map((cv) => cv ? "visible" : "hidden");
};

/* calcVisibility
USES:
inView: attribute of phyloTree.nodes, but accessible through redux.tree.nodes[idx].shell.inView
  Bool. Set by phyloTree, determines if the tip is within the view.
controls.filters
use dates NOT controls.dateMin & controls.dateMax

RETURNS:
visibility: array of "visible" or "hidden"

ROUGH DESCRIPTION OF HOW FILTERING IS APPLIED:
 - time filtering is simple - all nodes (internal + terminal) not within (tmin, tmax) are excluded.
 - inView filtering is similar - nodes out of the view cannot possibly be visible
 - filters are a bit more tricky - the visibile tips are calculated, and the parent
    branches back to the MRCA are considered visibile. This is then intersected with
    the time & inView visibile stuff

FILTERS:
 - filters stored in redux - controls.filters
 - filters have 2 keys, each with an array of values
   keys: "region" and/or "authors"
 - filterPairs is a list of lists. Each list defines the filtering to do.
   i.e. [ [ region, [...values]], [authors, [...values]]]
*/
export const calcVisibility = (tree, controls, dates) => {
  if (tree.nodes) {
    /* reset visibility */
    let visibility = tree.nodes.map(() => true);

    // if we have an analysis slider active, then we must filter on that as well
    // note that min date for analyis doesnt apply
    // commented out as analysis slider will probably be removed soon!
    // if (controls.analysisSlider && controls.analysisSlider.valid) {
    //   /* extra slider is numerical rounded to 2dp */
    //   const valid = tree.nodes.map((d) =>
    //     d.attr[controls.analysisSlider.key] ? Math.round(d.attr[controls.analysisSlider.key] * 100) / 100 <= controls.analysisSlider.value : true
    //   );
    //   visibility = visibility.map((cv, idx) => (cv && valid[idx]));
    // }

    // IN VIEW FILTERING (internal + terminal nodes)
    /* edge case: this fn may be called before the shell structure of the nodes
    has been created (i.e. phyloTree's not run yet). In this case, it's
    safe to assume that everything's in view */
    let inView;
    try {
      inView = tree.nodes.map((d) => d.shell.inView);
    } catch (e) {
      inView = tree.nodes.map(() => true);
    }
    /* intersect visibility and inView */
    visibility = visibility.map((cv, idx) => (cv && inView[idx]));

    // FILTERS
    const filterPairs = [];
    Object.keys(controls.filters).forEach((key) => {
      if (controls.filters[key].length) {
        filterPairs.push([key, controls.filters[key]]);
      }
    });
    if (filterPairs.length) {
      /* find the terminal nodes that were (a) already visibile and (b) match the filters */
      const filtered = tree.nodes.map((d, idx) => (
        !d.hasChildren && visibility[idx] && filterPairs.every((x) => x[1].indexOf(d.attr[x[0]]) > -1)
      ));
      const idxsOfFilteredTips = filtered.reduce((a, e, i) => {
        if (e) {a.push(i);}
        return a;
      }, []);
      /* for each visibile tip, make the parent nodes visible (recursively) */
      for (let i = 0; i < idxsOfFilteredTips.length; i++) {
        makeParentVisible(filtered, tree.nodes[idxsOfFilteredTips[i]]);
      }
      /* intersect visibility and filtered */
      visibility = visibility.map((cv, idx) => (cv && filtered[idx]));
    }

    // TIME FILTERING (internal + terminal nodes)
    const timeFiltered = tree.nodes.map((d) => {
      return !(d.attr.num_date < dates.dateMinNumeric || d.parent.attr.num_date > dates.dateMaxNumeric);
    });
    visibility = visibility.map((cv, idx) => (cv && timeFiltered[idx]));

    /* return array of "visible" or "hidden" values */
    return visibility.map((cv) => cv ? "visible" : "hidden");
  }
  return "visible";
};

const branchInterpolateColour = "#BBB";
const branchOpacityConstant = 0.4;
const branchOpacityFunction = scalePow()
  .exponent([0.3])
  .domain([0, 1])
  .range([branchOpacityConstant, 1])
  .clamp(true);
// entropy calculation precomputed in augur
// export const calcEntropyOfValues = (vals) =>
//   vals.map((v) => v * Math.log(v + 1E-10)).reduce((a, b) => a + b, 0) * -1 / Math.log(vals.length);


/**
 * calculate array of HEXs to actually be displayed.
 * (colorBy) confidences manifest as opacity ramps
 * @param {obj} tree phyloTree object
 * @param {bool} confidence enabled?
 * @return {array} array of hex's. 1-1 with nodes.
 */
export const calcStrokeCols = (tree, confidence, colorBy) => {
  if (confidence === true) {
    return tree.nodeColors.map((col, idx) => {
      const entropy = tree.nodes[idx].attr[colorBy + "_entropy"];
      return rgb(interpolateRgb(col, branchInterpolateColour)(branchOpacityFunction(entropy))).toString();
    });
  }
  return tree.nodeColors.map((col) => {
    return rgb(interpolateRgb(col, branchInterpolateColour)(branchOpacityConstant)).toString();
  });
};


/**
*  if the metadata JSON defines vaccine strains then create an array of the nodes
*  @param nodes - nodes
*  @param vaccineChoices - undefined or the object from the metadata JSON linking strain names to dates
*  @returns array  - array of nodes that are vaccines. NOTE these are references to the nodes array
*  side-effects: adds the vaccineDate property to the relevent nodes
*/
export const processVaccines = (nodes, vaccineChoices) => {
  if (!vaccineChoices) {return false;}
  const names = Object.keys(vaccineChoices);
  const vaccines = nodes.filter((d) => names.indexOf(d.strain) !== -1);
  vaccines.forEach((d) => {d.vaccineDate = vaccineChoices[d.strain];});
  return vaccines;
};

/**
 * Adds certain properties to the nodes array - for each node in nodes it adds
 * node.fullTipCount - see calcFullTipCounts() description
 * node.hasChildren {bool}
 * node.arrayIdx  {integer} - the index of the node in the nodes array
 * @param  {array} nodes redux tree nodes
 * @return {array} input array (kinda unneccessary)
 * side-effects: node.hasChildren (bool) and node.arrayIdx (INT) for each node in nodes
 */
export const processNodes = (nodes) => {
  const rootNode = nodes[0];
  nodes.forEach((d) => {if (typeof d.attr === "undefined") {d.attr = {};} });
  calcFullTipCounts(rootNode);
  nodes.forEach((d) => {d.hasChildren = typeof d.children !== "undefined";});
  /* set an index so that we can access visibility / nodeColors if needed */
  nodes.forEach((d, idx) => {d.arrayIdx = idx;});
  return nodes;
};
