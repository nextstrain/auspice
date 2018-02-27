import React from "react";
import { headerFont, titleStyles, darkGrey } from "../../globalStyles";

export const Header = ({text, extraStyles = {}}) => {
  return (
    <span style={{...titleStyles.small, ...extraStyles}}>
      {text}
    </span>
  );
};

export const SelectLabel = ({text, extraStyles = {}}) => {
  return (
    <p
      style={Object.assign({}, {
        fontFamily: headerFont,
        margin: "7px 0px 5px 0px",
        fontSize: 12,
        fontWeight: 400,
        color: darkGrey
      }, extraStyles)}
    >
      {text}
    </p>
  );
};
