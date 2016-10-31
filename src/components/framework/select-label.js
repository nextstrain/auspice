import React from "react";
import {sans} from "../../globalStyles";

const SelectLabel = ({text}) => {
  return (
    <p style={{
      fontFamily: sans,
      margin: "0px 0px 5px 0px",
      fontSize: 12
    }}>
      {text}
    </p>
  );
};

export default SelectLabel;
