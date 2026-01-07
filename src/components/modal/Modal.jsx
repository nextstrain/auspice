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

