import React from "react";
import Toggle from "./toggle";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import { controlsWidth } from "../../util/globals";
import { TOGGLE_TRANSMISSION_LINES } from "../../actions/types";
import { SidebarSubtitle } from "./styles";

@connect((state) => {
  return {
    showTransmissionLines: state.controls.showTransmissionLines,
  };
})
class TransmissionLines extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <>
        <SidebarSubtitle spaceAbove>
        {t("sidebar:Transmission lines")}
        </SidebarSubtitle>
        <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
          <Toggle
            display
            on={this.props.showTransmissionLines}
            callback={() => {
              this.props.dispatch({ type: TOGGLE_TRANSMISSION_LINES, data: !this.props.showTransmissionLines });
            }}
            label={t("sidebar:Show transmission lines")}
          />
        </div>
      </>
    );
  }
}

export default withTranslation()(TransmissionLines);