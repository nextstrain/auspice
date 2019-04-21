import React from "react";
import { infoPanelStyles } from "../../../globalStyles";
import { prettyString } from "../../../util/stringHelpers";
import { numericToCalendar } from "../../../util/dateHelpers";
// import { getAuthor } from "../download/helperFunctions";

export const styles = {
  container: {
    position: "absolute",
    width: "100%",
    height: "100%",
    pointerEvents: "all",
    top: 0,
    left: 0,
    zIndex: 2000,
    backgroundColor: "rgba(80, 80, 80, .20)",
    /* FLEXBOX */
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    wordWrap: "break-word",
    wordBreak: "break-word"
  }
};

export const stopProp = (e) => {
  if (!e) {e = window.event;} // eslint-disable-line no-param-reassign
  e.cancelBubble = true;
  if (e.stopPropagation) {e.stopPropagation();}
};

/* min width to get "collection date" on 1 line: 120 */
const item = (key, value) => (
  <tr key={key}>
    <th style={infoPanelStyles.item}>{key}</th>
    <td style={infoPanelStyles.item}>{value}</td>
  </tr>
);

const formatURL = (url) => {
  if (url !== undefined && url.startsWith("https_")) {
    return url.replace("https_", "https:");
  } else if (url !== undefined && url.startsWith("http_")) {
    return url.replace("http_", "http:");
  }
  return url;
};

const dateConfidence = (x) => (
  item("Collection date confidence", `(${numericToCalendar(x[0])}, ${numericToCalendar(x[1])})`)
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

const displayVaccineInfo = (d) => {
  if (d.n.vaccineDate) {
    return (
      <tr>
        <th>Vaccine strain</th>
        <td>{d.n.vaccineDate}</td>
      </tr>
    );
  }
  return null;
};

const displayPublicationInfo = (authorKey, authorInfo) => {
  if (!authorKey || !authorInfo[authorKey]) {
    return null;
  }
  const info = authorInfo[authorKey];
  const itemsToRender = [];
  itemsToRender.push(item("Authors", info.authors));
  if (info.title && info.title !== "?") itemsToRender.push(item("Title", info.title));
  if (info.journal && info.journal !== "?") itemsToRender.push(item("Journal", info.journal));
  if (info.url && info.url !== "?") itemsToRender.push(item("URL", info.url));
  if (itemsToRender.length === 1) {
    return itemsToRender[0];
  }
  return (
    itemsToRender
  );
};

const validValue = (value) => value !== "?" && value !== undefined && value !== "undefined";
const validAttr = (attrs, key) => key in attrs && validValue(attrs[key]);

const TipClickedPanel = ({tip, goAwayCallback, authorInfo}) => {
  if (!tip) {return null;}
  const url = validAttr(tip.n.attr, "url") ? formatURL(tip.n.attr.url) : false;
  const uncertainty = "num_date_confidence" in tip.n.attr && tip.n.attr.num_date_confidence[0] !== tip.n.attr.num_date_confidence[1];

  return (
    <div style={infoPanelStyles.modalContainer} onClick={() => goAwayCallback(tip)}>
      <div className={"panel"} style={infoPanelStyles.panel} onClick={(e) => stopProp(e)}>
        <p style={infoPanelStyles.modalHeading}>
          {`${tip.n.strain}`}
        </p>
        <table>
          <tbody>
            {displayVaccineInfo(tip) /* vaccine information (if applicable) */}
            {/* the "basic" attributes (which may not exist in certain datasets) */}
            {["country", "region", "division"].map((x) => {
              return validAttr(tip.n.attr, x) ? item(prettyString(x), prettyString(tip.n.attr[x])) : null;
            })}
            {/* Dates */}
            {item(uncertainty ? "Inferred collection date" : "Collection date", prettyString(tip.n.attr.date))}
            {uncertainty ? dateConfidence(tip.n.attr.num_date_confidence) : null}
            {/* Author / Paper information */}
            {displayPublicationInfo(tip.n.authors, authorInfo)}
            {/* try to join URL with accession, else display the one that's available */}
            {url && validAttr(tip.n.attr, "accession") ?
              accessionAndURL(url, tip.n.attr.accession) :
              url ? justURL(url) :
                validAttr(tip.n.attr, "accession") ? item("Accession", tip.n.attr.accession) :
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

export default TipClickedPanel;
