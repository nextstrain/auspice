import React from "react";
import { isValueValid } from "../../../util/globals";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTraitFromNode } from "../../../util/treeMiscHelpers";

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
const item = (key, value, href) => (
  <tr key={key}>
    <th style={infoPanelStyles.item}>{key}</th>
    <td style={infoPanelStyles.item}>{href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">{value}</a>
    ) :
      value
    }</td>
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

const accessionAndUrl = (node) => {
  const accession = getTraitFromNode(node, "accession");
  const url = getTraitFromNode(node, "url");

  if (isValueValid(accession) && isValueValid(url)) {
    return (
      <tr>
        <th style={infoPanelStyles.item}>Accession</th>
        <td style={infoPanelStyles.item}>
          <a href={formatURL(url)} target="_blank">{accession}</a>
        </td>
      </tr>
    );
  } else if (isValueValid(accession)) {
    return (
      item("Accession", accession)
    );
  } else if (isValueValid(url)) {
    return (
      <tr>
        <th style={infoPanelStyles.item}>URL</th>
        <td style={infoPanelStyles.item}>
          <a href={formatURL(url)} target="_blank"><em>click here</em></a>
        </td>
      </tr>
    );
  }
  return null;
};


const displayVaccineInfo = (d) => {
  if (d.n.vaccine) {
    const els = [];
    if (d.n.vaccine.selection_date) {
      els.push(
        <tr key={"seldate"}>
          <th>Vaccine selected</th>
          <td>{d.n.vaccine.selection_date}</td>
        </tr>
      );
    }
    if (d.n.vaccine.start_date) {
      els.push(
        <tr key={"startdate"}>
          <th>Vaccine start date</th>
          <td>{d.n.vaccine.start_date}</td>
        </tr>
      );
    }
    if (d.n.vaccine.end_date) {
      els.push(
        <tr key={"enddate"}>
          <th>Vaccine end date</th>
          <td>{d.n.vaccine.end_date}</td>
        </tr>
      );
    }
    if (d.n.vaccine.serum) {
      els.push(
        <tr key={"serum"}>
          <th>Serum strain</th>
          <td/>
        </tr>
      );
    }
    return els;
  }
  return null;
};

const displayPublicationInfo = (info) => {
  if (!info) {
    return null;
  }
  const itemsToRender = [];
  itemsToRender.push(item("Authors", info.value));
  if (info.title && info.title !== "?") {
    if (info.paper_url && info.paper_url !== "?") {
      itemsToRender.push(item("Title", info.title, info.paper_url));
    } else {
      itemsToRender.push(item("Title", info.title));
    }
  }
  if (info.journal && info.journal !== "?") {
    itemsToRender.push(item("Journal", info.journal));
  }
  return (itemsToRender.length === 1 ? itemsToRender[0] : itemsToRender);
};

const TipClickedPanel = ({tip, goAwayCallback}) => {
  if (!tip) {return null;}

  const date = getTraitFromNode(tip.n, "num_date");
  const dateUncertainty = getTraitFromNode(tip.n, "num_date", {confidence: true});
  const showDateUncertainty = date && dateUncertainty && dateUncertainty[0] !== dateUncertainty[1];

  return (
    <div style={infoPanelStyles.modalContainer} onClick={() => goAwayCallback(tip)}>
      <div className={"panel"} style={infoPanelStyles.panel} onClick={(e) => stopProp(e)}>
        <p style={infoPanelStyles.modalHeading}>
          {`${getTraitFromNode(tip.n, "name")}`}
        </p>
        <table>
          <tbody>
            {displayVaccineInfo(tip) /* vaccine information (if applicable) */}
            {/* the "basic" attributes (which may not exist in certain datasets) */}
            {/* TODO - we should scan all colorings here */}
            {["country", "region", "division"].map((x) => {
              const value = getTraitFromNode(tip.n, x);
              return isValueValid(value) ? item(x, value) : null;
            })}
            {/* Dates */}
            {date ? item(
              showDateUncertainty ? "Inferred collection date" : "Collection date",
              numericToCalendar(date)
            ) : null}
            {showDateUncertainty ? (
              item("Collection date confidence", `(${numericToCalendar(dateUncertainty[0])}, ${numericToCalendar(dateUncertainty[1])})`)
            ) : null}
            {/* Author / Paper information */}
            {displayPublicationInfo(getTraitFromNode(tip.n, "author", {fullAuthorInfo: true}))}
            {/* try to join URL with accession, else display the one that's available */}
            {accessionAndUrl(tip.n)}
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
