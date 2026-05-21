import { ScaleType } from "./reducers/controls"

export type Metadata = {
  rootSequence?: unknown
  rootSequenceSecondTree?: unknown
  identicalGenomeMapAcrossBothTrees?: boolean
  colorings: Colorings
  sharing: MetadataSharing
  dataProvenance?: { name: string; url: string; }[]
}

export type Colorings = {
  [key: string]: ColoringInfo
}

export type ColoringInfo = {
  title: string
  type: ScaleType

  /** scale set via JSON or actions */
  scale?: [string | number, string][]

  legend?: Legend
}

export type Legend = {
  /**
   * Used to compute the legend swatch colour. The type of this depends on the scaleType.
   * Continuous scales demand numeric values, however few restrictions are placed on other scales.
   */
  value: unknown

  /** Displayed in the legend. Falls back to `value` if missing. */
  display?: string | number

  /** Custom legendBounds. Only considered for continuous scales. */
  bounds?: [number, number]
}[]

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
