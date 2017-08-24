import React from "react";
import { connect } from "react-redux";
import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton, medGrey, infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/tipSelectedPanel";
import { authorString, formatURLString } from "../../util/stringHelpers";
import * as download from "../../util/downloadDataFunctions";
import * as icons from "../framework/svg-icons";

export const isPaperURLValid = (d) => {
  return (
    Object.prototype.hasOwnProperty.call(d, "paper_url") &&
    !d.paper_url.endsWith('/') &&
    d.paper_url !== "?"
  );
};

export const getAuthor = (info, k) => {
  if (info === undefined || k === undefined) {
    return (
      <span>Not Available</span>
    );
  }
  if (isPaperURLValid(info[k])) {
    return (
      <a href={formatURLString(info[k].paper_url)} target="_blank">
        {authorString(k)}
      </a>
    );
  }
  return authorString(k);
};

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  show: state.controls.showDownload,
  colorBy: state.controls.colorBy,
  datasetPathName: state.controls.datasetPathName,
  metadata: state.metadata,
  tree: state.tree
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
        modal: {
          marginLeft: 200,
          marginTop: 130,
          width: bw - (2 * 200),
          height: bh - (2 * 130),
          borderRadius: 2,
          backgroundColor: "rgba(250, 250, 250, 1)",
          overflowY: "auto"
        }
      };
    };
  }
  static propTypes = {
    show: React.PropTypes.bool.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    metadata: React.PropTypes.object.isRequired,
    datasetPathName: React.PropTypes.string,
    browserDimensions: React.PropTypes.object.isRequired
  }

  relevantPublications() {
    const titer_related_keys = ["antigenic_advance"];
    const titer = (titer_related_keys.indexOf(this.props.colorBy) !== -1) ?
      (<li><a href="http://www.biorxiv.org/content/early/2017/06/21/153494">
        {authorString("Neher et al")}, Prediction, dynamics, and visualization of antigenic phenotypes of seasonal influenza viruses, PNAS, 2016
      </a></li>) : null;
    return (
      <g>
        <h2>The current data analysis relies on</h2>
        <ul>
          <li><a href="https://academic.oup.com/bioinformatics/article-lookup/doi/10.1093/bioinformatics/btv381">
            Neher & Bedford, Nextflu: real-time tracking of seasonal influenza virus evolution in humans, Bioinformatics, 2015
          </a></li>
          <li><a href="http://www.biorxiv.org/content/early/2017/06/21/153494">
            {authorString("Sagulenko et al")}, TreeTime: maximum likelihood phylodynamic analysis, bioRxiv, 2017
          </a></li>
          {titer}
        </ul>
      </g>
    );
  }

  downloadButtons() {
    const dataset = this.props.datasetPathName.replace(/^\//, '').replace(/\//, '_');
    const iconWidth = 25;
    const iconStroke = medGrey;
    const buttons = [
      ["Tree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => download.newick(this.props.dispatch, dataset, this.props.tree.nodes[0], false)],
      ["TimeTree (newick)", (<icons.RectangularTree width={iconWidth} stroke={iconStroke} />), () => download.newick(this.props.dispatch, dataset, this.props.tree.nodes[0], true)],
      ["Strain Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => download.strainCSV(this.props.dispatch, dataset, this.props.tree.nodes, this.props.tree.attrs)],
      ["Author Metadata (CSV)", (<icons.Meta width={iconWidth} stroke={iconStroke} />), () => download.authorCSV(this.props.dispatch, dataset, this.props.metadata.metadata)],
      ["Screenshot (SGV)", (<icons.Panels width={iconWidth} stroke={iconStroke} />), () => download.SVG(this.props.dispatch, dataset)]
    ];
    return (
      <div className="row">
        {buttons.map((data) => (
          <div key={data[0]} className="col-md-5">
            {data[1]}
            <button style={Object.assign({}, materialButton, {backgroundColor: "rgba(0,0,0,0)"})} onClick={data[2]}>
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
    const meta = this.props.metadata.metadata;
    return (
      <div style={styles.behind} onClick={this.dismissModal.bind(this)}>
        <div className="static container" style={styles.modal} onClick={(e) => stopProp(e)}>
          <div className="row">
            <div className="col-md-1"/>
            <div className="col-md-7">
              <h1>Download Data</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-md-1" />
            <div className="col-md-10">
              <h2>Dataset details</h2>
              {meta.title} (last updated {meta.updated}) contains {meta.virus_count} sequences from {Object.keys(meta.author_info).length} authors, some of which may be unpublished.
              <br />

              <h2>Data usage policy</h2>
              To Write

              <h2>Data contributed by the following authors</h2>
              {Object.keys(meta.author_info).sort((a, b) => {
                return meta.author_info[a].n > meta.author_info[b].n ? -1 : 1;
              }).map((k) => (
                <span key={k}>
                  {getAuthor(meta.author_info, k)}
                  {" (n = " + meta.author_info[k].n + "), "}
                </span>
              ))}

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
