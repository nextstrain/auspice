import React from "react";
import {headerFont, medGrey, darkGrey} from "../../globalStyles";

const SelectLabel = ({text, extraStyles = {}}) => {
  return (
    <p
      style={Object.assign({}, {
        fontFamily: headerFont,
        margin: "0px 0px 5px 0px",
        fontSize: 12,
        fontWeight: 400,
        color: darkGrey
      }, extraStyles)}
    >
      {text}
    </p>
  );
};

export default SelectLabel;
