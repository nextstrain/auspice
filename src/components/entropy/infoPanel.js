import React from "react";
import { infoPanelStyles } from "../../globalStyles";

const InfoPanel = ({hovered, width, height, mutType, showCounts, geneMap}) => {
  /* this is a function - we can bail early */
  if (!hovered) {
    return null;
  }

  const styles = {
    container: {
      position: "absolute",
      width: 200,
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

  if (pos.x < width * 0.7) {
    styles.container.left = pos.x;
  } else {
    styles.container.right = width - pos.x;
  }
  if (pos.y < height * 0.5) {
    styles.container.top = pos.y;
  } else {
    styles.container.bottom = height - pos.y;
  }

  const isNegStrand = hovered.d.prot ? geneMap[hovered.d.prot].strand === "-" : null;

  const nucPos = hovered.d.prot ?
    mutType === "aa" ?
      isNegStrand ? geneMap[hovered.d.prot].end - hovered.d.codon * 3 + 3 :
        geneMap[hovered.d.prot].start + hovered.d.codon * 3
      : isNegStrand ? geneMap[hovered.d.prot].end - hovered.d.x :
        hovered.d.x - geneMap[hovered.d.prot].start-1
    : null;

  const codonFromNuc = hovered.d.prot && mutType !== "aa" ? Math.floor((nucPos)/3) + 1 : null;

  return (
    <div style={styles.container}>
      <div className={"tooltip"} style={infoPanelStyles.tooltip}>
        <div>
          {mutType === "aa" ? `Codon ${hovered.d.codon} in protein ${hovered.d.prot}` :
            hovered.d.prot ? `Nucleotide ${hovered.d.x} (codon ${codonFromNuc} in protein ${hovered.d.prot})` :
              `Nucleotide ${hovered.d.x}`}
        </div>
        <p/>
        <div>
          {mutType === "aa" ? `Nuc positions ${nucPos-2} to ${nucPos}` : ``}
        </div>
        <p/>
        <div>
          {isNegStrand === null ? `` : isNegStrand ? `Negative strand` : `Positive strand`}
        </div>
        <p/>
        <div>
          {showCounts ? `Num mutations: ${hovered.d.y}` : `entropy: ${hovered.d.y}`}
        </div>
        <div style={infoPanelStyles.comment}>
          Click to color tree & map
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
