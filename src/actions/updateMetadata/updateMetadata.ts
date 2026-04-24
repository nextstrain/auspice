import { AppDispatch, RootState } from "../../store";
import { UPDATE_METADATA } from "../types";
import { hasMultipleGridPanels } from "../panelDisplay";
import { SPECIAL_CASED_NODE_ATTRS } from "../../reducers/tree/types";
import type{ ControlsState } from "../../reducers/controls";
import type { TreeState, NodeAttr} from "../../reducers/tree/types";
import type { UpdateMetadataAction, NewMetadata, AttrDetails } from "./updateMetadata.types";
import { changeColorBy } from "../colors";

export const SUCCESS = "SUCCESS";

/**
 * A redux thunk action to update node attributes and related data. The newMetadata
 * has not been cross-referenced with Redux state and so this thunk does that work,
 * dispatching notifications as needed. The resulting dispatched action contains
 * validated data which the reducers can simply merge into state.
 */
export const updateMetadata = (
  newMetadata: NewMetadata,
  /** Replace redux state where possible, rather than merge */
  replace = false,
  /** Expect tree updates, only returns SUCCESS when tree is updated */
  treeUpdates = true,
) => {
  return (dispatch: AppDispatch, getState: () => RootState): string => {
    const existingState = getState();

    // Compute new redux state data for relevant reducers ("fat actions" pattern)
    let tree: UpdateMetadataAction["tree"] | undefined;
    if (treeUpdates) {
      tree = _reduxTree(existingState.tree, newMetadata.attributes || {}, replace);
      if (tree===undefined) {
        return "No matching nodes in tree!";
      }
    }
    const treeToo = _reduxTree(existingState.treeToo, newMetadata.attributes || {}, replace) || existingState.treeToo;
    const metadata = _reduxMetadata(existingState.metadata, newMetadata, tree || existingState.tree, replace);
    const controls = _reduxControls(existingState.controls, newMetadata);

    dispatch({ type: UPDATE_METADATA, tree, treeToo, metadata, controls })

    // If the dataset didn't have any colorings, but now does, then switch to the first one
    // (very common in auspice.us)
    const colorsNowAvailable = getState().controls.coloringsPresentOnTree;
    if (!existingState.controls.coloringsPresentOnTree.size && colorsNowAvailable.size) {
      dispatch(changeColorBy([...colorsNowAvailable][0]));
    }

    return SUCCESS;
  }
}

/**
 * Compute data to be easily merged into the tree reducer(s)
 * Returns undefined if there's no state updates to make (either because the incoming data
 * doesn't update the tree state or the (second tree's) tree state is empty)
 *
 * NOTE: there is an out-of-sync bug lurking here: if you are filtering to (e.g.) country=X
 * and the **NewMetadata** updates these values, the filters won't update. Specifically,
 * the value count in the filter badge _will_ update (via updated `totalStateCounts` state)
 * but the actual tree visibility won't.
 */
function _reduxTree(
  tree: TreeState,
  attributes: NewMetadata['attributes'],
  /** each supplied attribute will become the tree's attr values - no existing data will be preserved */
  replace: boolean,
): UpdateMetadataAction['tree'] | undefined {

  const attrsWithUpdates: string[] = Object.entries(attributes)
    .flatMap(([k, v]) => Object.keys(v.strains).length ? k : [])
    .filter((k) => !SPECIAL_CASED_NODE_ATTRS.has(k));

  if (!attrsWithUpdates.length || tree.nodes === null) return undefined;

  const attrsNonContinuous: Set<string> = new Set(attrsWithUpdates
    .filter((attrName) => attributes[attrName].scaleType !== 'continuous'));

  /* Compute updated nodeAttrs for all nodes for all node attr keys which have updates.
   * While we do this, count all observed terminal values (similar to `countTraitsAcrossTree`)
   * for non-continuous traits.
   */
  const counts: Record<string, Map<string, number>> = {};
  const nodeAttrs = Object.fromEntries(
    tree.nodes.map((node) => {
      const name = node.name;
      const nodeAttrs = Object.fromEntries(
        attrsWithUpdates.map((attrName) => {
          // attr data may be (i) new data, (ii) existing data, (iii) undefined
          // re: type assertion -- above we restrict attrsWithUpdates to always represent "normal" NodeAttr types
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const attrData = (
            replace ?
              (attributes[attrName].strains[name] || undefined) :
              (attributes[attrName].strains[name] || node.node_attrs[attrName])
          ) as (NodeAttr | undefined);
          const value = attrData?.value;
          if (!node.hasChildren && value && attrsNonContinuous.has(attrName)) {
            if (!counts[attrName]) counts[attrName] = new Map();
            counts[attrName].set(String(value), (counts[attrName].get(String(value)) || 0) + 1);
          }
          return [attrName, attrData];
        })
      );
      return [name, nodeAttrs]
    })
  );

  return {
    nodeAttrs,
    nodeAttrKeys: new Set([...tree.nodeAttrKeys, ...attrsWithUpdates]),
    totalStateCounts: {...tree.totalStateCounts, ...counts},
  }

}

/**
 * Return an object representing updates to the existing redux controls **state** which
 * the reducer can simply merge in.
 */
function _reduxControls(
  state: ControlsState,
  newMetadata: NewMetadata
): UpdateMetadataAction['controls'] {
  const updates: UpdateMetadataAction['controls'] = {};

  /* colorings first (auspice assumes all attrs are colorings) */
  if (newMetadata.attributes) {
    const coloringsPresentOnTree = (new Set(state.coloringsPresentOnTree))
      .union(new Set(Object.keys(newMetadata.attributes)));
    updates.coloringsPresentOnTree = coloringsPresentOnTree;
  }

  /* geographic resolutions */
  if (newMetadata.geographic?.length && !state.panelsAvailable.includes("map")) {
    updates.panelsAvailable = [...state.panelsAvailable, "map"],
    updates.panelsToDisplay = [...updates.panelsAvailable];
    updates.canTogglePanelLayout = hasMultipleGridPanels(updates.panelsAvailable);
    updates.geoResolution = newMetadata.geographic[0].key;
  }

  return updates;
}


/**
 * Return an object representing updates to the existing redux **state** which the reducer
 * can simply merge in.
 * NOTE: metadata redux state is untyped
 */
function _reduxMetadata(
  state: Record<string, any>,
  newMetadata: NewMetadata,
  tree: UpdateMetadataAction['tree'] | TreeState,
  /** replace color scales entirely rather than attempt to merge in new colors */
  replace: boolean
): UpdateMetadataAction['metadata'] {

  const { attributes, geographic, ...actionMetadata } = newMetadata;

  const colorings = attributes ? Object.fromEntries([
    // First update existing colorings
    ...Object.entries(state.colorings)
      .map(([key, value]) => {
        // The redux state values are untyped, so for now assume they are the expected shape
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const oldColoring = value as UpdateMetadataAction['metadata']['colorings'][string];
        const coloring = Object.hasOwn(attributes, key) ?
          _updateColoring(oldColoring, attributes[key], tree.totalStateCounts[key], replace) :
          oldColoring;
        return [key, coloring]
      }),
    // Then add entirely new colorings
    ...Object.keys(attributes)
      .filter((key) => !Object.hasOwn(state.colorings, key))
      .map((key) => [key, _updateColoring(undefined, attributes[key], tree.totalStateCounts[key], undefined)])
  ]) : {};


  /* currently the only usage of `updateMetadata` guarantees that each geographic
  trait key (name) is also a coloring, but as usage is expanded we should check this */
  const geoResolutions = geographic?.length &&
    [...(state.geoResolutions || []), ...geographic];

  return {
    ...actionMetadata,
    ...(Object.keys(colorings).length && { colorings }),
    ...(geoResolutions && { geoResolutions }),
  }
}


/**
 * Return coloring object (for a specific attr), with new coloring info **attrDetails**
 * either merged in or replacing wholesale the original coloring **state**
 */
function _updateColoring(
  state: UpdateMetadataAction['metadata']['colorings'][string],
  attrDetails: AttrDetails,
  stateCounts: undefined | Map<string, number>,
  replace: boolean
): UpdateMetadataAction['metadata']['colorings'][string] {
  replace = replace || state === undefined;
  if (!replace && (state.type !== attrDetails.scaleType || state.type !== 'categorical')) {
    console.warn(`Merging scale colors is only possible for categorical scales`)
    replace = true;
  }

  if (replace) {
    if (attrDetails.scaleType === 'continuous') {
      return {
        title: attrDetails.name,
        type: attrDetails.scaleType,
        ...(attrDetails.colors?.length && { scale: attrDetails.colors.filter((d): d is [number, string] => typeof d[0] === 'number') }),
      }
    }
    return {
      title: attrDetails.name,
      type: attrDetails.scaleType,
      ...(attrDetails.colors?.length && { scale: attrDetails.colors.filter((d): d is [string, string] => typeof d[0] === 'string') }),
    }
  }

  // Following lets TypeScript see the narrowing of the scale type
  if (state.type === 'continuous') {
    throw new Error('Unreachable: merge path only handles categorical scales');
  }

  const updatedScale: [string, string][] = Object.entries({
    // existing scale pairs, less any values which no longer exist on the tree
    ...Object.fromEntries(
      (state.scale || [])
        .filter(([value,]) => stateCounts?.get(value) > 0)
    ),
    // plus new value-color pairs
    ...Object.fromEntries(attrDetails.colors || []),
  })

  return {
    ...state,
    title: attrDetails.name,
    ...(updatedScale.length && {scale: updatedScale})
  }
}
