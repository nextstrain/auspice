/*eslint-env browser*/
import React from "react";
import * as globals from "../../util/globals";
import {dataFont, infoPanelStyles} from "../../globalStyles";
import { prettyString } from "../tree/tipSelectedPanel";

const InfoPanel = ({hovered}) => {

  /* this is a function - we can bail early */
  if (!hovered) {
    return null
  }
  const width = 200;

  const styles = {
    container: {
      position: "absolute",
      width,
      padding: "10px",
      borderRadius: 10,
      zIndex: 1000,
      pointerEvents: "none",
      fontFamily: infoPanelStyles.panel.fontFamily,
      fontSize: 14,
      lineHeight: 1,
      fontWeight: infoPanelStyles.panel.fontWeight,
      color: infoPanelStyles.panel.color,
      backgroundColor: infoPanelStyles.panel.backgroundColor,
      wordWrap: "break-word",
      wordBreak: "break-word"
    }
  };

  const bounds = document.getElementById("d3entropy").getBoundingClientRect();
  const pos = {
    x: hovered.x - bounds.left + 15,
    y: hovered.y - bounds.top
  };

  if (pos.x < hovered.chartGeom.width * 0.7) {
    styles.container.left = pos.x;
  } else {
    styles.container.right = hovered.chartGeom.width - pos.x;
  }
  if (pos.y < hovered.chartGeom.height * 0.5) {
    styles.container.top = pos.y;
  } else {
    styles.container.bottom = hovered.chartGeom.height - pos.y;
  }

  // console.log(hovered.d)

  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div style={infoPanelStyles.tooltipHeading}>
          {"Entropy Bar"}
        </div>
        <div>
          {`Codon ${hovered.d.codon} in protein ${hovered.d.prot}`}
        </div>
        <div style={infoPanelStyles.comment}>
          Click to color tree & map
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
