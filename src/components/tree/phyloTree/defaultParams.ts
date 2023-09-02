import { dataFont, darkGrey } from "../../../globalStyles";

export type Params = {
  regressionStroke: string
  regressionWidth: number
  majorGridStroke: string
  majorGridWidth: number
  minorGridStroke: string
  minorGridWidth: number
  tickLabelSize: number
  tickLabelFill: string
  minorTicks: number
  orientation: number[]
  showGrid: boolean
  fillSelected: string
  radiusSelected: number
  branchStroke: string
  branchStrokeWidth: number
  tipStroke: string
  tipFill: string
  tipStrokeWidth: number
  tipRadius: number
  fontFamily: string
  branchLabelKey: boolean
  branchLabelFont: string
  branchLabelFill: string
  branchLabelFontWeight: number
  branchLabelPadX: number
  branchLabelPadY: number
  tipLabels: boolean
  tipLabelFont: string
  tipLabelFill: string
  tipLabelPadX: number
  tipLabelPadY: number
  mapToScreenDebounceTime: number
  tipLabelFontSizeL1: number
  tipLabelFontSizeL2: number
  tipLabelFontSizeL3: number
  tipLabelBreakL1: number
  tipLabelBreakL2: number
  tipLabelBreakL3: number
}

export const createDefaultParams = () => ({
  regressionStroke: darkGrey,
  regressionWidth: 6,
  majorGridStroke: "#DDD",
  majorGridWidth: 2,
  minorGridStroke: "#EEE",
  minorGridWidth: 1,
  tickLabelSize: 12,
  tickLabelFill: darkGrey,
  minorTicks: 4,
  orientation: [1, 1],
  showGrid: true,
  fillSelected: "#A73",
  radiusSelected: 5,
  branchStroke: "#AAA",
  branchStrokeWidth: 2,
  tipStroke: "#AAA",
  tipFill: "#CCC",
  tipStrokeWidth: 1,
  tipRadius: 4,
  fontFamily: dataFont,
  /* B R A N C H   L A B E L S */
  branchLabelKey: false,
  branchLabelFont: dataFont,
  branchLabelFill: "#777",
  branchLabelFontWeight: 500,
  branchLabelPadX: 8,
  branchLabelPadY: 5,
  /* T I P   L A B E L S */
  tipLabels: true,
  tipLabelFont: dataFont,
  tipLabelFill: "#555",
  tipLabelPadX: 8,
  tipLabelPadY: 2,
  mapToScreenDebounceTime: 500,
  tipLabelFontSizeL1: 8,
  tipLabelFontSizeL2: 10,
  tipLabelFontSizeL3: 12,
  tipLabelBreakL1: 75,
  tipLabelBreakL2: 50,
  tipLabelBreakL3: 25
});
