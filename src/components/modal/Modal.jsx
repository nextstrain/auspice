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

  styles(callbacks={}) {
    const apply = {
      container: (x) => x,  // default
      panel: (x) => x,      // default
      dismissMsg: (x) => x, // default
      ...callbacks
    };
    
    const container = apply.container({...infoPanelStyles.modalContainer}, this.props.broswerDimensions)

    const dismissMsg = apply.dismissMsg({...infoPanelStyles.topRightMessage}, this.props.broswerDimensions)

    // The default panel styles are a little complicated as historically we took styles from globalStyles
    // and then changed some of them! We preserve this behaviour here for the time being.
    const defaultPanel = {...infoPanelStyles.panel};
    defaultPanel.width = this.props.browserDimensions.width * 0.66;
    defaultPanel.maxWidth = defaultPanel.width;
    defaultPanel.maxHeight = this.props.browserDimensions.height * 0.66;
    defaultPanel.fontSize = 14;
    defaultPanel.lineHeight = 1.4;
    const panel = apply.panel({...defaultPanel}, this.props.browserDimensions)

    return {container, panel, dismissMsg}
  }

  render() {
    const { t } = this.props;

    let Contents = null;
    let styles;
    switch (this.props.modal) {
      case 'download':
        Contents = DownloadModalContents;
        styles = this.styles(); // No custom styles for this modal
        break;
      case 'linkOut':
        Contents = LinkOutModalContents;
        styles = this.styles(); // No custom styles for this modal
        break;
      default:
        return null;
    }

    return (
      <div style={styles.container} onClick={this.dismissModal}>
        <div style={styles.panel} onClick={(e) => stopProp(e)}>
          <p style={styles.dismissMsg}>
            ({t("click outside this box to return to the app")})
          </p>
          <Contents/>
        </div>
      </div>
    );
  }
}

export default withTranslation()(Modal);

