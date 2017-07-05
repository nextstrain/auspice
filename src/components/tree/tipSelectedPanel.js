/*eslint-env browser*/
/*eslint max-len: 0*/
import React from "react";
import {infoPanelStyles} from "../../globalStyles";
import {prettyString, authorString} from "../../util/stringHelpers";
import { floatDateToMoment } from "../../util/dateHelpers";

const styles = {
  container: {
    position: "absolute",
    width: "100%", height: "100%",
    pointerEvents: "all",
    top: 0, left: 0,
    zIndex: 2000,
    backgroundColor: "rgba(80, 80, 80, .20)",
    /* FLEXBOX */
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    wordWrap: "break-word", wordBreak: "break-word"
  }
};

const stopProp = (e) => {
  if (!e) {e = window.event;}
  e.cancelBubble = true;
  if (e.stopPropagation) {e.stopPropagation();}
};

/* min width to get "collection date" on 1 line: 120 */
const item = (key, value) => (
  <tr key={key}>
    <th style={{minWidth: 120}}>{key}</th>
    <td>{value}</td>
  </tr>
);

const formatURL = (url) => {
  if (url !== undefined && url.startsWith("https_")) {
    url = url.replace("https_", "https:");
  } else if (url !== undefined && url.startsWith("http_")) {
    url = url.replace("http_", "http:");
  }
  return url;
};

const dateConfidence = (x) => (
  item("Collection date confidence", `(${floatDateToMoment(x[0]).format("YYYY-MM-DD")}, ${floatDateToMoment(x[1]).format("YYYY-MM-DD")})`)
);

const accessionAndURL = (url, accession) => (
  <tr>
    <th>Accession</th>
    <td><a href={url} target="_blank">{accession}</a></td>
  </tr>
);

const justURL = (url) => (
  <tr>
    <th>URL</th>
    <td><a href={url} target="_blank"><em>click here</em></a></td>
  </tr>
);

const TipSelectedPanel = ({tip, goAwayCallback}) => {
  if (!tip) {return null;}
  const url = formatURL(tip.n.attr.url);
  const uncertainty = "num_date_confidence" in tip.n.attr && tip.n.attr.num_date_confidence[0] !== tip.n.attr.num_date_confidence[1];
  return (
    <div style={styles.container} onClick={() => goAwayCallback(tip)}>
      <div className={"panel"} style={infoPanelStyles.panel} onClick={(e) => stopProp(e)}>
        <p style={infoPanelStyles.modalHeading}>
          {`${tip.n.strain}`}
        </p>
        <table>
          <tbody>
            {/* the "basic" attributes (which may not exist in certain datasets) */}
            {["country", "region", "division"].map((x) => {
              return (x in tip.n.attr) ? item(prettyString(x), prettyString(tip.n.attr[x])) : null;
            })}
            {/* Dates */}
            {item(uncertainty ? "Inferred collection date" : "Collection date", prettyString(tip.n.attr.date))}
            {uncertainty ? dateConfidence(tip.n.attr.num_date_confidence) : null}
            {/* authors (if provided) */}
            {("authors" in tip.n.attr) ? item("Publication", authorString(tip.n.attr.authors)) : null}
            {/* try to join URL with accession, else display the one that's available */}
            {url !== undefined && ("accession" in tip.n.attr) ?
              accessionAndURL(url, tip.n.attr.accession) :
              url !== undefined ? justURL(url) :
              ("accession" in tip.n.attr) ? item("Accession", tip.n.attr.accession) :
              null
            }
          </tbody>
        </table>
        <p style={infoPanelStyles.comment}>
          Click outside this box to go back to the tree
        </p>
      </div>
    </div>
  );
};

export default TipSelectedPanel;
