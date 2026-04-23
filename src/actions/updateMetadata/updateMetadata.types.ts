import { NodeAttr } from "../../reducers/tree/types";

/**
 * Struct containing new metadata information for merging with the current redux state.
 * This interface is intended to be a versatile action for updating existing state
 * covering use cases from drag-and-drop metadata TSVs to in-app editing of attr colours.
 */
export interface NewMetadata {
  attributes?: Record<string, ColoringInfo>;

  geographic?: {
    /** trait name */
    key: string;

    /** map of trait value (the deme name) to lat/long */
    demes: {
      [deme: string]: LatLong;
    }
    }[];

  info: MetadataInfo;
}

export interface UpdateMetadataAction extends NewMetadata {
  type: "UPDATE_METADATA",
}

export interface ColoringInfo {
  /** node_attr key to use */
  key: string;

  /** attr name (e.g. in legends, menus) */
  name: string;

  scaleType: string;

  /** Lookup of strain name to attribute values.
   * The value type is NodeAttr and thus we don't (yet) allow
   * new metadata for `vaccine`, `div`, `author` etc as they
   * have a different type.
   */
  strains: Record<string, NodeAttr>;

  /** Lookup of attrValue to specified colour */
  colours: Record<string, string>;
}

interface MetadataInfo {
  fileName ?: string;
  ignoredAttrNames?: Set<string>;
}

interface LatLong {
  latitude: number;
  longitude: number;
}
