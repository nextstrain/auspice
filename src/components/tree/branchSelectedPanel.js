import React from "react";
import {infoPanelStyles, dataFont} from "../../globalStyles";

const BranchSelectedPanel = ({branch, viewEntireTreeCallback, responsive}) => {

  const styles = {
    container: {
      // width: responsive.width - 280 /*legend*/ - 35 /*padding*/,
      position: "absolute",
      // left: 280 /* legend width */ + 20, // RESPOND TO LEGEND COLLAPSE!
      right: 5,
      width: responsive.width - 30 /* paddingRight */ - 10 /*left + right space*/,
      height: 18,
      top: 3,
      paddingTop: 7,
      paddingBottom: 9,
      paddingLeft: 10,
      paddingRight: 30,
      borderRadius: 5,
      pointerEvents: "all",
      backgroundColor: "rgba(151, 155, 155, 0.85)",
    //  backgroundColor: "rgba(174, 182, 191, .85)", // "rgba(255,255,255,.85)"
      zIndex: 1000,
      color: "#fff",
      fontFamily: dataFont,
      fontSize: 14,
      fontWeight: 400,
      verticalAlign: "top"
    }
  };

  const makePanel = () => {
    if (!branch) {return null;}
    let text = [`Branch selected with ${branch.n.fullTipCount} sequences`,
      "Return to entire tree"];
    if (responsive.width < 500) {
      text = ["Branch selected", "Reset"];
    }
    return (
      <div style={styles.container}>
        <span style={infoPanelStyles.branchInfoHeading}>{text[0]}</span>
        <button style={infoPanelStyles.buttonLink} onClick={() => viewEntireTreeCallback()}>
          {text[1]}
        </button>
      </div>
    );
  };

  return (
    makePanel()
  );
};

export default BranchSelectedPanel;
