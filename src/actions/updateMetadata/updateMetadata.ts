import { successNotification, warningNotification } from "../notifications";
import { AppDispatch, RootState } from "../../store";
import { ADD_EXTRA_METADATA } from "../types";
import { NewMetadata } from "./updateMetadata.types";
import { NodeAttr } from "../../reducers/tree/types";

/**
 * A redux thunk action to update node attributes and related data. The newMetadata
 * has not been cross-referenced with Redux state and so this thunk does that work,
 * dispatching notifications as needed. The resulting dispatched action contains
 * validated data which the reducers can simply merge into state.
 */
export const updateMetadata = (newMetadata: NewMetadata) => {
  return (dispatch: AppDispatch, getState: () => RootState): void => {
    console.log("ACTION::updateMetadata. STATE", getState(), "newMetadata", newMetadata)
    const { controls } = getState();
    /* filter the attributes to _new_ ones, i.e. those not on the tree */
    filterAttrs(newMetadata, controls.coloringsPresentOnTree, dispatch);

    // I think we want a different action structure, but for now let's reuse the existing one
    const action = convertToActionStructure(newMetadata)
    console.log("ACTION::updateMetadata dispatching:", action)
    dispatch(action);
    dispatch(successNotification({
      message: `Adding metadata from ${newMetadata.info?.fileName}`,
      details: `${Object.keys(action.newColorings).length} new coloring${Object.keys(action.newColorings).length > 1 ? "s" : ""} for ${Object.keys(action.newNodeAttrs).length} node${Object.keys(action.newNodeAttrs).length > 1 ? "s" : ""}`
    }));
  }
}

/**
 * Filters the attributes (i.e. coloring names) to exclude those already present on the tree.
 * In the future this should be relaxed and instead merge incoming data with existing data.
 */
function filterAttrs(
  newMetadata: NewMetadata,
  coloringsPresentOnTree: RootState['controls']['coloringsPresentOnTree'],
  dispatch: AppDispatch
): void {
  const existingAttrs = coloringsPresentOnTree.intersection(new Set(Object.keys(newMetadata.attributes)));

  // find empty attrs, those with no valid values
  const emptyAttrs: Set<string> = new Set(
    Object.entries(newMetadata.attributes)
      .filter(([_key, attrInfo]) => Object.keys(attrInfo.strains).length === 0)
      .map(([key, _attrInfo]) => key)
  );

  const colsToRemove = existingAttrs.union(emptyAttrs);

  if (colsToRemove.size) {
    newMetadata.attributes = Object.fromEntries(
      Object.entries(newMetadata.attributes)
        .filter(([attrName, _info]) => !colsToRemove.has(attrName))
    )
  }

  if (colsToRemove.size || newMetadata.info?.ignoredAttrNames?.size) {
    const cols = colsToRemove.union(newMetadata.info?.ignoredAttrNames || new Set());
    dispatch(warningNotification({
      message: `Ignoring ${cols.size} columns as they are already set as colorings, contain no valid values, or are "special" cases to be ignored`,
      details: [...cols].join(", ")
    }));
  }
}

interface ColorInfo {
  title: string;
  type: string;
  /** elements are [traitValue, hex]. Leave undefined for Auspice to create one */
  scale?: [string, string][]
}
interface AddExtraMetadata {
  type: typeof ADD_EXTRA_METADATA;

  /** newNodeAttrs[strain][traitName] = {value: traitValue}; */
  newNodeAttrs: Record<string, Record<string, NodeAttr>>;

  /** newColorings keys are traitName */
  newColorings: Record<string, ColorInfo>

  newGeoResolution: NewMetadata['geographic'];
}

/**
 * temporary
 */
function convertToActionStructure(newMetadata: NewMetadata): AddExtraMetadata {
  const newNodeAttrs: AddExtraMetadata['newNodeAttrs'] = {};
  const newColorings: AddExtraMetadata['newColorings'] = {};
  for (const [traitName, info] of Object.entries(newMetadata.attributes)) {
    for (const [strain, nodeAttr] of Object.entries(info.strains)) {
      if (!newNodeAttrs[strain]) newNodeAttrs[strain] = {}
      newNodeAttrs[strain][traitName] = nodeAttr;
    }
    newColorings[traitName] = {
      title: info.name,
      type: info.scaleType,
      scale: Object.keys(info.colours).length ? Object.entries(info.colours) : undefined,
    }
  }
  return {
    type: ADD_EXTRA_METADATA,
    newNodeAttrs,
    newColorings,
    newGeoResolution: newMetadata.geographic,
  }
}
