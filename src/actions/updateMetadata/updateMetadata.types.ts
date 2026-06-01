import { TreeState, NodeAttr } from "../../reducers/tree/types";
import type { ScaleType, ControlsState } from "../../reducers/controls";
import type { Metadata } from "../../reducers/metadata.types";

/**
 * Struct containing new metadata information for merging with the current redux state.
 * This interface is intended to be a versatile action for updating existing state
 * covering use cases from drag-and-drop metadata TSVs to in-app editing of attr colours.
 */
export interface NewMetadata {
  attributes?: Record<string, AttrDetails>;
  geographic?: Metadata["geoResolutions"];
}

export interface UpdateMetadataAction {
  type: "UPDATE_METADATA";
  tree: undefined | ActionTree;
  treeToo: undefined | ActionTree;
  controls: Partial<ControlsState>;
  metadata: ActionMetadata;
}

type ActionMetadata = Partial<Pick<Metadata, "colorings" | "geoResolutions">>;

interface ActionTree {
  /** nodeAttrs -> nodeName -> attrName -> attrData */
  nodeAttrs: Record<string, Record<string, NodeAttr>>
  nodeAttrKeys: TreeState['nodeAttrKeys']
  totalStateCounts: TreeState['totalStateCounts']
}


export interface AttrDetails {
  /** node_attr key to use */
  key: string;

  /** attr name (e.g. in legends, menus) */
  name: string;

  scaleType: ScaleType;

  /** Lookup of strain name to attribute values.
   * The value type is NodeAttr and thus we don't (yet) allow
   * new metadata for `vaccine`, `div`, `author` etc as they
   * have a different type.
   */
  strains: Record<string, NodeAttr>;

  /** Mapping of attrValue to specified color */
  colors?: [string|number, string][]
}
