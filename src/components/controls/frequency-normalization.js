import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import Toggle from "./toggle";
import { controlsWidth } from "../../util/globals";
import { TOGGLE_NORMALIZE_FREQUENCIES } from "../../actions/types";

@connect((state) => {
  return {
    normalizeFrequencies: state.controls.normalizeFrequencies
  };
})
class NormalizeFrequencies extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <Toggle
          display
          on={this.props.normalizeFrequencies}
          callback={() => {
            this.props.dispatch({
              type: TOGGLE_NORMALIZE_FREQUENCIES,
              data: !this.props.normalizeFrequencies
            });
          }}
          label={t("sidebar:Normalize frequencies")}
        />
      </div>
    );
  }
}

export default withTranslation()(NormalizeFrequencies);
