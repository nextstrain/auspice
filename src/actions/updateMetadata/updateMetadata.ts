import { AppDispatch, RootState } from "../../store";
import { UPDATE_METADATA } from "../types";
import { NewMetadata } from "./updateMetadata.types";
import { changeColorBy } from "../colors";
/**
 * A redux thunk action to update node attributes and related data. The newMetadata
 * has not been cross-referenced with Redux state and so this thunk does that work,
 * dispatching notifications as needed. The resulting dispatched action contains
 * validated data which the reducers can simply merge into state.
 */
export const updateMetadata = (newMetadata: NewMetadata) => {
  return (dispatch: AppDispatch, getState: () => RootState): true | string => {
    // console.log("ACTION::updateMetadata. STATE", getState(), "newMetadata", newMetadata)
    const { controls } = getState();

    /* currently the only usage of `updateMetadata` guarantees that each geographic
    trait key (name) is a new colouring, but as usage is expanded we should check this here */
    dispatch({ type: UPDATE_METADATA, ...newMetadata, })

    /** If the dataset didn't have any colorings, but now does, then switch to the first one
     * (very common in auspice.us)
     */
    const colorOpts = getState().controls.coloringsPresentOnTree;
    if (!controls.coloringsPresentOnTree.size && colorOpts.size) {
      dispatch(changeColorBy([...colorOpts][0]));
    }

    return true;
  }
}
