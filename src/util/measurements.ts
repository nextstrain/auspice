import { LegendBounds, LegendValues } from "../reducers/controls";
import { Collection } from "../reducers/measurements/types";
import { ReduxNode } from "../reducers/tree/types";

/* Keys are strain names and values average measurement values for strain */
interface StrainAverageMeasurementValue {
  [key: string]: number
}

/* m-<grouping> correspond to measurements grouping for coloring */
const measurementsColorByPrefix = "m-";
export function isColorByMeasurements(colorBy: string): boolean {
  return colorBy.startsWith(measurementsColorByPrefix);
}

export function encodeColorByMeasurements(grouping: string): string {
  if (!grouping) {
    throw new Error("encodeColorByMeasurements failed: grouping needs to be a non-empty string");
  }
  return measurementsColorByPrefix + grouping;
}

export function decodeColorByMeasurements(colorBy: string): string {
  if (!isColorByMeasurements(colorBy)){
    throw new Error(`decodeColorByMeasurements failed: provided ${colorBy} is not a measurements color by`);
  }
  const prefixRegex = new RegExp(`^${measurementsColorByPrefix}`);
  return colorBy.replace(prefixRegex, "");
}

export function parseStrainMeasurementValues(
  collection: Collection,
  groupBy: string,
  groupingValue: string,
): StrainAverageMeasurementValue {
  const strainMeasurementValues: { [key: string]: number[] } = collection.measurements
    .filter((m) => m[groupBy] === groupingValue)
    .reduce((accum, m) => {
      (accum[m.strain] = accum[m.strain] || []).push(m.value)
      return accum
    }, {});

  const strainAverageMeasurementValue = {};
  for (const [strain, measurements] of Object.entries(strainMeasurementValues)) {
    strainAverageMeasurementValue[strain] = measurements.reduce((sum, value) => sum + value) / measurements.length
  }

  return strainAverageMeasurementValue
}

/**
 * Set measurements value on nodes in place
 */
export function setMeasurements(
  nodes: ReduxNode[],
  strainAverageMeasurementValue: StrainAverageMeasurementValue
): void {
  for (const node of nodes) {
    if (node.name in strainAverageMeasurementValue) {
      node.node_attrs["measurementValue"] = strainAverageMeasurementValue[node.name];
    }
  }
}

export function createScaleForMeasurements(
): {
  colorScale:  (val: any) => string,
  legendBounds: LegendBounds,
  legendValues: LegendValues,
} {
  return {
    colorScale: () => "",
    legendBounds: [],
    legendValues: []
  }
}
