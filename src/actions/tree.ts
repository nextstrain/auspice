import { AnyAction } from "@reduxjs/toolkit";
import { calcTipRadii } from "../util/tipRadiusHelpers";
import { strainNameToIdx, calculateVisiblityAndBranchThickness } from "../util/treeVisibilityHelpers";
import * as types from "./types";
import { updateEntropyVisibility } from "./entropy";
import { updateFrequencyDataDebounced } from "./frequencies";
import { calendarToNumeric } from "../util/dateHelpers";
import { applyToChildren } from "../components/tree/phyloTree/helpers";
import { constructVisibleTipLookupBetweenTrees } from "../util/treeTangleHelpers";
import { createVisibleLegendValues, getLegendOrder } from "../util/colorScale";
import { getTraitFromNode } from "../util/treeMiscHelpers";
import { warningNotification } from "./notifications";
import { calcFullTipCounts, calcTipCounts } from "../util/treeCountingHelpers";
import { PhyloNode } from "../components/tree/phyloTree/types";
import { Metadata } from "../metadata";
import { ThunkFunction } from "../store";
import { ReduxNode, TreeState } from "../reducers/tree/types";

type RootIndex = number | undefined

/** [root idx tree1, root idx tree2] */
export type Root = [RootIndex, RootIndex]

/**
 * Updates the `inView` property of nodes which depends on the currently selected
 * root index (i.e. what node the tree is zoomed into).
 * Note that this property is historically the remit of PhyloTree, however this function
 * may be called before those objects are created; in this case we store the property on
 * the tree node itself.
 */
export const applyInViewNodesToTree = (
  /** index of displayed root node */
  idx: RootIndex,

  tree: TreeState,
): number => {
  const validIdxRoot = idx !== undefined ? idx : tree.idxOfInViewRootNode;
  if (tree.nodes[0].shell) {
    tree.nodes.forEach((d) => {
      d.shell.inView = false;
      d.shell.update = true;
    });
    if (tree.nodes[validIdxRoot].hasChildren) {
      applyToChildren(tree.nodes[validIdxRoot].shell, (d: PhyloNode) => {d.inView = true;});
    } else if (tree.nodes[validIdxRoot].parent.arrayIdx===0) {
      // subtree with n=1 tips => don't make the parent in-view as this will cover the entire tree!
      tree.nodes[validIdxRoot].shell.inView = true;
    } else {
      applyToChildren(tree.nodes[validIdxRoot].parent.shell, (d: PhyloNode) => {d.inView = true;});
    }
  } else {
    /* FYI applyInViewNodesToTree is now setting inView on the redux nodes */
    tree.nodes.forEach((d) => {
      d.inView = false;
    });
    /* note that we cannot use `applyToChildren` as that operates on PhyloNodes */
    const _markChildrenInView = (node: ReduxNode) => {
      node.inView = true;
      if (node.children) {
        for (const child of node.children) _markChildrenInView(child);
      }
    };
    const startingNode = tree.nodes[validIdxRoot].hasChildren ? tree.nodes[validIdxRoot] : tree.nodes[validIdxRoot].parent;
    _markChildrenInView(startingNode);
  }

  return validIdxRoot;
};

/**
 * define the visible branches and their thicknesses. This could be a path to a single tip or a selected clade.
 * filtering etc will "turn off" branches, etc etc
 * this fn relies on the "inView" attr of nodes
 * note that this function checks to see if the tree has been defined (different to if it's ready / loaded!)
 * for arg destructuring see https://simonsmith.io/destructuring-objects-as-function-parameters-in-es6/
 */
export const updateVisibleTipsAndBranchThicknesses = ({
  root = [undefined, undefined],
  cladeSelected = undefined,
}: {
  /**
   * Change the in-view part of the tree.
   *
   * [0, 0]: reset. [undefined, undefined]: do nothing
   */
  root?: Root

  cladeSelected?: string
} = {}
): ThunkFunction => {
  return (dispatch, getState) => {
    const { tree, treeToo, controls, frequencies } = getState();
    if (root[0] === undefined && !cladeSelected && tree.selectedClade) {
      /* if not resetting tree to root, maintain previous selectedClade if one exists */
      cladeSelected = tree.selectedClade;
    }

    if (!tree.nodes) {return;}
    // console.log("ROOT SETTING TO", root)
    /* mark nodes as "in view" as applicable */
    const rootIdxTree1 = applyInViewNodesToTree(root[0], tree);

    const data = calculateVisiblityAndBranchThickness(
      tree,
      controls,
      {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric}
    );
    const dispatchObj: AnyAction = {
      type: types.UPDATE_VISIBILITY_AND_BRANCH_THICKNESS,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion,
      idxOfInViewRootNode: rootIdxTree1,
      idxOfFilteredRoot: data.idxOfFilteredRoot,
      cladeName: cladeSelected,
      selectedClade: cladeSelected,
    };

    if (controls.showTreeToo) {
      const rootIdxTree2 = applyInViewNodesToTree(root[1], treeToo);
      const dataToo = calculateVisiblityAndBranchThickness(
        treeToo,
        controls,
        {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric},
        // {tipSelectedIdx: tipIdx2}
      );
      dispatchObj.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, data.visibility, dataToo.visibility);
      dispatchObj.visibilityToo = dataToo.visibility;
      dispatchObj.visibilityVersionToo = dataToo.visibilityVersion;
      dispatchObj.branchThicknessToo = dataToo.branchThickness;
      dispatchObj.branchThicknessVersionToo = dataToo.branchThicknessVersion;
      dispatchObj.idxOfInViewRootNodeToo = rootIdxTree2;
      dispatchObj.idxOfFilteredRootToo = dataToo.idxOfFilteredRoot;
      /* tip selected is the same as the first tree - the reducer uses that */
    }

    /* Changes in visibility require a recomputation of which legend items we wish to display */
    dispatchObj.visibleLegendValues = createVisibleLegendValues({
      colorBy: controls.colorBy,
      genotype: controls.colorScale.genotype,
      scaleType: controls.colorScale.scaleType,
      legendValues: controls.colorScale.legendValues,
      treeNodes: tree.nodes,
      treeTooNodes: treeToo ? treeToo.nodes : undefined,
      visibility: dispatchObj.visibility,
      visibilityToo: dispatchObj.visibilityToo
    });

    /* D I S P A T C H */
    dispatch(dispatchObj);
    updateEntropyVisibility(dispatch, getState);
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }
  };
};

/**
 * date changes need to update tip visibility & branch thicknesses
 * this can be done in a single action
 * NB calling this without specifying newMin OR newMax is a no-op
 * side-effects: a single action
 */
export const changeDateFilter = ({
  newMin = false,
  newMax = false,
  quickdraw = false,
}: {
  newMin?: string | false
  newMax?: string | false
  quickdraw?: boolean
}): ThunkFunction => {
  return (dispatch, getState) => {
    const { tree, treeToo, controls, frequencies } = getState();
    if (!tree.nodes) {return;}
    const dates = {
      dateMinNumeric: newMin ? calendarToNumeric(newMin) : controls.dateMinNumeric,
      dateMaxNumeric: newMax ? calendarToNumeric(newMax) : controls.dateMaxNumeric
    };
    const data = calculateVisiblityAndBranchThickness(tree, controls, dates);
    const dispatchObj: AnyAction = {
      type: types.CHANGE_DATES_VISIBILITY_THICKNESS,
      quickdraw,
      dateMin: newMin ? newMin : controls.dateMin,
      dateMax: newMax ? newMax : controls.dateMax,
      dateMinNumeric: dates.dateMinNumeric,
      dateMaxNumeric: dates.dateMaxNumeric,
      visibility: data.visibility,
      visibilityVersion: data.visibilityVersion,
      branchThickness: data.branchThickness,
      branchThicknessVersion: data.branchThicknessVersion,
      idxOfInViewRootNode: tree.idxOfInViewRootNode,
    };
    if (controls.showTreeToo) {
      const dataToo = calculateVisiblityAndBranchThickness(treeToo, controls, dates);
      dispatchObj.tangleTipLookup = constructVisibleTipLookupBetweenTrees(tree.nodes, treeToo.nodes, data.visibility, dataToo.visibility);
      dispatchObj.visibilityToo = dataToo.visibility;
      dispatchObj.visibilityVersionToo = dataToo.visibilityVersion;
      dispatchObj.branchThicknessToo = dataToo.branchThickness;
      dispatchObj.branchThicknessVersionToo = dataToo.branchThicknessVersion;
    }

    /* Changes in visibility require a recomputation of which legend items we wish to display */
    dispatchObj.visibleLegendValues = createVisibleLegendValues({
      colorBy: controls.colorBy,
      scaleType: controls.colorScale.scaleType,
      genotype: controls.colorScale.genotype,
      legendValues: controls.colorScale.legendValues,
      treeNodes: tree.nodes,
      treeTooNodes: treeToo ? treeToo.nodes : undefined,
      visibility: dispatchObj.visibility,
      visibilityToo: dispatchObj.visibilityToo
    });

    /* D I S P A T C H */
    dispatch(dispatchObj);
    updateEntropyVisibility(dispatch, getState);
    if (frequencies.loaded) {
      updateFrequencyDataDebounced(dispatch, getState);
    }
  };
};

/**
 * NB all params are optional - supplying none resets the tip radii to defaults
 * side-effects: a single action
 */
export const updateTipRadii = (
  {
    tipSelectedIdx = false,
    selectedLegendItem = false,
    geoFilter = [],
  }: {
    /** the strain to highlight (always tree 1) */
    tipSelectedIdx?: number | false,

    /** value of the attr. if scale is continuous a bound will be used. */
    selectedLegendItem?: string | number | false,

    /** a filter to apply to the strains. Empty array or array of len 2. [0]: geoResolution, [1]: value to filter to */
    geoFilter?: [string, string] | [],
  } = {}
): ThunkFunction => {
  return (dispatch, getState) => {
    const { controls, tree, treeToo } = getState();
    const colorScale = controls.colorScale;
    const d: AnyAction = {
      type: types.UPDATE_TIP_RADII, version: tree.tipRadiiVersion + 1
    };
    const tt = controls.showTreeToo;
    if (tipSelectedIdx) {
      d.data = calcTipRadii({tipSelectedIdx, colorScale, tree});
      if (tt) {
        const idx = strainNameToIdx(treeToo.nodes, tree.nodes[tipSelectedIdx].name);
        d.dataToo = calcTipRadii({tipSelectedIdx: idx, colorScale, tree: treeToo});
      }
    } else {
      d.data = calcTipRadii({selectedLegendItem, geoFilter, colorScale, tree});
      if (tt) d.dataToo = calcTipRadii({selectedLegendItem, geoFilter, colorScale, tree: treeToo});
    }
    dispatch(d);
  };
};

/**
 * Apply a filter to the current selection (i.e. filtered / "on" values associated with this trait)
 */
export const applyFilter = (
  /** Explanation of the modes:
   *  - "add" -> add the values to the current selection (if any exists).
   *  - "inactivate" -> inactivate values (i.e. change active prop to false). To activate just use "add".
   *  - "remove" -> remove the values from the current selection
   *  - "set"  -> set the values of the filter to be those provided. All disabled filters will be removed. XXX TODO.
   */
  mode: "add" | "inactivate" | "remove" | "set",

  /** the trait name of the filter ("authors", "country" etcetera) */
  trait: string | symbol,

  /** the values (see above) */
  values: string[],
): ThunkFunction => {
  return (dispatch, getState) => {
    const { controls } = getState();
    const currentlyFilteredTraits = Reflect.ownKeys(controls.filters);
    let newValues;
    switch (mode) {
      case "set":
        newValues = values.map((value) => ({value, active: true}));
        break;
      case "add":
        if (currentlyFilteredTraits.indexOf(trait) === -1) {
          newValues = values.map((value) => ({value, active: true}));
        } else {
          newValues = controls.filters[trait].slice();
          const currentItemNames = newValues.map((i) => i.value);
          values.forEach((valueToAdd) => {
            const idx = currentItemNames.indexOf(valueToAdd);
            if (idx === -1) {
              newValues.push({value: valueToAdd, active: true});
            } else {
              /* it's already there, ensure it's active */
              newValues[idx].active = true;
            }
          });
        }
        break;
      case "remove": // fallthrough
      case "inactivate": {
        if (currentlyFilteredTraits.indexOf(trait) === -1) {
          console.error(`trying to ${mode} values from an un-initialised filter!`);
          return;
        }
        newValues = controls.filters[trait].map((f) => ({...f}));
        const currentItemNames = newValues.map((i) => i.value);
        for (const item of values) {
          const idx = currentItemNames.indexOf(item);
          if (idx !== -1) {
            if (mode==="remove") {
              newValues.splice(idx, 1);
            } else {
              newValues[idx].active = false;
            }
          } else {
            console.error(`trying to ${mode} filter value ${item} which was not part of the filter selection`);
          }
        }
        break;
      }
      default:
        console.error(`applyFilter called with invalid mode: ${mode}`);
        return; // don't dispatch
    }
    dispatch({type: types.APPLY_FILTER, trait, values: newValues});
    dispatch(updateVisibleTipsAndBranchThicknesses());
  };
};

export const toggleTemporalConfidence = (): AnyAction => ({
  type: types.TOGGLE_TEMPORAL_CONF
});


/**
 * restore original state by iterating over all nodes and restoring children to unexplodedChildren (as necessary)
 */
const _resetExpodedTree = (nodes: ReduxNode[]): void => {
  nodes.forEach((n) => {
    if (Object.prototype.hasOwnProperty.call(n, 'unexplodedChildren')) {
      n.children = n.unexplodedChildren;
      n.hasChildren = true;
      delete n.unexplodedChildren;
      for (const child of n.children) {
        child.parent = n;
      }
    }
  });
};

/**
 * Recursive function which traverses the tree modifying parent -> child links in order to
 * create subtrees where branches have different attrs.
 * Note: because the children of a node may change, we store the previous (unexploded) children
 * as `unexplodedChildren` so we can return to the original tree.
 */
const _traverseAndCreateSubtrees = (
  /** root node of entire tree */
  root: ReduxNode,

  /** current node being traversed */
  node: ReduxNode,

  /** trait name to determine if a child should become subtree */
  attr: string,
): void => {
  // store original children so we traverse the entire tree
  const originalChildren = node.hasChildren ? [...node.children] : [];

  if (node.arrayIdx === 0) { // __ROOT will hold all (exploded) subtrees
    node.unexplodedChildren = originalChildren;
  } else if (node.hasChildren) {
    const parentTrait = getTraitFromNode(node, attr);
    const childrenToPrune = node.children
      .map((c) => getTraitFromNode(c, attr))
      .map((childTrait, idx) => (childTrait!==parentTrait) ? idx : undefined)
      .filter((v) => v!==undefined);
    if (childrenToPrune.length) {
      childrenToPrune.forEach((idx) => {
        const subtreeRootNode = node.children[idx];
        root.children.push(subtreeRootNode);
        subtreeRootNode.parent = root;
      });
      node.unexplodedChildren = originalChildren;
      node.children = node.children.filter((_c, idx) => {
        return !childrenToPrune.includes(idx);
      });
      /* it may be the case that the node now has no children (they're all subtrees!) */
      if (node.children.length===0) {
        node.hasChildren = false;
      }
    }
  }
  for (const originalChild of originalChildren) { // this may jump into subtrees
    _traverseAndCreateSubtrees(root, originalChild, attr);
  }
};

/**
 * sort the subtrees by the order the trait would appear in the legend
 */
const _orderSubtrees = (
  metadata: Metadata,
  nodes: ReduxNode[],
  attr: string,
): void => {
  const attrValueOrder = getLegendOrder(attr, metadata.colorings[attr], nodes, undefined);
  nodes[0].children.sort((childA, childB) => {
    const [attrA, attrB] = [getTraitFromNode(childA, attr), getTraitFromNode(childB, attr)];
    if (attrValueOrder.length) {
      const [idxA, idxB] = [attrValueOrder.indexOf(attrA), attrValueOrder.indexOf(attrB)];
      if (idxA===-1 && idxB===-1) return -1; // neither in legend => preserve order
      if (idxB===-1) return -1;              // childA in legend, childB not => sort A before B
      if (idxA < idxB) return -1;            // childA before childB => sort a before b
      if (idxA > idxB) return 1;             // and vice versa
      return 0;
    }
    // fallthrough, if there's no available legend order, is to simply sort alphabetically
    return attrA > attrB ? -1 : 1;
  });
};

export const explodeTree = (
  attr: string | undefined,
): ThunkFunction => {
  return (dispatch, getState) => {
    const {tree, metadata, controls} = getState();
    _resetExpodedTree(tree.nodes); // ensure we start with an unexploded tree
    if (attr) {
      const root = tree.nodes[0];
      _traverseAndCreateSubtrees(root, root, attr);
      if (root.unexplodedChildren.length === root.children.length) {
        dispatch(warningNotification({message: "Cannot explode tree on this trait - is it defined on internal nodes?"}));
        return;
      }
      _orderSubtrees(metadata, tree.nodes, attr);
    }
    /* tree splitting necessitates recalculation of tip counts */
    calcFullTipCounts(tree.nodes[0]);
    calcTipCounts(tree.nodes[0], tree.visibility);
    /* we default to zooming out completely whenever we explode the tree. There are nicer behaviours here,
    such as re-calculating the MRCA of visible nodes, but this comes at the cost of increased complexity.
    Note that the functions called here involve a lot of code duplication and are good targets for refactoring */
    applyInViewNodesToTree(0, tree);
    const visData = calculateVisiblityAndBranchThickness(
      tree,
      controls,
      {dateMinNumeric: controls.dateMinNumeric, dateMaxNumeric: controls.dateMaxNumeric}
    );
    visData.idxOfInViewRootNode = 0;
    /* Changes in visibility require a recomputation of which legend items we wish to display */
    visData.visibleLegendValues = createVisibleLegendValues({
      colorBy: controls.colorBy,
      genotype: controls.colorScale.genotype,
      scaleType: controls.colorScale.scaleType,
      legendValues: controls.colorScale.legendValues,
      treeNodes: tree.nodes,
      visibility: visData.visibility
    });
    dispatch({
      type: types.CHANGE_EXPLODE_ATTR,
      explodeAttr: attr,
      ...visData
    });
  };
};
