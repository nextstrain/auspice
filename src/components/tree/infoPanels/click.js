import React from "react";
import { isValueValid } from "../../../util/globals";
import { infoPanelStyles } from "../../../globalStyles";
import { numericToCalendar } from "../../../util/dateHelpers";
import { getTraitFromNode, getFullAuthorInfoFromNode, getVaccineFromNode,
  getAccessionFromNode, getUrlFromNode, collectMutations } from "../../../util/treeMiscHelpers";
import { changePage } from "../../../actions/navigation";

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
const item = (key, value, href, onClick) => (
  <tr key={key}>
    <th style={infoPanelStyles.item}>{key}</th>
    <td style={infoPanelStyles.item}>{href ? (
      <a href={href} target="_blank" rel="noopener noreferrer">{value}</a>
    ) : onClick ? (
      <span style={infoPanelStyles.link} onClick={onClick}>{value}</span>
    ) :
      value
    }</td>
  </tr>
);

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
    <tr key={"Mutations"}>
      <th style={infoPanelStyles.item}>{"Mutations from root"}</th>
      <td style={infoPanelStyles.item}>{
        Object.entries(mutations)
          .sort(geneSortFn)
          .map(([gene, muts]) => (
            <div style={{...infoPanelStyles.item, ...{fontWeight: 300}}}>
              {gene}: {muts.sort(mutSortFn).join(", ")}
            </div>
          ))
      }</td>
    </tr>
  );
};


const AccessionAndUrl = ({node}) => {
  /* If `gisaid_epi_isl` or `genbank_accession` exist as node attrs, these preempt normal use of `accession` and `url`.
  These special values were introduced during the SARS-CoV-2 pandemic. */
  const gisaid_epi_isl = getTraitFromNode(node, "gisaid_epi_isl");
  const genbank_accession = getTraitFromNode(node, "genbank_accession");
  let gisaid_epi_isl_url = null;
  let genbank_accession_url = null;
  if (isValueValid(gisaid_epi_isl)) {
    const gisaid_epi_isl_number = gisaid_epi_isl.split("_")[2];
    // slice has to count from the end of the string rather than the beginning to deal with EPI ISLs of different lengths, eg
    // https://www.epicov.org/acknowledgement/67/98/EPI_ISL_406798.json
    // https://www.epicov.org/acknowledgement/99/98/EPI_ISL_2839998.json
    if (gisaid_epi_isl_number.length > 4) {
      gisaid_epi_isl_url = "https://www.epicov.org/acknowledgement/" + gisaid_epi_isl_number.slice(-4, -2) + "/" + gisaid_epi_isl_number.slice(-2) + "/" + gisaid_epi_isl + ".json";
    } else {
      gisaid_epi_isl_url = "https://gisaid.org";
    }
  }
  if (isValueValid(genbank_accession)) {
    genbank_accession_url = "https://www.ncbi.nlm.nih.gov/nuccore/" + genbank_accession;
  }
  if (isValueValid(gisaid_epi_isl) && isValueValid(genbank_accession)) {
    return (
      <>
        <Link title={"GISAID EPI ISL"} value={gisaid_epi_isl} url={gisaid_epi_isl_url}/>
        <Link title={"Genbank accession"} value={genbank_accession} url={genbank_accession_url}/>
      </>
    );
  } else if (isValueValid(gisaid_epi_isl)) {
    return (
      <Link title={"GISAID EPI ISL"} value={gisaid_epi_isl} url={gisaid_epi_isl_url}/>
    );
  } else if (isValueValid(genbank_accession)) {
    return (
      <Link title={"Genbank accession"} value={genbank_accession} url={genbank_accession_url}/>
    );
  }

  const {accession, url} = getAccessionFromNode(node);
  if (accession && url) {
    return (
      <Link url={url} value={accession} title={"Accession"}/>
    );
  } else if (accession) {
    return (
      item("Accession", accession)
    );
  } else if (url) {
    return (
      <Link title={"Strain URL"} url={url} value={"click here"}/>
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
      <tr key={"seldate"}>
        <th>{t("Vaccine selected")}</th>
        <td>{vaccineInfo.selection_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.start_date) {
    renderElements.push(
      <tr key={"startdate"}>
        <th>{t("Vaccine start date")}</th>
        <td>{vaccineInfo.start_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.end_date) {
    renderElements.push(
      <tr key={"enddate"}>
        <th>{t("Vaccine end date")}</th>
        <td>{vaccineInfo.end_date}</td>
      </tr>
    );
  }
  if (vaccineInfo.serum) {
    renderElements.push(
      <tr key={"serum"}>
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
  const ignore = ["author", "div", "num_date", "gisaid_epi_isl", "genbank_accession", "accession", "url"];
  return Object.keys(node.node_attrs).filter((k) => !ignore.includes(k));
};

const Trait = ({node, trait, colorings, dispatch}) => {
  const value_tmp = getTraitFromNode(node, trait);
  let value = value_tmp;
  if (typeof value_tmp === "number") {
    if (!Number.isInteger(value_tmp)) {
      value = Number.parseFloat(value_tmp).toPrecision(3);
    }
  }
  if (!isValueValid(value)) return null;

  const name = (colorings && colorings[trait] && colorings[trait].title) ?
    colorings[trait].title :
    trait;

  const changeDatasetAction = experimentalMakeChangeDatasetAction(node, trait, dispatch);
  if (changeDatasetAction) {
    return item(name, value, undefined, changeDatasetAction);
  }

  const url = getUrlFromNode(node, trait);
  if (url) {
    return <Link title={name} url={url} value={value}/>;
  }
  return item(name, value);
};

/**
 * A React component to display information about a tree tip in a modal-overlay style
 * @param  {Object}   props
 * @param  {Object}   props.tip              tip node selected
 * @param  {function} props.goAwayCallback
 * @param  {object}   props.colorings
 */
const TipClickedPanel = ({tip, goAwayCallback, colorings, t, dispatch}) => {
  if (!tip) {return null;}
  const panelStyle = { ...infoPanelStyles.panel};
  panelStyle.maxHeight = "70%";
  const node = tip.n;
  const mutationsToRoot = collectMutations(node);
  return (
    <div style={infoPanelStyles.modalContainer} onClick={() => goAwayCallback(tip)}>
      <div className={"panel"} style={panelStyle} onClick={(e) => stopProp(e)}>
        <StrainName>{node.name}</StrainName>
        <table>
          <tbody>
            <VaccineInfo node={node} t={t}/>
            <SampleDate node={node} t={t}/>
            <PublicationInfo node={node} t={t}/>
            {getTraitsToDisplay(node).map((trait) => (
              <Trait node={node} trait={trait} colorings={colorings} key={trait} dispatch={dispatch}/>
            ))}
            <AccessionAndUrl node={node}/>
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

function experimentalMakeChangeDatasetAction(node, trait, dispatch) {
  if (!node.node_attrs || !node.node_attrs[trait] || !node.node_attrs[trait].dataset) return undefined;
  const dataset = node.node_attrs[trait].dataset;
  // todo: best-effort validation of `dataset`
  return () => dispatch(changePage({path: dataset}));
}
