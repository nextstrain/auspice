import { JsonAnnotations as DatasetJsonAnnotations } from "../util/entropyCreateStateFromJsons";

export interface DatasetJson {
  meta: DatasetJsonMeta;
  tree: any;
  root_sequence?: DatasetJsonRootSequence;
  version: string;
}

export interface DatasetJsonRootSequence {
  /**
   * Nucleotide sequence of whole genome (from the output of `augur ancestral`)
   */
  nuc: string;
  /**
   * Amino acid sequence of genome annotation (e.g. gene) identified by this key (from the output of `augur translate`)
   */
  [k: string]: string;
}

type PanelName = "tree" | "map" | "frequencies" | "entropy" | "measurements";


/**
 * 
 * NOTES:
 * Ever property here is optional -- it'd be nice if auspice worked if you handled it a junk JSON (we should even make the 'meta' field optional)
 * and Auspice should throw something like InvalidDatasetJson() and render it appropriately
 * 
 */
export interface DatasetJsonMeta {
  /**
   * Auspice displays this at the top of the page
   */
  title?: string;
  /**
   * Auspice displays this (currently only in the footer)
   */
  updated?: string;
  /**
   * URL with instructions to reproduce build, usually expected to be a GitHub repo URL
   */
  build_url?: string;
  /**
   * Auspice displays this currently in the footer.
   */
  description?: string;
  maintainers?: {
    name: string;
    url?: string;
    [k: string]: unknown;
  }[]
  genome_annotations?: DatasetJsonAnnotations;
  /**
   * These appear as filters in the footer of Auspice (which populates the displayed values based upon the tree)
   */
  filters?: string[];
  panels?: PanelName[];
  /**
   * Data to be passed through to the the resulting dataset JSON
   */
  extensions?: {
    [k: string]: unknown;
  };
  /**
   * The available options for the geographic resolution dropdown, and their lat/long information
   *
   * @minItems 1
   */
  geo_resolutions?: {
    /**
     * Trait key - must be specified on nodes (e.g. 'country')
     */
    key: string;
    /**
     * The title to display in the geo resolution dropdown. Optional -- if not provided then `key` will be used.
     */
    title?: string;
    /**
     * Mapping from deme (trait values) to lat/long
     */
    demes: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^[a-z_]+$".
       */
      [k: string]: {
        latitude?: number;
        longitude?: number;
      };
    };
  }[];
  colorings?: ColorDefinition[];
  display_defaults?: DisplayDefaults;
  data_provenance?: {
    /**
     * Name of the data source
     */
    name: string;
    /**
     * URL to use in link to data source
     */
    url?: string;
  }[];
}



/**
 * Each object here is an individual coloring, which will populate the sidebar dropdown in auspice
 */
export interface ColorDefinition {
  /**
   * They key used to access the value of this coloring on each node
   */
  key: string;
  /**
   * Text to be displayed in the "color by" dropdown and legends
   */
  title?: string;
  /**
   * Defines how the color scale should be constructed
   */
  type?: "continuous" | "temporal" | "ordinal" | "categorical" | "boolean";
  /**
   * Provided mapping between trait values & hex values. For continuous scales at least 2 items must be specified
   */
  scale?: [] | [string | number] | [string | number, string][];
  /**
   * Specify the entries displayed in the legend. This can be used to restrict the entries in the legend for display without otherwise affecting the data viz
   */
  legend?: {
    /**
     * value to associate with this legend entry. Used to determine colour. For non-continuous scales this also determines the matching between legend items and data.
     */
    value: string | number;
    /**
     * Label to display in the legend. Optional - `value` will be used if this is not provided.
     */
    display?: string | number;
    /**
     * (for continuous scales only) provide the lower & upper bounds to match data to this legend entry. Bounds from different legend entries must not overlap. Matching is (a, b] - exclusive of the lower bound, inclusive of the upper.
     */
    bounds?: [] | [number] | [number, number];
    [k: string]: unknown;
  }[];
}

/**
 * Set the defaults for certain display options in Auspice. All are optional.
 */
export interface DisplayDefaults {
  map_triplicate?: boolean;
  geo_resolution?: string;
  color_by?: string;
  distance_measure?: "num_date" | "div";
  layout?: "rect" | "radial" | "unrooted" | "clock";
  /**
   * What branch label should be displayed by default, or 'none' to hide labels by default.
   */
  branch_label?: string;
  /**
   * What tip label should be displayed by default, or 'none' to hide labels by default.
   */
  tip_label?: string;
  transmission_lines?: boolean;
  /**
   * A BCP 47 language tag specifying the default language in which to display Auspice's interface (if supported)
   */
  language?: string;
  sidebar?: "open" | "closed";
  /**
   * Panels which start toggled on (default is for all available to be shown)
   *
   * @minItems 1
   */
  panels?: ["tree" | "map" | "frequencies" | "entropy", ...("tree" | "map" | "frequencies" | "entropy")[]];
}
