import React from "react";
// import TimeTree from "../framework/svg-time-tree";
// import MutationTree from "../framework/svg-mutation-tree";
import {materialButton, materialButtonSelected} from "../../globalStyles";
import { connect } from "react-redux";
import Toggle from "./toggle";
import { CHANGE_PANEL_LAYOUT } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { toggleTemporalConfidence } from "../../actions/treeProperties";

@connect((state) => {
  return {
    panelLayout: state.controls.panelLayout
  };
})
class PanelLayouts extends React.Component {
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        margin: 5,
        position: "relative",
        top: -1
      },
      toggle: {
        margin: 5
      }
    };
  }

  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.container}>
        <button
          key={1}
          style={this.props.panelLayout === "full" ? materialButtonSelected : materialButton}
          onClick={() => {
            analyticsControlsEvent("change-layout-full");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "full" });
          }}>
          <span style={styles.title}> {"full"} </span>
        </button>
        <button
          key={2}
          style={this.props.panelLayout === "thirds" ? materialButtonSelected : materialButton}
          onClick={() => {
            analyticsControlsEvent("change-layout-thirds");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "thirds" });
          }}>
          <span style={styles.title}> {"thirds"} </span>
        </button>
      </div>
    );
  }
}


export default PanelLayouts;
