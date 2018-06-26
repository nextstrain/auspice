import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton, medGrey, infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/infoPanels/click";
import { authorString } from "../../util/stringHelpers";
import * as helpers from "./helperFunctions";
import * as icons from "../framework/svg-icons";
import { getAcknowledgments, preambleText, footerStyles} from "../framework/footer";
import { createSummary } from "../info/info";

const dataUsage = `
  The data presented here is intended to rapidly disseminate analysis of important pathogens.
  Unpublished data is included with permission of the data generators, and does not impact their right to publish.
  Please contact the respective authors (available via the CSV files below) if you intend to carry out further research using their data.
  Derived data, such as phylogenies, can be downloaded below - please contact the relevant authors where appropriate.
`;

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
  treeAttrs: state.tree.attrs
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
          <li><a href="https://academic.oup.com/bioinformatics/article-lookup/doi/10.1093/bioinformatics/btv381">
            Neher & Bedford, Nextflu: real-time tracking of seasonal influenza virus evolution in humans, Bioinformatics (2015)
          </a></li>
          <li><a href="http://www.biorxiv.org/content/early/2017/06/21/153494">
            {authorString("Sagulenko et al")}, TreeTime: maximum likelihood phylodynamic analysis, bioRxiv (2017)
          </a></li>
          {titer}
        </ul>
      </span>
    );
  }

  downloadButtons() {
    const filePrefix = "nextstrain_" + this.props.datapath.replace(/^\//, '').replace(/\//g, '_');
    const iconWidth = 25;
    const iconStroke = medGrey;
    const buttons = [
      ["Tree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], false)],
      ["TimeTree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => helpers.newick(this.props.dispatch, filePrefix, this.props.nodes[0], true)],
      ["Strain Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => helpers.strainCSV(this.props.dispatch, filePrefix, this.props.nodes, this.props.treeAttrs)],
      ["Author Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => helpers.authorCSV(this.props.dispatch, filePrefix, this.props.metadata, this.props.tree)],
      ["Screenshot (SGV)", (<icons.PanelsGrid width={iconWidth} stroke={iconStroke} />), () => helpers.SVG(this.props.dispatch, filePrefix, this.props.metadata.panels)]
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
  render() {
    if (!this.props.show) {
      return null;
    }
    const styles = this.getStyles(this.props.browserDimensions.width, this.props.browserDimensions.height);
    const meta = this.props.metadata;


    const summary = createSummary(
      this.props.metadata.virus_count,
      this.props.nodes,
      this.props.filters,
      this.props.visibility,
      this.props.visibleStateCounts,
      this.props.idxOfInViewRootNode,
      this.props.dateMin,
      this.props.dateMax
    );
    return (
      <div style={styles.behind} onClick={this.dismissModal.bind(this)}>
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
                (i + 1 !== summary.length ? <span key={i}>{`${d}, `}</span> : <span key={i}>{`${d}. `}</span>)
              )}
              <div style={styles.break}/>
              {preambleText}
              {" A full list of sequence authors is available via the CSV files below."}
              <div style={styles.break}/>
              {getAcknowledgments({}, footerStyles)}

              <h2>Data usage policy</h2>
              {dataUsage}

              <h2>The current data analysis relies on</h2>
              {this.relevantPublications()}

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
