import { ScaleType } from "./reducers/controls"

export type Metadata = {
  rootSequence?: unknown
  rootSequenceSecondTree?: unknown
  identicalGenomeMapAcrossBothTrees?: boolean
  colorings: Colorings
}

export type Colorings = {
  [key: string]: ColoringInfo
}

export type ColoringInfo = {
  title: string
  type: ScaleType

  /** scale set via JSON or ADD_EXTRA_METADATA action */
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
