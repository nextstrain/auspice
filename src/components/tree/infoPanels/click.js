import React from "react";
import { isValueValid } from "../../../util/globals";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTraitFromNode, getFullAuthorInfoFromNode, getVaccineFromNode,
  getAccessionFromNode, getUrlFromNode,
  collectMutations, getAllAttributesFromNode } from "../../../util/treeMiscHelpers";

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
    <td style={infoPanelStyles.item}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">{value}</a>
      ) :
        value}
    </td>
  </tr>
);

const formatURL = (url) => {
  if (url !== undefined && url.startsWith("https_")) {
    return url.replace("https_", "https:");
  } if (url !== undefined && url.startsWith("http_")) {
    return url.replace("http_", "http:");
  }
  return url;
};

const Link = ({url, title, value}) => (
  <tr>
    <th style={infoPanelStyles.item}>{title}</th>
    <td style={infoPanelStyles.item}>
      <a href={url} target="_blank" rel="noopener noreferrer">{value}</a>
    </td>
  </tr>
);

/**
 * Render a 2-column table of gene -> mutations.
 * Rows are sorted by gene name, alphabetically, with "nuc" last.
 * Mutations are sorted by genomic position.
 * todo: sort genes by position in genome
 * todo: provide in-app links from mutations to color-bys? filters?
 */
const MutationTable = ({mutations}) => {
  const geneSortFn = (a, b) => {
    if (a[0]==="nuc") return 1;
    if (b[0]==="nuc") return -1;
    return a[0]<b[0] ? -1 : 1;
  };
  const mutSortFn = (a, b) => {
    const [aa, bb] = [parseInt(a.slice(1, -1), 10), parseInt(b.slice(1, -1), 10)];
    return aa<bb ? -1 : 1;
  };
  // we encode the table here (rather than via `item()`) to set component keys appropriately
  return (
    <tr key="Mutations">
      <th style={infoPanelStyles.item}>Mutations from root</th>
      <td style={infoPanelStyles.item}>
        {
          Object.entries(mutations)
          .sort(geneSortFn)
          .map(([gene, muts]) => (
            <div style={{...infoPanelStyles.item, ...{fontWeight: 300}}}>
              {gene}
              :
              {muts.sort(mutSortFn).join(", ")}
            </div>
          ))
        }
      </td>
    </tr>
  );
};

const AccessionAndUrl = ({node}) => {
  const accession = getAccessionFromNode(node);
  const url = getUrlFromNode(node);
  const genbank_accession = getTraitFromNode(node, "genbank_accession");

  /* `gisaid_epi_isl` is a special value attached to nodes introduced during the 2019 nCoV outbreak.
  If set, the display is different from the normal behavior */
  const gisaid_epi_isl = getTraitFromNode(node, "gisaid_epi_isl");
  if (isValueValid(gisaid_epi_isl)) {
    return (
      <>
        <Link title="GISAID EPI ISL" value={gisaid_epi_isl.split("_")[2]} url="https://gisaid.org"/>
        {isValueValid(genbank_accession) ?
          <Link title="Genbank accession" value={genbank_accession} url={"https://www.ncbi.nlm.nih.gov/nuccore/" + genbank_accession}/> :
          null}
      </>
    );
  }

  if (isValueValid(genbank_accession)) {
    return (
      <Link title="Genbank accession" value={genbank_accession} url={"https://www.ncbi.nlm.nih.gov/nuccore/" + genbank_accession}/>
    );
  } if (isValueValid(accession) && isValueValid(url)) {
    return (
      <Link url={formatURL(url)} value={accession} title="Accession"/>
    );
  } if (isValueValid(accession)) {
    return (
      item("Accession", accession)
    );
  } if (isValueValid(url)) {
    return (
      <Link title="Strain URL" url={formatURL(url)} value="click here"/>
    );
  }
  return null;
};

const VaccineInfo = ({node, t}) => {
  const vaccineInfo = getVaccineFromNode(node);
  if (!vaccineInfo) return null;
  const renderElements = [];
  if (vaccineInfo.selection_date) {
    renderElements.push(
      <tr key="seldate">
        <th>{t("Vaccine selected")}</th>
        <td>{vaccineInfo.selection_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.start_date) {
    renderElements.push(
      <tr key="startdate">
        <th>{t("Vaccine start date")}</th>
        <td>{vaccineInfo.start_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.end_date) {
    renderElements.push(
      <tr key="enddate">
        <th>{t("Vaccine end date")}</th>
        <td>{vaccineInfo.end_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.serum) {
    renderElements.push(
      <tr key="serum">
        <th>{t("Serum strain")}</th>
        <td/>
      </tr>
    );
  }
  return renderElements;
};

const PublicationInfo = ({node, t}) => {
  const info = getFullAuthorInfoFromNode(node);
  if (!info) return null;

  const itemsToRender = [];
  itemsToRender.push(item(t("Authors"), info.value));
  if (info.title && info.title !== "?") {
    if (info.paper_url && info.paper_url !== "?") {
      itemsToRender.push(item(t("Title"), info.title, info.paper_url));
    } else {
      itemsToRender.push(item(t("Title"), info.title));
    }
  }
  if (info.journal && info.journal !== "?") {
    itemsToRender.push(item(t("Journal"), info.journal));
  }
  return (itemsToRender.length === 1 ? itemsToRender[0] : itemsToRender);
};

const StrainName = ({children}) => (
  <p style={infoPanelStyles.modalHeading}>{children}</p>
);

const SampleDate = ({node, t}) => {
  const date = getTraitFromNode(node, "num_date");
  if (!date) return null;

  const dateUncertainty = getTraitFromNode(node, "num_date", {confidence: true});
  if (date && dateUncertainty && dateUncertainty[0] !== dateUncertainty[1]) {
    return (
      <>
        {item(t("Inferred collection date"), numericToCalendar(date))}
        {item(t("Date Confidence Interval"), `(${numericToCalendar(dateUncertainty[0])}, ${numericToCalendar(dateUncertainty[1])})`)}
      </>
    );
  }

  return item(t("Collection date"), numericToCalendar(date));
};

const getTraitsToDisplay = (node) => {
  // TODO -- this should be centralised somewhere
  if (!node.node_attrs) return [];
  const ignore = ["author", "div", "num_date", "gisaid_epi_isl", "genbank_accession"];
  return Object.keys(node.node_attrs).filter((k) => !ignore.includes(k));
};

const Trait = ({node, trait, colorings}) => {
  const value_tmp = getTraitFromNode(node, trait);
  let value = value_tmp;
  if (typeof value_tmp === "number") {
    if (!Number.isInteger(value_tmp)) {
      value = Number.parseFloat(value_tmp).toPrecision(3);
    }
  }
  const name = (colorings && colorings[trait] && colorings[trait].title) ?
    colorings[trait].title :
    trait;
  return isValueValid(value) ? item(name, value) : null;
};

const OtherFields = ({node, t}) => {
  const others = getAllAttributesFromNode(node);
  const exceptions = ["accession", "url", "vaccine", "div", "author", "file_name", "file_size",
    "md5sum", "num_date", "country", "region", "mutations", "division", "location", "object_id",
    "clade_membership"
  ];
  const itemsToRender = [];
  others.forEach(([key, value]) => {
    if (!exceptions.includes(key)) {
      itemsToRender.push(item(t(key[0].toUpperCase() + key.slice(1)), value.value));
    }
  });
  return itemsToRender;
};

/**
 * A React component to display information about a tree tip in a modal-overlay style
 * @param  {Object}   props
 * @param  {Object}   props.tip              tip node selected
 * @param  {function} props.goAwayCallback
 * @param  {object}   props.colorings
 */
const TipClickedPanel = ({tip, goAwayCallback, colorings, t}) => {
  if (!tip) {return null;}
  const panelStyle = { ...infoPanelStyles.panel};
  panelStyle.maxHeight = "70%";
  const node = tip.n;
  const mutationsToRoot = collectMutations(node);
  return (
    <div style={infoPanelStyles.modalContainer}
      onClick={() => goAwayCallback(tip)}
      onKeyDown={() => goAwayCallback(tip)}
    >
      <div className="panel"
        style={panelStyle}
        onClick={(e) => stopProp(e)}
        onKeyDown={(e) => stopProp(e)}
      >
        <StrainName>{node.name}</StrainName>
        <table>
          <tbody>
            <VaccineInfo node={node} t={t}/>
            <SampleDate node={node} t={t}/>
            <PublicationInfo node={node} t={t}/>
            {getTraitsToDisplay(node).map((trait) => (
              <Trait node={node} trait={trait} colorings={colorings} key={trait}/>
            ))}
            <AccessionAndUrl node={node}/>
            <OtherFields node={node} t={t}/>
            {item("", "")}
            <MutationTable mutations={mutationsToRoot}/>
          </tbody>
        </table>
        <p style={infoPanelStyles.comment}>
          {t("Click outside this box to go back to the tree")}
        </p>
      </div>
    </div>
  );
};

export default TipClickedPanel;
