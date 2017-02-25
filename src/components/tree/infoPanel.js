import React from "react";
import * as globals from "../../util/globals";
import {dataFont, infoPanelStyles} from "../../globalStyles";
import { prettyString } from "./tipSelectedPanel";
const InfoPanel = ({tree, hovered}) => {

  const styles = {
    container: {
      width: 150,
      // height: 100,
      position: "absolute",
      left: 13,
      top: 45 /* legend top offset */ + 250 /* legend height */ + 20 /* top padding */,
      padding: "20px 20px 10px 20px",
      borderRadius: 10,
      zIndex: 1000,
      pointerEvents: "none",
      fontFamily: infoPanelStyles.panel.fontFamily,
      fontSize: 14,
      lineHeight: 1,
      fontWeight: infoPanelStyles.panel.fontWeight,
      color: infoPanelStyles.panel.color,
      backgroundColor: infoPanelStyles.panel.backgroundColor,
      wordWrap: "break-word"
    }
  };

  /* getX methods return styled JSX */
  const getMutations = (d) => {
    let mutations = "";
    if ((typeof d.muts !== "undefined") && (globals.mutType === "nuc") && (d.muts.length)) {
      const numMutsToShow = 5;
      let tmp_muts = d.muts;
      const nmuts = tmp_muts.length;
      tmp_muts = tmp_muts.slice(0, Math.min(numMutsToShow, nmuts));
      mutations += tmp_muts.join(", ");
      if (nmuts > numMutsToShow) {
        mutations += " + " + (nmuts - numMutsToShow) + " more";
      }
    }
    if (typeof d.fitness !== "undefined") {
      mutations += "Fitness: " + d.fitness.toFixed(3);
    }
    return (<li>Mutations: {mutations}</li>);
  };
  const getFrequencies = (d) => {
    if (d.frequency !== undefined) {
      const disp = "Frequency: " + (100 * d.frequency).toFixed(1) + "%";
      return (<li>{disp}</li>);
    }
    return null;
  }

  const makeInfoPanel = () => {
    if (tree && hovered) {
      if (hovered.type === ".tip") {
        const tip = hovered.d;
        return (
          <div style={styles.container}>
            <div style={infoPanelStyles.heading}>
              {tip.n.attr.strain}
            </div>
            <ul style={infoPanelStyles.list}>
              <li>{prettyString(tip.n.attr.country)}</li>
              <li>{tip.n.attr.date}</li>
            </ul>
            <p style={infoPanelStyles.comment}>
              Click on tip to display more info
            </p>
          </div>
        );
      } else { /* BRANCH */
        const branch = hovered.d;
        return (
          <div style={styles.container}>
            <div style={infoPanelStyles.heading}>
              {`Branch with ${branch.n.fullTipCount} children`}
            </div>
            <ul style={infoPanelStyles.list}>
              {getFrequencies(branch.n)}
              {getMutations(branch.n)}
            </ul>
            <p style={infoPanelStyles.comment}>
              Click on branch to zoom into this clade
            </p>
          </div>
        );
      }
    }
    return null;
  };

  return (
    makeInfoPanel()
  );
};

export default InfoPanel;
