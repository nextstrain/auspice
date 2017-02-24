import React from "react";
import * as globalStyles from "../../globalStyles";
import * as globals from "../../util/globals";
import {dataFont} from "../../globalStyles";

const InfoPanel = ({tree, hovered, clicked, resetState}) => {

  const styles = {
    container: {
      width: 260, /* equal to legend but account for padding */
      position: "absolute",
      left: 13,
      top: 45 /* legend top offset */ + 250 /* legend height */ + 20 /* top padding */,
      padding: "10px 20px 20px 20px",
      borderRadius: 10,
      zIndex: 1000,
      pointerEvents: "none",
      backgroundColor: "rgba(255,255,255,.85)"
    },
    body: {
      fontFamily: dataFont,
      fontSize: 14,
      lineHeight: .8
    },
    muts: {
      fontFamily: dataFont,
      fontSize: 14,
      lineHeight: 1.6
    },
    link: {
      fontFamily: dataFont,
      fontSize: 14,
      display: "block",
      marginTop: 20,
      textDecoration: "none",
      pointerEvents: "auto",
      lineHeight: .8,
      color: "#0000EE", // link color
      // color: "#551A8B", // visited link color
      cursor: "pointer"
    },
    dismissStyle: {
      fontFamily: "Helvetica",
      fontSize: 14,
      fontWeight: 700,
      width: "100%",
      display: "block",
      textAlign: "right",
      pointerEvents: "auto",
      lineHeight: .8,
      cursor: "pointer"
    }
  };

  /* getX methods return styled JSX */
  const getMutations = (d) => {
    let mutations = "";
    if ((typeof d.muts !== "undefined") && (globals.mutType == "nuc") && (d.muts.length)) {
      let tmp_muts = d.muts;
      const nmuts = tmp_muts.length;
      tmp_muts = tmp_muts.slice(0, Math.min(10, nmuts));
      mutations += tmp_muts.join(", ");
      if (nmuts>10) {
        mutations+=" + "+ (nmuts-10) + " more";
      }
    }
    if (typeof d.fitness !== "undefined") {
      mutations += "Fitness: " + d.fitness.toFixed(3);
    }
    return (
      <p style={styles.muts}>
        Mutations: {mutations}
      </p>
    );
  };
  const getFrequencies = (d) => {
    if (d.frequency !== undefined) {
      const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
      return (
        <p style={styles.body}>
          {disp}
        </p>
      )
    }
    return null;
  }

  /* callbacks */
  const dismissCallback = () => {
    tree.zoomIntoClade(tree.nodes[0], globals.mediumTransitionDuration);
    resetState();
  };
  const zoomCallback = (branch) => {
    // perform the zoom on the tree. Sets "inView" attr of each node to "true"
    tree.zoomIntoClade.bind(tree)(branch, globals.mediumTransitionDuration);
  };

  const makeBranchPanel = (branch) => {
    return (
      <div style={styles.container}>
        {clicked ? <p style={styles.dismiss} onClick={() => dismissCallback()}>x</p> : null}
        {getFrequencies(branch.n)}
        {getMutations(branch.n)}
        <p style={styles.link} onClick={() => zoomCallback(branch)}>
          Zoom into this clade
        </p>
      </div>
    );
  };

  const makeTipPanel = (tip) => {
    return (
      <div style={styles.container}>
        {clicked ? <p style={styles.dismissStyle} onClick={styles.dismiss}>x</p> : null}
        <p style={styles.body}> {tip.n.attr.strain} </p>
        <p style={styles.body}> {tip.n.attr.country} </p>
        <p style={styles.body}> {tip.n.attr.date} </p>
        <a href="#" style={styles.link}> go to item page </a>
      </div>
    );
  };

  const makeInfoPanel = () => {
    if (!tree) {
      return null;
    }
    if (clicked) {
      return clicked.type === ".tip" ? makeTipPanel(clicked.d) : makeBranchPanel(clicked.d);
    } else if (hovered) {
      return hovered.type === ".tip" ? makeTipPanel(hovered.d) : makeBranchPanel(hovered.d);
    }
    return null;
  };

  return (
    <div>
      {makeInfoPanel()}
    </div>
  );
};

export default InfoPanel;
