import React from "react";
import { connect } from "react-redux";
import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton, medGrey, infoPanelStyles } from "../../globalStyles";
import RectangularTreeLayout from "../framework/svg-tree-layout-rectangular";
import { stopProp } from "../tree/tipSelectedPanel";
import { authorString } from "../../util/stringHelpers";
import * as download from "../../util/downloadDataFunctions";

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  show: state.controls.showDownload,
  metadata: state.metadata,
  tree: state.tree
}))
class DownloadModal extends React.Component {
  static propTypes = {
    show: React.PropTypes.bool.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    metadata: React.PropTypes.object.isRequired,
    browserDimensions: React.PropTypes.object.isRequired
  }
  getStyles(bw, bh) {
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
  }
  downloadButtons() {
    const iconWidth = 25;
    const iconStroke = medGrey;
    const buttons = [
      ["Tree (newick)", (<RectangularTreeLayout width={iconWidth} stroke={iconStroke} />), download.newick],
      ["Metadata (CSV)", (<RectangularTreeLayout width={iconWidth} stroke={iconStroke} />), () => download.CSV(this.props.tree.nodes)],
      ["Screenshot (SGV)", (<RectangularTreeLayout width={iconWidth} stroke={iconStroke} />), download.SVG]
    ];
    return (
      <div className="row">
        {buttons.map((data) => (
          <div key={data[0]} className="col-md-5">
            {data[1]}
            <button style={materialButton} onClick={data[2]}>
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

              <h2>Authors involved</h2>
              {Object.keys(meta.author_info).sort((a, b) => {
                return meta.author_info[a].n > meta.author_info[b].n ? -1 : 1;
              }).map((k) => (
                <g>{authorString(k)} (n = {meta.author_info[k].n}0), </g >
              ))}


              <h2>Relevent publications (??)</h2>
              <ul>
                <li>Nextstrain paper (to write!)</li>
                <li>TimeTree?</li>
                <li>Titer model paper?</li>
                <li>Dataset specific papers?</li>
              </ul>

              <h2>Download data as</h2>
              {this.downloadButtons()}

              <p style={infoPanelStyles.comment}>
                (click outside this box to go back to the tree)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default DownloadModal;
