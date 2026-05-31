import { ScaleType } from "./controls"
import { colorOptions } from "../util/globals";

/**
 * Type definitions related to the metadata redux structure
 */

export type Metadata = {
  loaded: boolean;
  title: string;
  updated: string;
  sharing: MetadataSharing;
  streamLabels?: string[];
  rootSequence?: RootSequence;
  rootSequenceSecondTree?: RootSequence;
  maintainers?: Array<{
    name: string;
    url?: string;
  }>;
  identicalGenomeMapAcrossBothTrees?: boolean;
  colorings?: Colorings;
  /** legacy code which is set as the default reducer state. To remove! */
  colorOptions: typeof colorOptions;
  version?: string;
  originalVersion?: string;
  warning?: string;
  description?: string;
  buildUrl?: string;
  buildAvatar?: string;
  panels?: Panel[];
  filters?: string[];
  dataProvenance?: { name: string; url: string; }[];
  displayDefaults?: {
    mapTriplicate?: boolean;
    geoResolution?: string;
    colorBy?: string;
    distanceMeasure?: DistanceMeasure;
    layout?: Layout;
    selectedBranchLabel?: string;
    label?: string;
    tipLabelKey?: string;
    streamLabel?: string;
    showTransmissionLines?: boolean;
    language?: string;
    sidebar?: Sidebar;
    panels?: Panel[];
  };
  geoResolutions?: Array<GeoResolutions>;
}

export const PANEL_VALUES = ["tree", "map", "frequencies", "entropy", "measurements"] as const;

export const DISTANCE_MEASURE_VALUES = ["num_date", "div"] as const;
export type DistanceMeasure = typeof DISTANCE_MEASURE_VALUES[number];

export const LAYOUT_VALUES = ["rect", "radial", "unrooted", "clock"] as const;
export type Layout = typeof LAYOUT_VALUES[number];

export const SIDEBAR_VALUES = ["open", "closed"] as const;
export type Sidebar = typeof SIDEBAR_VALUES[number];

export type Panel = typeof PANEL_VALUES[number];

export type Colorings = {
  [key: string]: ColoringInfo
}

export type ColoringInfo = {
  title: string
} & (
  {
    type: "continuous";
    scale?: [number, string][];
    legend?: Array<LegendContinuous>;
  } | {
    type: Exclude<ScaleType, "continuous">;
    scale?: [string, string][];
    legend?: Array<LegendNonContinuous>
  }
)

export interface LegendNonContinuous {
  /** Used to compute the legend swatch colour */
  value: string;
  /** Displayed in the legend. Auspice will use `value` if missing. */
  display?: string | number;
}

export interface LegendContinuous {
  /** Used to compute the legend swatch colour */
  value: number;
  /** Displayed in the legend. Auspice will use `value` if missing. */
  display?: string | number;
  /** provide the lower & upper bounds to match data to this legend entry */
  bounds: [number, number];
}

/**
 * Fine-grained controls on the ability of Auspice to download various
 * assets of the dataset. The defaults are to allow downloading of all
 * applicable assets
 */
export interface MetadataSharing {
  dataset_json: boolean;
  metadata_tsv: boolean;
  authors: boolean;
  trees: boolean;
  entropy: boolean;
  /** gisaid_acknowledgments is not exposed as a JSON configuration, it is set dynamically within Auspice  */
  gisaid_acknowledgments?: boolean;
  screenshot: boolean;
}

export interface GeoResolutions {
  key: string;
  title?: string;
  demes: Record<string, LatLong>;
}

interface LatLong {
  /** latitude is [-90, 90] */
  latitude: number;
  /** longitude is [-180, 180] */
  longitude: number;
}

interface RootSequence {
  [cdsNameOrNuc: string]: string;
}
