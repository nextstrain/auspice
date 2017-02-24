import React from "react";
import * as globalStyles from "../../globalStyles";
import * as globals from "../../util/globals";
import {dataFont, materialButtonOutline} from "../../globalStyles";

const BranchSelectedPanel = ({branch, viewEntireTreeCallback, responsive}) => {

  const styles = {
    container: {
      // width: responsive.width - 280 /*legend*/ - 35 /*padding*/,
      position: "absolute",
      // left: 280 /* legend width */ + 20, // RESPOND TO LEGEND COLLAPSE!
      left: 5,
      width: responsive.width - 30 /* paddingRight */ - 10 /*left + right space*/,
      top: 5,
      paddingTop: 7,
      paddingBottom: 5,
      paddingLeft: 10,
      paddingRight: 30,
      borderRadius: 5,
      pointerEvents: "all",
      // backgroundColor: "rgba(255,255,255,.85)",
      backgroundColor: "rgba(174, 182, 191, .85)", // "rgba(255,255,255,.85)"
      zIndex: 1000,
      fontFamily: dataFont,
      fontSize: 14,
      lineHeight: .8
    },
    link: {
      // display: "inline",
      float: "right",
      fontFamily: dataFont,
      fontSize: 14,
      textDecoration: "none",
      pointerEvents: "auto",
      lineHeight: .8,
      backgroundColor: "#888",
      color: "white", // link color
      cursor: "pointer",
      // textTransform: "uppercase",
      border: "none",
      borderRadius: 3
      // ...materialButtonOutline
    }
  };

  const makePanel = () => {
    if (!branch) {return null;}
    let text = [`Branch selected with ${branch.n.fullTipCount} sequences.`,
      "Return to entire tree"];
    if (responsive.width < 500) {
      text = ["Branch selected", "Reset"];
    }
    return (
      <div style={styles.container}>
        {text[0]}
        <button style={styles.link} onClick={() => viewEntireTreeCallback()}>
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
