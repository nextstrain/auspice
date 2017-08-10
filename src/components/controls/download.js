import React from "react";
import { connect } from "react-redux";
import { DISMISS_DOWNLOAD_MODAL } from "../../actions/types";
import { materialButton } from "../../globalStyles";

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  show: state.controls.showDownload
}))
class DownloadModal extends React.Component {
  static propTypes = {
    show: React.PropTypes.bool.isRequired,
    dispatch: React.PropTypes.func,
    browserDimensions: React.PropTypes.object
  }
  getStyles() {
    return {
      behind: { /* covers the screen */
        position: "absolute",
        width: this.props.browserDimensions.width,
        height: this.props.browserDimensions.height,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.3)"
      },
      modal: {
        marginLeft: 300,
        marginTop: 200,
        width: 500,
        height: 500,
        borderRadius: 2,
        backgroundColor: "rgba(250, 250, 250, 1)"
      }
    };
  }
  render() {
    if (!this.props.show) {
      return null;
    }
    const styles = this.getStyles();
    return (
      <div style={styles.behind}>
        <div style={styles.modal}>
          <h1>"DOWNLOAD MODAL"</h1>
          <button
            key={2}
            style={materialButton}
            onClick={() => {this.props.dispatch({ type: DISMISS_DOWNLOAD_MODAL });}}
          >
            <span style={{left: -10, position: "relative", top: 10}}>{"CLOSE THIS MODAL"}</span>
          </button>
        </div>
      </div>
    );
  }
}


export default DownloadModal;
