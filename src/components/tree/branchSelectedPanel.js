import React from "react";
import { infoPanelStyles, dataFont } from "../../globalStyles";

const BranchSelectedPanel = ({branch, viewEntireTreeCallback, responsive}) => {
  if (!branch) {return null;}

  const styles = {
    container: {
      position: "absolute",
      verticalAlign: "top",
      right: 5, height: 18, top: 3,
      width: responsive.width - 30 /* paddingRight */ - 10, /*left + right space*/
      paddingTop: 7, paddingBottom: 9, paddingLeft: 10, paddingRight: 30,
      borderRadius: 5,
      pointerEvents: "all",
      backgroundColor: "rgba(151, 155, 155, 0.85)",
      zIndex: 1000,
      color: "#fff",
      fontFamily: dataFont, fontSize: 14, fontWeight: 400
    }
  };

  let text = [`Branch selected with ${branch.n.fullTipCount} sequences`, "Return to entire tree"];
  if (responsive.width < 500) {
    text = ["Branch selected", "Reset"];
  }
  return (
    <div style={styles.container}>
      <span style={infoPanelStyles.branchInfoHeading}>{text[0]}</span>
      <button style={infoPanelStyles.buttonLink} onClick={viewEntireTreeCallback}>
        {text[1]}
      </button>
    </div>
  );
};

export default BranchSelectedPanel;
