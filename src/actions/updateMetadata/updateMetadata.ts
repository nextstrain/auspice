import { successNotification, warningNotification } from "../notifications";
import { AppDispatch, RootState } from "../../store";
import { UPDATE_METADATA } from "../types";
import { NewMetadata } from "./updateMetadata.types";

/**
 * A redux thunk action to update node attributes and related data. The newMetadata
 * has not been cross-referenced with Redux state and so this thunk does that work,
 * dispatching notifications as needed. The resulting dispatched action contains
 * validated data which the reducers can simply merge into state.
 */
export const updateMetadata = (newMetadata: NewMetadata) => {
  return (dispatch: AppDispatch, getState: () => RootState): void => {
    console.log("ACTION::updateMetadata. STATE", getState(), "newMetadata", newMetadata)
    /* filter the attributes to _new_ ones, i.e. those not on the tree */
    filterAttrs(newMetadata, dispatch);

    /* currently the only usage of `updateMetadata` guarantees that each geographic
    trait key (name) is a new colouring, but as usage is expanded we should check this here */

    dispatch({type: UPDATE_METADATA, ...newMetadata,})
    dispatch(successNotification({
      message: `Adding metadata from ${newMetadata.info?.fileName}`,
      details: `n = ${Object.keys(newMetadata.attributes).length} fields(s)`,
    }));
  }
}

/**
 * Filters the attributes (i.e. coloring names) to exclude empty structs
 * TODO: shift to the file parsing code
 */
function filterAttrs(
  newMetadata: NewMetadata,
  dispatch: AppDispatch
): void {
  // find empty attrs, those with no valid values
  const emptyAttrs: Set<string> = new Set(
    Object.entries(newMetadata.attributes)
      .filter(([_key, attrInfo]) => Object.keys(attrInfo.strains).length === 0)
      .map(([key, _attrInfo]) => key)
  );

  const colsToRemove = emptyAttrs;

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
