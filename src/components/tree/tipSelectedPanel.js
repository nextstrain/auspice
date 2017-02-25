import React from "react";
import {infoPanelStyles} from "../../globalStyles";

export const prettyString = (x) => {
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
    }
  };

  const makePanel = () => {
    if (!tip) {return null;}
    return (
      <div style={styles.container} onClick={() => goAwayCallback(tip)}>
        <div className={"panel"} style={infoPanelStyles.panel}>
          <p style={infoPanelStyles.modalHeading}>
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
          <p style={infoPanelStyles.comment}>
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
