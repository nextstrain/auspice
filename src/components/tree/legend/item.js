import React from "react";
import { updateTipRadii } from "../../../actions/tree";
import { dataFont, darkGrey } from "../../../globalStyles";

const LegendItem = ({
  dispatch,
  transform,
  legendRectSize,
  legendSpacing,
  legendMaxLength,
  rectStroke,
  rectFill,
  label,
  value
}) => (
  <g
    transform={transform}
    onMouseEnter={() => {
      dispatch(updateTipRadii({selectedLegendItem: value}));
    }}
    onMouseLeave={() => {
      dispatch(updateTipRadii());
    }}
  >
    <rect
      style={{strokeWidth: 2}}
      width={legendRectSize}
      height={legendRectSize}
      fill={rectFill}
      stroke={rectStroke}
    />
    <text
      x={legendRectSize + legendSpacing + 5}
      y={legendRectSize - legendSpacing}
      style={{fontSize: 12, fill: darkGrey, fontFamily: dataFont}}
    >
      <title>{label}</title>
      {typeof label === 'string' ? label.substring(0, legendMaxLength) : label}
    </text>
  </g>
);

export default LegendItem;
