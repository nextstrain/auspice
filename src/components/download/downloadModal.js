import React from "react";
import Mousetrap from "mousetrap";
import { connect } from "react-redux";
import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton, medGrey, infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/infoPanels/click";
import { authorString } from "../../util/stringHelpers";
import * as helpers from "./helperFunctions";
import * as icons from "../framework/svg-icons";
import { getAcknowledgments, footerStyles} from "../framework/footer";
import { createSummary } from "../info/info";

const dataUsage = [
  `The data presented here is intended to rapidly disseminate analysis of important pathogens.
  Unpublished data is included with permission of the data generators, and does not impact their right to publish.`,
  `Please contact the respective authors (available via the CSV files below) if you intend to carry out further research using their data.
  Derived data, such as phylogenies, can be downloaded below - please contact the relevant authors where appropriate.`
];

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
  datapath: state.datasets.datapath,
  metadata: state.metadata,
  tree: state.tree,
  dateMin: state.controls.dateMin,
  dateMax: state.controls.dateMax,
  nodes: state.tree.nodes,
  idxOfInViewRootNode: state.tree.idxOfInViewRootNode,
  visibleStateCounts: state.tree.visibleStateCounts,
  filters: state.controls.filters,
  visibility: state.tree.visibility,
  treeAttrs: state.tree.attrs,
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
          width: bw,
          height: bh,
          zIndex: 10000,
          backgroundColor: "rgba(0, 0, 0, 0.3)"
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
                {authorString(pub.author)}, {pub.title}, <i>{pub.journal}</i> ({pub.year})
              </a>
            </li>
          ))}
        </ul>
      </span>
    );
  }
  relevantPublications() {
    const titer_related_keys = ["cTiter", "rb", "ep", "ne"];
    const titer = (titer_related_keys.indexOf(this.props.colorBy) !== -1) ?
      (<li><a href="http://www.pnas.org/content/113/12/E1701.abstract">
        {authorString("Neher et al")}, Prediction, dynamics, and visualization of antigenic phenotypes of seasonal influenza viruses, PNAS, 2016
      </a></li>) : null;
    return (
      <span>
        <ul>
          <li><a href="https://doi.org/10.1093/bioinformatics/bty407" target="_blank" rel="noreferrer noopener">
            {authorString("Hadfield et al")}, Nextstrain: real-time tracking of pathogen evolution, <i>Bioinformatics</i> (2018)
          </a></li>
          <li><a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5758920/" target="_blank" rel="noreferrer noopener">
            {authorString("Sagulenko et al")}, TreeTime: Maximum-likelihood phylodynamic analysis, <i>Virus Evolution</i> (2017)
          </a></li>
          {titer}
        </ul>
      </span>
    );
  }
  getFilePrefix() {
    return "nextstrain_" + this.props.datapath.replace(/^\//, '').replace(/\//g, '_');
  }
  makeTextStringsForSVGExport() {
    const x = [];
    x.push(this.props.metadata.title);
    x.push(`Last updated ${this.props.metadata.updated}`);
    const address = window.location.href.replace(/&/g, '&amp;');
    x.push(`Downloaded from <a href="${address}">${address}</a> on ${new Date().toLocaleString()}`);
    x.push(this.createSummaryWrapper().join(", "));
    x.push("");
    x.push(dataUsage[0] + ` A full list of sequence authors is available via <a href="https://nextstrain.org">nextstrain.org</a>.`);
    x.push(`Relevant publications:`);
    this.getRelevantPublications().forEach((pub) => {
      x.push(`<a href="${pub.href}">${pub.author}, ${pub.title}, ${pub.journal} (${pub.year})</a>`);
    });
    return x;
  }

  downloadButtons() {
    const filePrefix = this.getFilePrefix();
    const iconWidth = 25;
    const iconStroke = medGrey;
    const buttons = [
      ["Tree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], false)],
      ["TimeTree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], true)],
      ["Strain Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => helpers.strainCSV(this.props.dispatch, filePrefix, this.props.nodes, this.props.treeAttrs)],
      ["Author Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => helpers.authorCSV(this.props.dispatch, filePrefix, this.props.metadata, this.props.tree)],
      ["Screenshot (SGV)", (<icons.PanelsGrid width={iconWidth} stroke={iconStroke} />), () => helpers.SVG(this.props.dispatch, filePrefix, this.props.panelsToDisplay, this.props.panelLayout, this.makeTextStringsForSVGExport())]
    ];
    return (
      <div className="row">
        {buttons.map((data) => (
          <div key={data[0]} className="col-md-5" onClick={data[2]} style={{cursor: 'pointer'}}>
            {data[1]}
            <button style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)", paddingLeft: "10px"})}>
              {data[0]}
            </button>
          </div>
        ))}
      </div>
    );
  }
  dismissModal() {
    this.props.dispatch({ type: DISMISS_DOWNLOAD_MODAL });
  }
  createSummaryWrapper() {
    return createSummary(
      this.props.metadata.virus_count,
      this.props.nodes,
      this.props.filters,
      this.props.visibility,
      this.props.visibleStateCounts,
      this.props.idxOfInViewRootNode,
      this.props.dateMin,
      this.props.dateMax
    );
  }
  render() {
    if (!this.props.show) {
      return null;
    }
    const styles = this.getStyles(this.props.browserDimensions.width, this.props.browserDimensions.height);
    const meta = this.props.metadata;
    const summary = this.createSummaryWrapper();
    return (
      <div style={styles.behind} onClick={this.dismissModal}>
        <div className="static container" style={styles.modal} onClick={(e) => stopProp(e)}>
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-7" style={styles.title}>
              Download Data
            </div>
          </div>
          <div className="row">
            <div className="col-md-1" />
            <div className="col-md-10">
              <div style={styles.secondTitle}>
                {meta.title} (last updated {meta.updated})
              </div>
              {summary.map((d, i) =>
                (i + 1 !== summary.length ? <span key={d}>{`${d}, `}</span> : <span key={d}>{`${d}. `}</span>)
              )}
              <div style={styles.break}/>
              {" A full list of sequence authors is available via the CSV files below."}
              <div style={styles.break}/>
              {getAcknowledgments({}, footerStyles)}

              <h2>Data usage policy</h2>
              {dataUsage.join(" ")}

              <h2>Please cite the authors who contributed genomic data (where relevant), as well as:</h2>
              {this.formatPublications(this.getRelevantPublications())}

              <h2>Download data as</h2>
              {this.downloadButtons()}

              <p style={infoPanelStyles.comment}>
                (click outside this box to return to the app)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default DownloadModal;
