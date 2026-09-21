import React from "react";
import { updateTipRadii } from "../../actions/tree";
import { dataFont, darkGrey } from "../../globalStyles";

interface LegendItemProps {
  dispatch: any;
  transform: string;
  clipId?: string;
  legendRectSize: number;
  legendSpacing: number;
  rectStroke: string;
  rectFill: string;
  label: any;
  tooltip: any;
  value: any;
  index?: number;
  handleOnClick: (e: React.MouseEvent) => void;
}

const LegendItem = ({
  dispatch,
  transform,
  clipId,
  legendRectSize,
  legendSpacing,
  rectStroke,
  rectFill,
  label,
  tooltip,
  value,
  handleOnClick,
}: LegendItemProps): JSX.Element => (
  <g
    transform={transform}
    onMouseEnter={() => {
      dispatch(updateTipRadii({selectedLegendItem: value}));
    }}
    onMouseLeave={() => {
      dispatch(updateTipRadii());
    }}
    onClick={(e) => handleOnClick(e)}
  >
    <rect
      style={{strokeWidth: 2}}
      width={legendRectSize}
      height={legendRectSize}
      fill={rectFill}
      stroke={rectStroke}
    >
      <title>{tooltip}</title>
    </rect>
    <text
      x={legendRectSize + legendSpacing + 5}
      y={legendRectSize - legendSpacing}
      style={{fontSize: 12, fill: darkGrey, fontFamily: dataFont}}
      clipPath={clipId?`url(#${clipId})`:undefined}
    >
      <title>{tooltip}</title>
      {label}
    </text>
  </g>
);

export default LegendItem;
