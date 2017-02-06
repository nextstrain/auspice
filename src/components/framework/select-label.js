import React from "react";
import {headerFont, medGrey, darkGrey} from "../../globalStyles";

const SelectLabel = ({text}) => {
  return (
    <p style={{
      fontFamily: headerFont,
      margin: "0px 0px 5px 0px",
      fontSize: 12,
      fontWeight: 400,
      color: darkGrey
    }}>
      {text}
    </p>
  );
};

export default SelectLabel;
