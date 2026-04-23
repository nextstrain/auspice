import { AppDispatch, RootState } from "../../store";
import { UPDATE_METADATA } from "../types";
import { NewMetadata, ColoringInfo } from "./updateMetadata.types";
import { changeColorBy } from "../colors";
import { ControlsState } from "../../reducers/controls";

/**
 * A redux thunk action to update node attributes and related data. The newMetadata
 * has not been cross-referenced with Redux state and so this thunk does that work,
 * dispatching notifications as needed. The resulting dispatched action contains
 * validated data which the reducers can simply merge into state.
 */
export const updateMetadata = (newMetadata: NewMetadata) => {
  return (dispatch: AppDispatch, getState: () => RootState): true | string => {
    // console.log("ACTION::updateMetadata. STATE", getState(), "newMetadata", newMetadata)
    const existingState = getState();

    // Figure out new redux state for certain reducers ("fat actions" pattern)
    const nodeAttrUpdates = _collectNodeAttrs(newMetadata.attributes || {});
    console.log(nodeAttrUpdates)

    const action = {
      type: UPDATE_METADATA,
      ...newMetadata, // TODO XXX
      metadata: _reduxMetadata(newMetadata, existingState.metadata),
      controls: _reduxControls(newMetadata, existingState.controls),
      nodeAttrUpdates
    }

    /* currently the only usage of `updateMetadata` guarantees that each geographic
    trait key (name) is a new colouring, but as usage is expanded we should check this here */
    dispatch(action)

    /** If the dataset didn't have any colorings, but now does, then switch to the first one
     * (very common in auspice.us)
     */
    const colorOpts = getState().controls.coloringsPresentOnTree;
    if (!existingState.controls.coloringsPresentOnTree.size && colorOpts.size) {
      dispatch(changeColorBy([...colorOpts][0]));
    }

    return true;
  }
}


/**
 * TODO XXX
 * Return an object representing updates to the existing redux **state** which the reducer
 * can simply merge in.
 */
function _reduxControls(newMetadata: NewMetadata, state: ControlsState): Record<string,any> {
  const updates: Record<string, any> = {};

  /* colorings first (auspice assumes all attrs are colorings) */
  if (newMetadata.attributes) {
    const coloringsPresentOnTree = (new Set(state.coloringsPresentOnTree))
      .union(new Set(Object.keys(newMetadata.attributes)));
    updates.coloringsPresentOnTree = coloringsPresentOnTree;
  }

  /* geographic resolutions */
  if (newMetadata.geographic && !state.panelsAvailable.includes("map")) {
    console.log("TODO XXX")
    // newState = {
    //   ...newState,
    //   geoResolution: action.newGeoResolution.key,
    //   canTogglePanelLayout: hasMultipleGridPanels([...state.panelsToDisplay, "map"]),
    //   panelsAvailable: [...state.panelsAvailable, "map"],
    //   panelsToDisplay: [...state.panelsToDisplay, "map"]
    // };
  }

  return updates;
}



/**
 * TODO XXX
 * Return an object representing updates to the existing redux **state** which the reducer
 * can simply merge in.
 */
function _reduxMetadata(newMetadata: NewMetadata, state: Record<string,any>): Record<string,any> {
  const updates: Record<string,any> = { colorings: { ...state.colorings } };
  Object.values(newMetadata.attributes).forEach((attrInfo) => _mergeAttr(updates.colorings, attrInfo));
  if (newMetadata.geographic) {
    // todo: cover case where we merge / update existing deme
    updates.geoResolutions = [ ...(state.geoResolutions || []), ...newMetadata.geographic ];
  }
  return updates;
}


/**
 * Merge an attribute (type: `ColoringInfo`) into colorings state
 * TODO XXX - fn was copy pasted from reducer
 */
function _mergeAttr(colorings: Record<string,any>, attrInfo: ColoringInfo): void {
  const key = attrInfo.key;

  const replace = !Object.hasOwn(colorings, key) ||
    attrInfo.scaleType !== colorings[key].type;

  if (replace) {
    colorings[key] = {
      title: attrInfo.name,
      type: attrInfo.scaleType,
      scale: Object.keys(attrInfo.colours).length ? Object.entries(attrInfo.colours) : undefined,
    }
  } else {
    colorings[key] = { ...colorings[key] };
    colorings[key].title = attrInfo.name;
    const scaleDict = {
      ...Object.fromEntries(colorings[key].scale || []),
      ...(attrInfo.colours || {})
    }
    colorings[key].scale = Object.entries(scaleDict);
  }
}

function _collectNodeAttrs(attributes: NewMetadata['attributes']) {
  const nodeAttrUpdates = {}
  for (const [attrKey, attrInfo] of Object.entries(attributes)) {
    for (const [strainName, nodeAttr] of Object.entries(attrInfo.strains || {})) {
      if (!nodeAttrUpdates[strainName]) nodeAttrUpdates[strainName] = {}
      nodeAttrUpdates[strainName][attrKey] = nodeAttr;
    }
  }
  return nodeAttrUpdates;
}
