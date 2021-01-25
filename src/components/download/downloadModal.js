import React from "react";
import Mousetrap from "mousetrap";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { TRIGGER_DOWNLOAD_MODAL, DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/infoPanels/click";
import { getAcknowledgments} from "../framework/footer";
import { datasetSummary } from "../info/datasetSummary";
import { DownloadButtons } from "./downloadButtons";


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
  distanceMeasure: state.controls.distanceMeasure,
  metadata: state.metadata,
  entropy: state.entropy,
  mutType: state.controls.mutType,
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
      this.props.dispatch({type: this.props.show ? DISMISS_DOWNLOAD_MODAL : TRIGGER_DOWNLOAD_MODAL});
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
  dismissModal() {
    this.props.dispatch({ type: DISMISS_DOWNLOAD_MODAL });
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

    const relevantPublications = this.getRelevantPublications();

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
            {datasetSummary({
              mainTreeNumTips: this.props.metadata.mainTreeNumTips,
              nodes: this.props.nodes,
              filters: this.props.filters,
              visibility: this.props.visibility,
              visibleStateCounts: this.props.visibleStateCounts,
              t: this.props.t
            })}
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
          {this.formatPublications(relevantPublications)}


          <div style={infoPanelStyles.modalSubheading}>
            {t("Download data")}:
          </div>
          <div style={{display: "block", justifyContent: "space-around", marginLeft: "25px", width: "100%" }}>
            <div style={{ width: "100%" }}>
              <DownloadButtons {...this.props} relevantPublications={relevantPublications}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


const WithTranslation = withTranslation()(DownloadModal);
export default WithTranslation;

