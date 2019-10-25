import React from "react";
import { isValueValid } from "../../../util/globals";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTraitFromNode, getFullAuthorInfoFromNode, getVaccineFromNode } from "../../../util/treeMiscHelpers";

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

const AccessionAndUrl = ({node}) => {
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


const VaccineInfo = ({node}) => {
  const vaccineInfo = getVaccineFromNode(node);
  if (!vaccineInfo) return null;
  const renderElements = [];
  if (vaccineInfo.selection_date) {
    renderElements.push(
      <tr key={"seldate"}>
        <th>Vaccine selected</th>
        <td>{vaccineInfo.selection_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.start_date) {
    renderElements.push(
      <tr key={"startdate"}>
        <th>Vaccine start date</th>
        <td>{vaccineInfo.start_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.end_date) {
    renderElements.push(
      <tr key={"enddate"}>
        <th>Vaccine end date</th>
        <td>{vaccineInfo.end_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.serum) {
    renderElements.push(
      <tr key={"serum"}>
        <th>Serum strain</th>
        <td/>
      </tr>
    );
  }
  return renderElements;
};

const PublicationInfo = ({node}) => {
  const info = getFullAuthorInfoFromNode(node);
  if (!info) return null;

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

const StrainName = ({children}) => (
  <p style={infoPanelStyles.modalHeading}>{children}</p>
);

const SampleDate = ({node}) => {
  const date = getTraitFromNode(node, "num_date");
  if (!date) return null;

  const dateUncertainty = getTraitFromNode(node, "num_date", {confidence: true});
  if (date && dateUncertainty && dateUncertainty[0] !== dateUncertainty[1]) {
    return (
      <>
        {item("Inferred collection date", numericToCalendar(date))}
        {item("Collection date confidence", `(${numericToCalendar(dateUncertainty[0])}, ${numericToCalendar(dateUncertainty[1])})`)}
      </>
    );
  }

  return item("Collection date", numericToCalendar(date));
};

const getTraitsToDisplay = (node) => {
  // TODO -- this should be centralised somewhere
  if (!node.node_attrs) return [];
  const ignore = ["author", "div", "num_date"];
  return Object.keys(node.node_attrs).filter((k) => !ignore.includes(k));
};

const Trait = ({node, trait, colorings}) => {
  const value = getTraitFromNode(node, trait);
  const name = (colorings && colorings[trait] && colorings[trait].title) ?
    colorings[trait].title :
    trait;
  return isValueValid(value) ? item(name, value) : null;
};

/**
 * A React component to display information about a tree tip in a modal-overlay style
 * @param  {Object}   props
 * @param  {Object}   props.tip              tip node selected
 * @param  {function} props.goAwayCallback
 * @param  {object}   props.colorings
 */
const TipClickedPanel = ({tip, goAwayCallback, colorings}) => {
  if (!tip) {return null;}
  const node = tip.n;
  return (
    <div style={infoPanelStyles.modalContainer} onClick={() => goAwayCallback(tip)}>
      <div className={"panel"} style={infoPanelStyles.panel} onClick={(e) => stopProp(e)}>
        <StrainName>{node.name}</StrainName>
        <table>
          <tbody>
            <VaccineInfo node={node} />
            <SampleDate node={node}/>
            <PublicationInfo node={node}/>
            {getTraitsToDisplay(node).map((trait) => (
              <Trait node={node} trait={trait} colorings={colorings} key={trait}/>
            ))}
            <AccessionAndUrl node={node}/>
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
