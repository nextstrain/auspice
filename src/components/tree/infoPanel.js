import React from "react";
import * as globalStyles from "../../globalStyles";

const ComponentName = ({hovered, clicked}) => {

  /*
    node / branch
  */

  const container = {
    width: 260, /* equal to legend but account for padding */
    position: "absolute",
    left: 13,
    top: 45 /* legend top offset */ + 250 /* legend height */ + 20 /* top padding */,
    padding: "10px 20px 20px 20px",
    borderRadius: 10,
    zIndex: 1000,
    pointerEvents: "none",
    backgroundColor: "rgba(255,255,255,.85)"
  };

  const body = {
    fontFamily: globalStyles.sans,
    fontSize: 14,
    lineHeight: .8
  };

  const link = {
    fontFamily: globalStyles.sans,
    fontSize: 14,
    display: "block",
    marginTop: 20,
    textDecoration: "none",
    pointerEvents: "auto",
    lineHeight: .8
  }

  const branch = () => {
    return (
      <div style={container}>
        <p> {hovered.n ? "branch" : "none"} </p>
        <p style={body}>Frequency 90%</p>
        <p style={body}>Mutations A100T</p>
        <a href="#" style={link}> Filter to this clade </a>
        <a href="#" style={link}> Reset layout to this clade </a>
      </div>
    );
  };

  const tip = (tip) => {
    console.log(tip)
    return (
      <div style={container}>
        <p> {tip.n.attr.strain} </p>
        <p style={body}> {tip.n.attr.country} </p>
        <p style={body}> {tip.n.attr.date} </p>
        <a href="#" style={link}> go to item page </a>
      </div>
    )
  }

  const makeInfoPanel = () => {
    let panelContent;
    if (hovered && hovered.type === "tip") {
      panelContent = tip(hovered.d);
    }
    /*
      show anything that is hovered, if nothing hovered, show anything that is clicked.
      if nothing is clicked, return nothing.
    */
    return panelContent;
  };

  return (
    <div>
      {hovered || clicked ? makeInfoPanel() : null}
    </div>
  );
};

export default ComponentName;
