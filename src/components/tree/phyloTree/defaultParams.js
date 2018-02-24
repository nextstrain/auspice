import { dataFont, darkGrey } from "../../../globalStyles";

export const defaultParams = {
  regressionStroke: darkGrey,
  regressionWidth: 6,
  majorGridStroke: "#CCC",
  majorGridWidth: 2,
  minorGridStroke: "#DDD",
  minorGridWidth: 1,
  tickLabelSize: 12,
  tickLabelFill: darkGrey,
  minorTicksTimeTree: 3,
  minorTicks: 4,
  orientation: [1, 1],
  margins: {left: 25, right: 15, top: 5, bottom: 25},
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
  /* C L A D E   L A B E L S */
  cladeLabelKey: false,
  cladeLabelFont: dataFont,
  cladeLabelFill: "#555",
  cladeLabelPadX: 8,
  cladeLabelPadY: 5,
  /* TIP   L A B E L S */
  tipLabels: true,
  tipLabelFont: dataFont,
  tipLabelFill: "#555",
  tipLabelPadX: 8,
  tipLabelPadY: 2,
  mapToScreenDebounceTime: 500
};
