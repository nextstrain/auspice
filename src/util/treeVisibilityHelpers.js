import { freqScale } from "./globals";
import { calcTipCounts } from "./treeCountingHelpers";

export const strainNameToIdx = (nodes, name) => {
  let i;
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].strain === name) {
      return i;
    }
  }
  console.error("strainNameToIdx couldn't find strain");
  return 0;
};

/** calcBranchThickness **
* returns an array of node (branch) thicknesses based on the tipCount at each node
* If the node isn't visible, the thickness is 1.
* Pure.
* @param nodes - JSON nodes
* @param visibility - visibility array (1-1 with nodes)
* @param rootIdx - nodes index of the currently in-view root
* @returns array of thicknesses (numeric)
*/
const calcBranchThickness = (nodes, visibility, rootIdx) => {
  let maxTipCount = nodes[rootIdx].tipCount;
  /* edge case: no tips selected */
  if (!maxTipCount) {
    maxTipCount = 1;
  }
  return nodes.map((d, idx) => (
    visibility[idx] === "visible" ? freqScale((d.tipCount + 5) / (maxTipCount + 5)) : 1
  ));
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
const identifyPathToTip = (nodes, tipIdx) => {
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
const calcVisibility = (tree, controls, dates) => {
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
    // let inView;
    // try {
    //   inView = tree.nodes.map((d) => d.shell.inView);
    // } catch (e) {
    //   inView = tree.nodes.map(() => true);
    // }
    // /* intersect visibility and inView */
    // visibility = visibility.map((cv, idx) => (cv && inView[idx]));

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


export const calculateVisiblityAndBranchThickness = (tree, controls, dates, {idxOfInViewRootNode = 0, tipSelectedIdx = 0} = {}) => {
  const visibility = tipSelectedIdx ? identifyPathToTip(tree.nodes, tipSelectedIdx) : calcVisibility(tree, controls, dates);
  /* recalculate tipCounts over the tree - modifies redux tree nodes in place (yeah, I know) */
  calcTipCounts(tree.nodes[0], visibility);
  /* re-calculate branchThickness (inline) */
  return {
    visibility: visibility,
    visibilityVersion: tree.visibilityVersion + 1,
    branchThickness: calcBranchThickness(tree.nodes, visibility, 0),
    branchThicknessVersion: tree.branchThicknessVersion + 1
  };
};
