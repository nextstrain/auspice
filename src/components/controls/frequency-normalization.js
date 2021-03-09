import React from "react";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";

import Toggle from "./toggle";
import { controlsWidth } from "../../util/globals";
import { FREQUENCY_MATRIX } from "../../actions/types";
import { computeMatrixFromRawData, checkIfNormalizableFromRawData } from "../../util/processFrequencies";
import { SidebarSubtitle } from "./styles";

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

    const allowNormalization = this.props.frequencies.loaded && this.props.tree.loaded &&
      checkIfNormalizableFromRawData(
        this.props.frequencies.data,
        this.props.frequencies.pivots,
        this.props.tree.nodes,
        this.props.tree.visibility
      );
    if (!allowNormalization) {
      return (
        <SidebarSubtitle>(Frequencies cannot be normalized)</SidebarSubtitle>
      );
    }

    return (
      <div style={{marginBottom: 10, width: controlsWidth, fontSize: 14}}>
        <Toggle
          display
          on={this.props.controls.normalizeFrequencies}
          callback={() => {
            const normalizeFrequencies = !this.props.controls.normalizeFrequencies;

            const matrix = computeMatrixFromRawData(
              this.props.frequencies.data,
              this.props.frequencies.pivots,
              this.props.tree.nodes,
              this.props.tree.visibility,
              this.props.controls.colorScale,
              this.props.controls.colorBy,
              normalizeFrequencies
            );
            this.props.dispatch({ type: FREQUENCY_MATRIX, matrix, normalizeFrequencies });
          }}
          label={t("sidebar:Normalize frequencies")}
        />
      </div>
    );
  }
}

export default withTranslation()(NormalizeFrequencies);
