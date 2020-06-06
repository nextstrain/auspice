import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import Toggle from "./toggle";
import { controlsWidth } from "../../util/globals";
import { TOGGLE_NORMALIZE_FREQUENCIES, FREQUENCY_MATRIX } from "../../actions/types";
import { computeMatrixFromRawData } from "../../util/processFrequencies";

@connect((state) => {
  return {
    controls: state.controls,
    frequencies: state.frequencies,
    tree: state.tree
  };
})
class NormalizeFrequencies extends React.Component {
  render() {
    const { t } = this.props;
    return (
      <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <Toggle
          display
          on={this.props.controls.normalizeFrequencies}
          callback={() => {
            const nextState = !this.props.controls.normalizeFrequencies;
            const matrix = computeMatrixFromRawData(
              this.props.frequencies.data,
              this.props.frequencies.pivots,
              this.props.tree.nodes,
              this.props.tree.visibility,
              this.props.controls.colorScale,
              this.props.controls.colorBy,
              nextState
            );
            this.props.dispatch({
              type: TOGGLE_NORMALIZE_FREQUENCIES,
              data: nextState
            });
            this.props.dispatch({ type: FREQUENCY_MATRIX, matrix });
          }}
          label={t("sidebar:Normalize frequencies")}
        />
      </div>
    );
  }
}

export default withTranslation()(NormalizeFrequencies);
