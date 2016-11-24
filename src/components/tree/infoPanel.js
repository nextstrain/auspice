import React from "react";
import * as globalStyles from "../../globalStyles";
import * as globals from "../../util/globals";

const InfoPanel = ({hovered, clicked, dismiss}) => {

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

  const muts = {
    fontFamily: globalStyles.sans,
    fontSize: 14,
    lineHeight: 1.6
  };

  const link = {
    fontFamily: globalStyles.sans,
    fontSize: 14,
    display: "block",
    marginTop: 20,
    textDecoration: "none",
    pointerEvents: "auto",
    lineHeight: .8
  };

  const dismissStyle = {
    fontFamily: "Helvetica",
    fontSize: 14,
    fontWeight: 700,
    width: "100%",
    display: "block",
    textAlign: "right",
    pointerEvents: "auto",
    lineHeight: .8,
    cursor: "pointer"
  };

  const mutations = (d) => {

    let string = "";

    if ((typeof d.muts !== "undefined") && (globals.mutType == "nuc") && (d.muts.length)) {
      let tmp_muts = d.muts;
      const nmuts = tmp_muts.length;
      tmp_muts = tmp_muts.slice(0, Math.min(10, nmuts));
      string += tmp_muts.join(", ");
      if (nmuts>10) {
        string+=" + "+ (nmuts-10) + " more";
      }
    }
    if (typeof d.fitness !== "undefined") {
      string += "Fitness: " + d.fitness.toFixed(3);
    }
    // string += "click to zoom into clade";

    return string;
  }

  const frequencies = (d) => {
    return (
      <p style={body}>
        "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
      </p>
    )
  }

  const branch = (branch) => {
    return (
      <div style={container}>
        {clicked ? <p style={dismissStyle} onClick={dismiss}>x</p> : null}
        { typeof branch.frequency !== "undefined" ? frequencies(branch.n) : null }
        <p style={muts}>Mutations: {mutations(branch.n)}</p>
        <a href="#" style={link}> Filter to this clade </a>
        <a href="#" style={link}> Reset layout to this clade </a>
      </div>
    );
  };

  const tip = (tip) => {
    return (
      <div style={container}>
        {clicked ? <p style={dismissStyle} onClick={dismiss}>x</p> : null}
        <p style={body}> {tip.n.attr.strain} </p>
        <p style={body}> {tip.n.attr.country} </p>
        <p style={body}> {tip.n.attr.date} </p>
        <a href="#" style={link}> go to item page </a>
      </div>
    );
  };

  const makeInfoPanel = () => {
    let panelContent = "Error, see infoPanel";

    if (clicked && clicked.type === ".tip") {
      panelContent = tip(clicked.d);
    } else if (clicked && clicked.type === ".branch") {
      panelContent = branch(clicked.d);
    } else if (hovered && hovered.type === ".tip") {
      panelContent = tip(hovered.d);
    } else if (hovered && hovered.type === ".branch") {
      panelContent = branch(hovered.d);
    }

    return panelContent;
  };

  /*
  neither
  clicked
    branch or tip
  hovered
    branch or tip
  */

  return (
    <div>
      {hovered || clicked ? makeInfoPanel() : null}
    </div>
  );
};

export default InfoPanel;
