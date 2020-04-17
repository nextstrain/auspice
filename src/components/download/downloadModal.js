import React from "react";
import Mousetrap from "mousetrap";
import { connect } from "react-redux";
import { withTheme } from 'styled-components';
import { withTranslation } from 'react-i18next';

import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton, infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/infoPanels/click";
import * as helpers from "./helperFunctions";
import * as icons from "../framework/svg-icons";
import { getAcknowledgments} from "../framework/footer";
import { createSummary, getNumSelectedTips } from "../info/info";
import { getFullAuthorInfoFromNode } from "../../util/treeMiscHelpers";

const RectangularTreeIcon = withTheme(icons.RectangularTree);
const PanelsGridIcon = withTheme(icons.PanelsGrid);
const MetaIcon = withTheme(icons.Meta);

// const dataUsage = [
//   `The data presented here is intended to rapidly disseminate analysis of important pathogens.
//   Unpublished data is included with permission of the data generators, and does not impact their right to publish.`,
//   `Please contact the respective authors (available via the TSV files below) if you intend to carry out further research using their data.
//   Derived data, such as phylogenies, can be downloaded below - please contact the relevant authors where appropriate.`
// ];

export const publications = {
  nextstrain: {
    author: "Hadfield et al",
    title: "Nextstrain: real-time tracking of pathogen evolution",
    year: "2018",
    journal: "Bioinformatics",
    href: "https://doi.org/10.1093/bioinformatics/bty407"
  },
  treetime: {
    author: "Sagulenko et al",
    title: "TreeTime: Maximum-likelihood phylodynamic analysis",
    journal: "Virus Evolution",
    year: "2017",
    href: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5758920/"
  },
  titers: {
    author: "Neher et al",
    titleJournalYear: "Prediction, dynamics, and visualization of antigenic phenotypes of seasonal influenza viruses",
    journal: "PNAS",
    year: "2016",
    href: "http://www.pnas.org/content/113/12/E1701.abstract"
  }
};

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  show: state.controls.showDownload,
  colorBy: state.controls.colorBy,
  metadata: state.metadata,
  tree: state.tree,
  nodes: state.tree.nodes,
  visibleStateCounts: state.tree.visibleStateCounts,
  filters: state.controls.filters,
  visibility: state.tree.visibility,
  panelsToDisplay: state.controls.panelsToDisplay,
  panelLayout: state.controls.panelLayout
}))
class DownloadModal extends React.Component {
  constructor(props) {
    super(props);
    this.getStyles = (bw, bh) => {
      return {
        behind: { /* covers the screen */
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "all",
          zIndex: 2000,
          backgroundColor: "rgba(80, 80, 80, .20)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          wordWrap: "break-word",
          wordBreak: "break-word"
        },
        title: {
          fontWeight: 500,
          fontSize: 32,
          marginTop: "20px",
          marginBottom: "20px"
        },
        secondTitle: {
          fontWeight: 500,
          marginTop: "0px",
          marginBottom: "20px"
        },
        modal: {
          marginLeft: 200,
          marginTop: 130,
          width: bw - (2 * 200),
          height: bh - (2 * 130),
          borderRadius: 2,
          backgroundColor: "rgba(250, 250, 250, 1)",
          overflowY: "auto"
        },
        break: {
          marginBottom: "10px"
        }
      };
    };
    this.dismissModal = this.dismissModal.bind(this);
  }
  componentDidMount() {
    Mousetrap.bind('d', () => {
      helpers.SVG(this.props.dispatch, this.getFilePrefix(), this.props.panelsToDisplay, this.props.panelLayout, this.makeTextStringsForSVGExport());
    });
  }
  getRelevantPublications() {
    const x = [publications.nextstrain, publications.treetime];
    if (["cTiter", "rb", "ep", "ne"].indexOf(this.props.colorBy) !== -1) {
      x.push(publications.titers);
    }
    return x;
  }
  formatPublications(pubs) {
    return (
      <span>
        <ul>
          {pubs.map((pub) => (
            <li key={pub.href}>
              <a href={pub.href} target="_blank" rel="noreferrer noopener">
                {pub.author}, {pub.title}, <i>{pub.journal}</i> ({pub.year})
              </a>
            </li>
          ))}
        </ul>
      </span>
    );
  }
  getFilePrefix() {
    return "nextstrain_" +
      window.location.pathname
          .replace(/^\//, '')       // Remove leading slashes
          .replace(/:/g, '-')       // Change ha:na to ha-na
          .replace(/\//g, '_');     // Replace slashes with spaces
  }
  makeTextStringsForSVGExport() {
    const x = [];
    x.push(this.props.metadata.title);
    x.push(`Last updated ${this.props.metadata.updated}`);
    const address = window.location.href.replace(/&/g, '&amp;');
    x.push(`Downloaded from <a href="${address}">${address}</a> on ${new Date().toLocaleString()}`);
    x.push(this.createSummaryWrapper());
    x.push("");
    x.push(`${this.props.t("Data usage part 1")} A full list of sequence authors is available via <a href="https://nextstrain.org">nextstrain.org</a>.`);
    x.push(`Relevant publications:`);
    this.getRelevantPublications().forEach((pub) => {
      x.push(`<a href="${pub.href}">${pub.author}, ${pub.title}, ${pub.journal} (${pub.year})</a>`);
    });
    return x;
  }
  getNumUniqueAuthors(nodes) {
    const authors = nodes.map((n) => getFullAuthorInfoFromNode(n))
      .filter((a) => a && a.value);
    const uniqueAuthors = new Set(authors.map((a) => a.value));
    return uniqueAuthors.size;
  }
  downloadButtons() {
    // getNumSelectedTips() is redundant work with createSummaryWrapper() below,
    // and with the check done to make sure the node is visible in strainTSV(),
    // so if speed becomes a concern, could alter this to just generate the list of selected nodes once,
    // on modal creation, and add it as a property on the modal
    const selectedTipsCount = getNumSelectedTips(this.props.nodes, this.props.tree.visibility);
    // likewise, this is somewhat redundant with authorTSV()
    const uniqueAuthorCount = this.getNumUniqueAuthors(this.props.nodes);
    const filePrefix = this.getFilePrefix();
    const iconWidth = 25;
    const buttons = [
      ["Tree", "Phylogenetic tree in Newick format with branch lengths in units of divergence.",
        (<RectangularTreeIcon width={iconWidth} selected />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], false)],
      ["TimeTree", "Phylogenetic tree in Newick format with branch lengths measured in years.",
        (<RectangularTreeIcon width={iconWidth} selected />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], true)],
      ["All Metadata (TSV)", `Per-sample metadata for all samples in the dataset (n = ${this.props.metadata.mainTreeNumTips}).`,
        (<MetaIcon width={iconWidth} selected />), () => helpers.strainTSV(this.props.dispatch, filePrefix, this.props.nodes, this.props.metadata.colorings, false, null)]
    ];
    if (selectedTipsCount > 0) {
      buttons.push(["Selected Metadata (TSV)", `Per-sample metadata for strains which are currently displayed (n = ${selectedTipsCount}/${this.props.metadata.mainTreeNumTips}).`,
        (<MetaIcon width={iconWidth} selected />), () => helpers.strainTSV(this.props.dispatch, filePrefix, this.props.nodes,
          this.props.metadata.colorings, true, this.props.tree.visibility)]);
    }
    if (helpers.areAuthorsPresent(this.props.tree)) {
      buttons.push(["Author Metadata (TSV)", `Metadata for all samples in the dataset (n = ${this.props.metadata.mainTreeNumTips}) grouped by their ${uniqueAuthorCount} authors.`,
        (<MetaIcon width={iconWidth} selected />), () => helpers.authorTSV(this.props.dispatch, filePrefix, this.props.tree)]);
    }
    buttons.push(
      ["Screenshot (SVG)", "Screenshot of the current nextstrain display in SVG format.",
        (<PanelsGridIcon width={iconWidth} selected />), () => helpers.SVG(this.props.dispatch, filePrefix, this.props.panelsToDisplay, this.props.panelLayout, this.makeTextStringsForSVGExport())]
    );
    const buttonTextStyle = Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", paddingLeft: "10px", color: "white", minWidth: "300px", textAlign: "left" });
    const buttonLabelStyle = { fontStyle: "italic", fontSize: "14px", color: "lightgray" };
    return (
      <div style={{display: "block", justifyContent: "space-around", marginLeft: "25px", width: "100%" }}>
        <div style={{ width: "100%" }}>
          {buttons.map((data) => (
            <div key={data[0]} onClick={data[3]} style={{cursor: 'pointer' }}>
              {data[2]}
              <button style={buttonTextStyle} name={data[0]}>
                {data[0]}
              </button>
              <div style={{ display: "inline-block", height: "30px", verticalAlign: "top", paddingTop: "6px" }}>
                <label style={buttonLabelStyle} htmlFor={data[0]}>{data[1]}</label>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  dismissModal() {
    this.props.dispatch({ type: DISMISS_DOWNLOAD_MODAL });
  }
  createSummaryWrapper() {
    return createSummary(
      this.props.metadata.mainTreeNumTips,
      this.props.nodes,
      this.props.filters,
      this.props.visibility,
      this.props.visibleStateCounts,
      undefined, // this.props.branchLengthsToDisplay,
      this.props.t
    );
  }
  render() {
    const { t } = this.props;

    if (!this.props.show) {
      return null;
    }
    const panelStyle = {...infoPanelStyles.panel};
    panelStyle.width = this.props.browserDimensions.width * 0.66;
    panelStyle.maxWidth = panelStyle.width;
    panelStyle.maxHeight = this.props.browserDimensions.height * 0.66;
    panelStyle.fontSize = 14;
    panelStyle.lineHeight = 1.4;

    const meta = this.props.metadata;
    return (
      <div style={infoPanelStyles.modalContainer} onClick={this.dismissModal}>
        <div style={panelStyle} onClick={(e) => stopProp(e)}>
          <p style={infoPanelStyles.topRightMessage}>
            ({t("click outside this box to return to the app")})
          </p>

          <div style={infoPanelStyles.modalSubheading}>
            {meta.title} ({t("last updated")} {meta.updated})
          </div>

          <div>
            {this.createSummaryWrapper()}
          </div>
          <div style={infoPanelStyles.break}/>
          {" " + t("A full list of sequence authors is available via the TSV files below")}
          <div style={infoPanelStyles.break}/>
          {getAcknowledgments({}, {preamble: {fontWeight: 300}, acknowledgments: {fontWeight: 300}})}

          <div style={infoPanelStyles.modalSubheading}>
            {t("Data usage policy")}
          </div>
          {t("Data usage part 1") + " " + t("Data usage part 2")}

          <div style={infoPanelStyles.modalSubheading}>
            {t("Please cite the authors who contributed genomic data (where relevant), as well as")+":"}
          </div>
          {this.formatPublications(this.getRelevantPublications())}


          <div style={infoPanelStyles.modalSubheading}>
            {t("Download data")}:
          </div>
          {this.downloadButtons()}

        </div>
      </div>
    );
  }
}


const WithTranslation = withTranslation()(DownloadModal);
export default WithTranslation;
