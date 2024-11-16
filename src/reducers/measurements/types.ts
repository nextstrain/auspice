import { measurementIdSymbol } from "../../util/globals";

// -- Measurements JSON types -- //

/**
 * Measurements are allowed to have arbitrary metadata.
 * Matching types allowed in Augur's measurements schema
 * <https://github.com/nextstrain/augur/blob/3f72c40897a80132099729d5d00a6718e76e0e9e/augur/data/schema-measurements.json#L152>
 */
export type MeasurementMetadata = string | number | boolean
export type MeasurementsDisplay = 'raw' | 'mean'

interface JsonMeasurement {
  readonly strain: string
  readonly value: number
  readonly [key: string]: MeasurementMetadata
}

interface JsonCollectionDisplayDefaults {
  readonly group_by?: string
  readonly measurements_display?: MeasurementsDisplay
  readonly show_overall_mean?: boolean
  readonly show_threshold?: boolean
}

interface JsonCollectionField {
  readonly key: string
  readonly title?: string
}

interface JsonCollectionGrouping {
  readonly key: string
  readonly order?: MeasurementMetadata[]
}

export interface JsonCollection {
  readonly display_defaults?: JsonCollectionDisplayDefaults
  readonly fields?: JsonCollectionField[]
  readonly filters?: string[]
  readonly groupings: JsonCollectionGrouping[]
  readonly key: string
  readonly measurements: JsonMeasurement[]
  readonly threshold?: number
  readonly thresholds?: number[]
  readonly title?: string
  readonly x_axis_label: string
}

export interface MeasurementsJson {
  readonly collections: JsonCollection[]
  readonly default_collection?: string
}

// -- Measurements state types -- //

export interface Measurement extends JsonMeasurement {
  [measurementIdSymbol]: number
}

export interface Collection {
  // TODO: Convert this to MeasurementsControlState during parseMeasurementsJSON
  display_defaults?: JsonCollectionDisplayDefaults
  fields: Map<string, {title: string}>
  filters: Map<string, {values: Set<MeasurementMetadata>}>
  groupings: Map<string, {values: MeasurementMetadata[]}>
  key: string
  measurements: Measurement[]
  thresholds?: number[]
  title?: string
  x_axis_label: string
}

export interface MeasurementsState {
  loaded: boolean
  error: string | undefined
  collections: Collection[] | undefined
  collectionToDisplay: Collection | undefined
  defaultCollectionKey: string | undefined
}
