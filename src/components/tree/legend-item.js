import React from "react";
import { legendMouseEnterExit } from "../../actions/treeProperties";
import { dataFont, darkGrey } from "../../globalStyles";
import { prettyString } from "./treeViewFunctions";

const LegendItem = ({
  dispatch, transform,
  legendRectSize, legendSpacing,
  rectStroke, rectFill,
  label, dFreq}) => (
  <g
    transform={transform}
    onMouseEnter={() => {
      dispatch(legendMouseEnterExit(label));
    }}
    onMouseLeave={() => {
      dispatch(legendMouseEnterExit());
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
      {prettyString(label, dFreq)}
    </text>
  </g>
);

export default LegendItem;
