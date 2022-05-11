import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import Toggle from "./toggle";
import { controlsWidth } from "../../util/globals";
import { TOGGLE_TEMPORAL_ZOOM_FLAG } from "../../actions/types";

@connect((state) => {
  return {
    treeZoomsTemporally: state.controls.treeZoomsTemporally
  };
})
class ChooseZoomMode extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <Toggle
          display
          on={this.props.treeZoomsTemporally}
          callback={() => {
            this.props.dispatch({ type: TOGGLE_TEMPORAL_ZOOM_FLAG });
          }}
          label={t("sidebar:Zoom Temporally")}
        />
      </div>
    );
  }
}

export default withTranslation()(ChooseZoomMode);
