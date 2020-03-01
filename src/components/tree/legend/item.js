import React from "react";
import { updateTipRadii } from "../../../actions/tree";
import { dataFont, darkGrey } from "../../../globalStyles";

const LegendItem = ({
  dispatch,
  legendRectSize,
  legendSpacing,
  rectStroke,
  rectFill,
  label,
  value
}) => (
  <li
    onMouseEnter={() => {
      dispatch(updateTipRadii({selectedLegendItem: value}));
    }}
    onMouseLeave={() => {
      dispatch(updateTipRadii());
    }}
    style={{listStyleType: "none", marginLeft: "10px", marginBottom: "2px"}}
  >
    <span
      style={{
        float: "left",
        width: (legendRectSize-2) + "px",
        height: (legendRectSize-2) + "px",
        background: rectFill,
        border: "2px solid " + rectStroke,
        marginRight: "8px"
      }}>
    </span>
    <span
      x={legendRectSize + legendSpacing + 5}
      y={legendRectSize - legendSpacing}
      style={{fontSize: 12, fill: darkGrey, fontFamily: dataFont, overflowWrap: "anywhere"}}
    >
      {label}
    </span>
    <div style={{clear:"both"}}>
    </div>
  </li>
);

export default LegendItem;
