import React from "react";
import { infoPanelStyles } from "../../globalStyles";

const InfoPanel = ({hovered, chartGeom, mutType}) => {

  /* this is a function - we can bail early */
  if (!hovered) {
    return null;
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

  /* don't use d3entropy or main chart SVG as these change on zoom.
  The Y axis is safe as it is invariant */
  const bounds = document.getElementById("entropyYAxis").getBoundingClientRect();
  const pos = {
    x: hovered.x - bounds.left + 15,
    y: hovered.y - bounds.top
  };

  if (pos.x < chartGeom.width * 0.7) {
    styles.container.left = pos.x;
  } else {
    styles.container.right = chartGeom.width - pos.x;
  }
  if (pos.y < chartGeom.height * 0.5) {
    styles.container.top = pos.y;
  } else {
    styles.container.bottom = chartGeom.height - pos.y;
  }

  // heading JSX:
  // <div style={infoPanelStyles.tooltipHeading}>
  //   {"Entropy Bar"}
  // </div>
  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {mutType === "aa" ? `Codon ${hovered.d.codon + 1} in protein ${hovered.d.prot}` :
            hovered.d.prot ? `Nucleotide ${hovered.d.x + 1} (in protein ${hovered.d.prot})` :
              `Nucleotide ${hovered.d.x + 1}`}
        </div>
        <p/>
        <div>
          {`Entropy: ${hovered.d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
          Click to color tree & map
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
