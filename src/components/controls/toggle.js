import React from "react";
import SelectLabel from "../framework/select-label";

/* the status of the toggle can be one of 3 values:
undefined -> not displayed
false -> displayed in off position
true -> displated in on position */

const Toggle = ({status, callback, label}) => {
  if (status === undefined) {
    return null;
  }
  return (
    <div>
      <label className="switch">
        <input
          className="switch"
          type="checkbox"
          style={{marginLeft: "40px"}}
          checked={status}
          onChange={callback}
        />
        <div className={"slider round"}></div>
        <SelectLabel
          text={label}
          extraStyles={{marginLeft: "40px", marginTop: "4px", width: "200px"}}
        />
      </label>
    </div>
  )
}

export default Toggle;
