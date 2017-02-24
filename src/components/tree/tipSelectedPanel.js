import React from "react";
import * as globalStyles from "../../globalStyles";
import * as globals from "../../util/globals";
import {dataFont} from "../../globalStyles";

const prettyString = (x) => {
  return x.replace("_", " ")
          .replace(/\w\S*/g, (y) => y.charAt(0).toUpperCase() + y.substr(1).toLowerCase());
};

const TipSelectedPanel = ({tip, goAwayCallback}) => {
  const styles = {
    container: {
      backgroundColor: "rgba(80, 80, 80, .20)",
      position: "absolute",
      width: "100%",
      height: "100%",
      pointerEvents: "all",
      top: 0,
      left: 0,
      zIndex: 2000,
      /* FLEXBOX */
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    },
    panel: {
      position: "relative",
      paddingLeft: 30,
      padding: "5% 5%",
      borderRadius: 5,
      backgroundColor: globalStyles.darkGrey,
      color: "white",
      fontFamily: dataFont,
      fontSize: 18,
      lineHeight: 1,
      fontWeight: 300
    },
    heading: {
      fontSize: 24,
      fontWeight: 400
    },
    list: {
      listStyleType: "disc"
    },
    comment: {
      fontStyle: "italic",
      fontWeight: 200,
      fontSize: 14
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
    if (!tip) {return null;}
    return (
      <div style={styles.container} onClick={() => goAwayCallback(tip)}>
        <div className={"panel"} style={styles.panel}>
          <p style={styles.heading}>
            {`${tip.n.strain}`}
          </p>
          <table>
            <tbody>
              <tr>
                <th>Paper</th>
                <td>{tip.n.attr.authors}</td>
              </tr>
              <tr>
                <th>Date</th>
                <td>{prettyString(tip.n.attr.date)}</td>
              </tr>
              <tr>
                <th>Region</th>
                <td>{prettyString(tip.n.attr.region)}</td>
              </tr>
              <tr>
                <th>Country</th>
                <td>{prettyString(tip.n.attr.country)}</td>
              </tr>
              <tr>
                <th>Division</th>
                <td>{prettyString(tip.n.attr.division)}</td>
              </tr>
              <tr>
                <th>Database</th>
                <td>{prettyString(tip.n.attr.db)}</td>
              </tr>
              <tr>
                <th>NCBI link</th>
                <td>to do</td>
              </tr>
              <tr>
                <th>Accession</th>
                <td>{tip.n.attr.accession}</td>
              </tr>
            </tbody>
          </table>
          <p style={styles.comment}>
            Click outside this box to go back to the tree
          </p>
        </div>
      </div>
    );
  };

  return (
    makePanel()
  );
};

export default TipSelectedPanel;
