import { freqScale, NODE_NOT_VISIBLE, NODE_VISIBLE_TO_MAP_ONLY, NODE_VISIBLE } from "./globals";
import { calcTipCounts } from "./treeCountingHelpers";
import { getTraitFromNode } from "./treeMiscHelpers";
import { warningNotification } from "../actions/notifications";

export const getVisibleDateRange = (nodes, visibility) => nodes
  .filter((node, idx) => (visibility[idx] === NODE_VISIBLE && !node.hasChildren))
  .reduce((acc, node) => {
    const nodeDate = getTraitFromNode(node, "num_date");
    return nodeDate ? [Math.min(nodeDate, acc[0]), Math.max(nodeDate, acc[1])] : acc;
  }, [100000, -100000]);

export const strainNameToIdx = (nodes, name) => {
  let i;
  for (i = 0; i < nodes.length; i++) {
    if (nodes[i].name === name) {
      return i;
    }
  }
  console.error("strainNameToIdx couldn't find strain");
  return 0;
};

/**
 * Find the node with the given label name & value
 * NOTE: if there are multiple nodes with the same label then the first encountered is returned
 * @param {Array} nodes tree nodes (flat)
 * @param {string} labelName label name
 * @param {string} labelValue label value
 * @returns {int} the index of the matching node (0 if no match found)
 */
export const getIdxMatchingLabel = (nodes, labelName, labelValue, dispatch) => {
  let i;
  let found = 0;
  for (i = 0; i < nodes.length; i++) {
    if (
      nodes[i].branch_attrs &&
      nodes[i].branch_attrs.labels !== undefined &&
      nodes[i].branch_attrs.labels[labelName] === labelValue
    ) {
      if (found === 0) {
        found = i;
      } else {
        console.error(`getIdxMatchingLabel found multiple labels ${labelName}===${labelValue}`);
        dispatch(warningNotification({
          message: "Specified Zoom Label Found Multiple Times!",
          details: "Multiple nodes in the tree are labelled '"+labelName+" "+labelValue+"' - no zoom performed"
        }));
        return 0;
      }
    }
  }
  if (found === 0) {
    console.error(`getIdxMatchingLabel couldn't find label ${labelName}===${labelValue}`);
    dispatch(warningNotification({
      message: "Specified Zoom Label Value Not Found!",
      details: "The label '"+labelName+"' value '"+labelValue+"' was not found in the tree - no zoom performed"
    }));
  }
  return found;
};

/** calcBranchThickness **
* returns an array of node (branch) thicknesses based on the tipCount at each node
* If the node isn't visible, the thickness is 1.
* Relies on the `tipCount` property of the nodes having been updated.
* Pure.
* @param nodes - JSON nodes
* @param visibility - visibility array (1-1 with nodes)
* @returns array of thicknesses (numeric)
*/
const calcBranchThickness = (nodes, visibility) => {
  let maxTipCount = nodes[0].tipCount;
  /* edge case: no tips selected */
  if (!maxTipCount) {
    maxTipCount = 1;
  }
  return nodes.map((d, idx) => {
    if (visibility[idx] === NODE_VISIBLE) {
      return freqScale((d.tipCount + 5) / (maxTipCount + 5));
    }
    return 0.5;
  });
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
  return visibility.map((cv) => cv ? NODE_VISIBLE : NODE_NOT_VISIBLE);
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
 - controls.filters (redux) is a dict of trait name -> values
 - filters (in this code) is a list of filters to apply
   e.g. [{trait: "country", values: [...]}, ...]
*/
export const calcVisibility = (tree, controls, dates) => {
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
    let filtered; // array of bools, same length as tree.nodes. true -> that node should be visible
    const filters = [];
    Object.keys(controls.filters).forEach((trait) => {
      if (controls.filters[trait].length) {
        filters.push({trait, values: controls.filters[trait]});
      }
    });
    if (filters.length) {
      /* find the terminal nodes that were (a) already visibile and (b) match the filters */
      filtered = tree.nodes.map((d, idx) => (
        !d.hasChildren && inView[idx] && filters.every((f) => f.values.includes(getTraitFromNode(d, f.trait)))
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
        const nodeDate = getTraitFromNode(node, "num_date");
        const parentNodeDate = getTraitFromNode(node.parent, "num_date");
        if (!nodeDate || !parentNodeDate) {
          return NODE_VISIBLE;
        }
        /* if branchLengthsToDisplay is "divOnly", then ensure node displayed */
        if (controls.branchLengthsToDisplay === "divOnly") {
          return NODE_VISIBLE;
        }
        /* is the actual node date (the "end" of the branch) in the time slice? */
        if (nodeDate >= dates.dateMinNumeric && nodeDate <= dates.dateMaxNumeric) {
          return NODE_VISIBLE;
        }
        /* is any part of the (parent date -> node date) in the time slice? */
        if (!(nodeDate < dates.dateMinNumeric || parentNodeDate > dates.dateMaxNumeric)) {
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

export const calculateVisiblityAndBranchThickness = (tree, controls, dates, {tipSelectedIdx = 0} = {}) => {
  const visibility = tipSelectedIdx ? identifyPathToTip(tree.nodes, tipSelectedIdx) : calcVisibility(tree, controls, dates);
  /* recalculate tipCounts over the tree - modifies redux tree nodes in place (yeah, I know) */
  calcTipCounts(tree.nodes[0], visibility);
  /* re-calculate branchThickness (inline) */
  return {
    visibility: visibility,
    visibilityVersion: tree.visibilityVersion + 1,
    branchThickness: calcBranchThickness(tree.nodes, visibility),
    branchThicknessVersion: tree.branchThicknessVersion + 1
  };
};
