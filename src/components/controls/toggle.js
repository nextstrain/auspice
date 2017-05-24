import React from "react";
import SelectLabel from "../framework/select-label";

const Toggle = ({display, on, callback, label}) => {
  if (!display) {
    return null;
  }
  return (
    <div>
      <label className="switch">
        <input
          className="switch"
          type="checkbox"
          style={{marginLeft: "40px"}}
          checked={on}
          onChange={callback}
        />
        <div className={"slider round"}></div>
        <SelectLabel
          text={label}
          extraStyles={{marginLeft: "40px", marginTop: "4px", width: "200px"}}
        />
      </label>
    </div>
  );
};

export default Toggle;
