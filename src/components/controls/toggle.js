import React from "react";
import { SelectLabel } from "../framework/select-label";

const Toggle = ({
  display,
  on,
  callback,
  label,
  style = {},
  sliderStyle = {marginLeft: "40px"},
  labelStyle = {marginLeft: "40px", marginTop: "4px", width: "200px"}
}) => {
  if (!display) {
    return null;
  }
  return (
    <div style={style}>
      <label className="switch">
        <input
          className="switch"
          type="checkbox"
          style={sliderStyle}
          checked={on}
          onChange={callback}
        />
        <div className={"slider round"}/>
        {label === "" ? null : (
          <SelectLabel
            text={label}
            extraStyles={labelStyle}
          />
        )}
      </label>
    </div>
  );
};

export default Toggle;
