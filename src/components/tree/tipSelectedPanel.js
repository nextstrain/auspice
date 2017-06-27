/*eslint-env browser*/
import React from "react";
import {infoPanelStyles} from "../../globalStyles";

export const prettyString = (x, multiplier = false) => {
  if (!x) {
    return "";
  }
  if (typeof x === "string") {
    if (["usvi", "usa", "uk"].indexOf(x.toLowerCase()) !== -1) {
      return x.toUpperCase();
    }
    return x.replace(/_/g, " ")
            .replace(/\w\S*/g, (y) => y.charAt(0).toUpperCase() + y.substr(1).toLowerCase());
  } else if (typeof x === "number") {
    const val = parseFloat(x);
    const magnitude = Math.ceil(Math.log10(Math.abs(val) + 1e-10));
    return multiplier ? val.toFixed(5 - magnitude) + "\u00D7" : val.toFixed(5 - magnitude);
  }
  return x;
};

const authorString = (x) => {
  const y = prettyString(x);
  if (y.indexOf("Et Al") !== -1) {
    return (<span>{y.replace(" Et Al", "")}<em> et al</em></span>);
  }
  return y;
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
      alignItems: "center",
      wordWrap: "break-word",
      wordBreak: "break-word"
    }
  };

  const stopProp = (e) => {
    if (!e) {e = window.event;}
    e.cancelBubble = true;
    if (e.stopPropagation) {e.stopPropagation();}
  };

  const makePanel = () => {
    if (!tip) {return null;}
    let url = tip.n.attr.url;
    if (url !== undefined && url.startsWith("https_")) {
      url = url.replace("https_", "https:");
    } else if (url !== undefined && url.startsWith("http_")) {
      url = url.replace("http_", "http:");
    }
    return (
      <div style={styles.container} onClick={() => goAwayCallback(tip)}>
        <div className={"panel"} style={infoPanelStyles.panel} onClick={(e) => stopProp(e)}>
          <p style={infoPanelStyles.modalHeading}>
            {`${tip.n.strain}`}
          </p>
          <table>
            <tbody>
              <tr>
                <th width={130}>Region</th>
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
                <th>Collection date</th>
                <td>{prettyString(tip.n.attr.date)}</td>
              </tr>
              <tr>
                <th>Authors</th>
                <td>{authorString(tip.n.attr.authors)}</td>
              </tr>
              <tr>
                <th>Accession</th>
                <td>{tip.n.attr.accession}</td>
              </tr>
              <tr>
                <th>URL</th>
                <td><a href={url} target="_blank">{url}</a></td>
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
