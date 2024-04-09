import React from "react";
import Mousetrap from "mousetrap";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import { SET_MODAL } from "../../actions/types";
import { infoPanelStyles } from "../../globalStyles";
import { stopProp } from "../tree/infoPanels/click";
import DownloadModalContents from "../download/downloadModal";
import { LinkOutModalContents } from "./LinkOutModalContents.jsx";

@connect((state) => ({
  browserDimensions: state.browserDimensions.browserDimensions,
  modal: state.controls.modal,
}))
class Modal extends React.Component {
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

  /**
   * Key-press 'd' opens the download modal (at the time of implementation this was the only modal)
   * and if _any_ modal's open pressing 'd' dismisses it
   */
  componentDidMount() {
    Mousetrap.bind('d', () => {
      this.props.dispatch({ type: SET_MODAL, modal: this.props.modal ? null : 'download' });
    });
  }

  componentWillUnmount() {
    Mousetrap.unbind('d');
  }

  dismissModal() {
    this.props.dispatch({ type: SET_MODAL, modal: null });
  }

  render() {
    const { t } = this.props;

    let Contents = null;
    switch (this.props.modal) {
      case 'download':
        Contents = DownloadModalContents;
        break;
      case 'linkOut':
        Contents = LinkOutModalContents;
        break;
      default:
        return null;
    }

    const panelStyle = {...infoPanelStyles.panel};
    panelStyle.width = this.props.browserDimensions.width * 0.66;
    panelStyle.maxWidth = panelStyle.width;
    panelStyle.maxHeight = this.props.browserDimensions.height * 0.66;
    panelStyle.fontSize = 14;
    panelStyle.lineHeight = 1.4;
    return (
      <div style={infoPanelStyles.modalContainer} onClick={this.dismissModal}>
        <div style={panelStyle} onClick={(e) => stopProp(e)}>
          <p style={infoPanelStyles.topRightMessage}>
            ({t("click outside this box to return to the app")})
          </p>
          <Contents/>
        </div>
      </div>
    );
  }
}

export default withTranslation()(Modal);

