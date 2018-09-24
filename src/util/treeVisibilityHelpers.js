import { freqScale, NODE_NOT_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY, NODE_VISIBLE } from "./globals";
import { calcTipCounts } from "./treeCountingHelpers";

export const getVisibleDateRange = (nodes, visibility) => nodes
  .filter((node, idx) => (visibility[idx] === NODE_VISIBLE && !node.hasChildren))
  .reduce((acc, node) => {
    if (node.attr.num_date < acc[0]) return [node.attr.num_date, acc[1]];
    if (node.attr.num_date > acc[1]) return [acc[0], node.attr.num_date];
    return acc;
  }, [100000, -100000]);

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

export const cladeNameToIdx = (nodes, name) => {
  let i;
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].attr.labels !== undefined && nodes[i].attr.labels.clade !== undefined && nodes[i].attr.labels.clade === name) {
      return i;
    }
  }
  console.error("cladeNameToIdx couldn't find clade");
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
    visibility[idx] === 2 ? freqScale((d.tipCount + 5) / (maxTipCount + 5)) : 0.5
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
 * @return {array} visibility array (values in {0, 1, 2})
 */
const identifyPathToTip = (nodes, tipIdx) => {
  const visibility = new Array(nodes.length).fill(false);
  visibility[tipIdx] = true;
  makeParentVisible(visibility, nodes[tipIdx]); /* recursive */
  return visibility.map((cv) => cv ? 2 : 0);
};


/* calcVisibility
USES:
inView: attribute of phyloTree.nodes, but accessible through redux.tree.nodes[idx].shell.inView
  Bool. Set by phyloTree, determines if the tip is within the view.
controls.filters
use dates NOT controls.dateMin & controls.dateMax

RETURNS:
visibility: array of integers in {0, 1, 2}
 - 0: not displayed by map. Potentially displayed by tree as a thin branch.
 - 1: available for display by the map. Displayed by tree as a thin branch.
 - 2: Displayed by both the map and the tree.

ROUGH DESCRIPTION OF HOW FILTERING IS APPLIED:
 - inView filtering (reflects tree zooming): Nodes which are not inView always have visibility=0
 - time filtering is simple - all nodes (internal + terminal) not within (tmin, tmax) are excluded.
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
    /* inView represents nodes that are within the current view window (i.e. not off the screen) */
    let inView;
    try {
      inView = tree.nodes.map((d) => d.shell.inView);
    } catch (e) {
      /* edge case: this fn may be called before the shell structure of the nodes
       * has been created (i.e. phyloTree's not run yet). In this case, it's
       * safe to assume that everything's in view */
      inView = tree.nodes.map((d) => d.inView !== undefined ? d.inView : true);
    }

    // FILTERS
    let filtered;
    const filterPairs = [];
    Object.keys(controls.filters).forEach((key) => {
      if (controls.filters[key].length) {
        filterPairs.push([key, controls.filters[key]]);
      }
    });
    if (filterPairs.length) {
      /* find the terminal nodes that were (a) already visibile and (b) match the filters */
      filtered = tree.nodes.map((d, idx) => (
        !d.hasChildren && inView[idx] && filterPairs.every((x) => x[1].indexOf(d.attr[x[0]]) > -1)
      ));
      const idxsOfFilteredTips = filtered.reduce((a, e, i) => {
        if (e) {a.push(i);}
        return a;
      }, []);
      /* for each visibile tip, make the parent nodes visible (recursively) */
      for (let i = 0; i < idxsOfFilteredTips.length; i++) {
        makeParentVisible(filtered, tree.nodes[idxsOfFilteredTips[i]]);
      }
    }
    /* intersect the various arrays contributing to visibility */
    const visibility = tree.nodes.map((node, idx) => {
      if (inView[idx] && (filtered ? filtered[idx] : true)) {
        const nodeDate = node.attr.num_date;
        /* if without date, treetime probably not run - or would be inferred
          so if displayDates false, then ensure node displayed */
        if (!controls.displayDates && node.attr.num_date === undefined) {
          return NODE_VISIBLE;
        }
        /* is the actual node date (the "end" of the branch) in the time slice? */
        if (nodeDate >= dates.dateMinNumeric && nodeDate <= dates.dateMaxNumeric) {
          return NODE_VISIBLE;
        }
        /* is any part of the (parent date -> node date) in the time slice? */
        if (!(nodeDate < dates.dateMinNumeric || node.parent.attr.num_date > dates.dateMaxNumeric)) {
          return NODE_VISIBLE_TO_MAP_ONLY;
        }
      }
      return NODE_NOT_VISIBLE;
    });
    return visibility;
  }
  console.error("calcVisibility ran without tree.nodes");
  return NODE_VISIBLE;
};

export const calculateVisiblityAndBranchThickness = (tree, controls, dates, {idxOfInViewRootNode = 0, tipSelectedIdx = 0} = {}) => {
  const visibility = tipSelectedIdx ? identifyPathToTip(tree.nodes, tipSelectedIdx) : calcVisibility(tree, controls, dates);
  /* recalculate tipCounts over the tree - modifies redux tree nodes in place (yeah, I know) */
  calcTipCounts(tree.nodes[0], visibility);
  /* re-calculate branchThickness (inline) */
  return {
    visibility: visibility,
    visibilityVersion: tree.visibilityVersion + 1,
    branchThickness: calcBranchThickness(tree.nodes, visibility, idxOfInViewRootNode),
    branchThicknessVersion: tree.branchThicknessVersion + 1
  };
};
