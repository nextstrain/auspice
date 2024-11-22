import { measurementIdSymbol } from "../../util/globals";

// -- Shared Measurements types -- //
export type MeasurementsDisplay = "raw" | "mean"
export const measurementsDisplayValues: MeasurementsDisplay[] = ["raw", "mean"];
export const isMeasurementsDisplay = (x: any): x is MeasurementsDisplay => measurementsDisplayValues.includes(x);

// -- Measurements JSON types -- //
/**
 * Measurements are allowed to have arbitrary metadata.
 * Matching types allowed in Augur's measurements schema
 * <https://github.com/nextstrain/augur/blob/3f72c40897a80132099729d5d00a6718e76e0e9e/augur/data/schema-measurements.json#L152>
 */
type JsonMeasurementMetadata = string | number | boolean

interface JsonMeasurement {
  readonly strain: string
  readonly value: number
  readonly [key: string]: JsonMeasurementMetadata
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
  readonly order?: JsonMeasurementMetadata[]
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

export interface Measurement {
  [measurementIdSymbol]: number
  strain: string
  value: number
  [key: string]: string | number
}

export function asMeasurement(x: Partial<Measurement>): Measurement {
  if (x[measurementIdSymbol] !== undefined && x.strain && x.value !== undefined) {
    return {
       ...x,
       [measurementIdSymbol]: x[measurementIdSymbol],
       strain: x.strain,
       value: x.value,
    }
  }
  throw new Error("Measurement is partial.");
}

export function isMeasurement(x: any): x is Measurement {
  try {
    asMeasurement(x);
    return true;
  } catch {
    return false;
  }
}

export interface Collection {
  // TODO: Convert this to MeasurementsControlState during parseMeasurementsJSON
  display_defaults?: JsonCollectionDisplayDefaults
  fields: Map<string, {title: string}>
  filters: Map<string, {values: Set<string>}>
  groupings: Map<string, {values: string[]}>
  key: string
  measurements: Measurement[]
  thresholds?: number[]
  title?: string
  x_axis_label: string
}

export function asCollection(x: Partial<Collection>): Collection {
  if (
    x.fields &&
    x.filters &&
    x.groupings &&
    x.key &&
    x.measurements &&
    x.x_axis_label
  ){
    return {
      ...x,
      fields: x.fields,
      filters: x.filters,
      groupings: x.groupings,
      key: x.key,
      measurements: x.measurements,
      x_axis_label: x.x_axis_label,
    }
  }
  throw new Error("Collection is partial.");
}

export interface MeasurementsState {
  loaded: boolean
  error: string | undefined
  collections: Collection[] | undefined
  collectionToDisplay: Collection | undefined
  defaultCollectionKey: string | undefined
}
