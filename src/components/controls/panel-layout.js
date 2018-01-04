import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { materialButton, materialButtonSelected, brandColor, darkGrey } from "../../globalStyles";
import * as icons from "../framework/svg-icons";
import { CHANGE_PANEL_LAYOUT } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

@connect((state) => {
  return {
    panelLayout: state.controls.panelLayout
  };
})
class PanelLayouts extends React.Component {
  getStyles() {
    return {
      container: {
        marginBottom: 0
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
        <icons.PanelsFull width={22} stroke={this.props.panelLayout === "full" ? brandColor : darkGrey}/>
        <button
          key={1}
          style={this.props.panelLayout === "full" ? materialButtonSelected : materialButton}
          onClick={() => {
            analyticsControlsEvent("change-layout-full");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "full" });
          }}
        >
          <span style={styles.title}> {"full"} </span>
        </button>
        <icons.PanelsGrid width={22} stroke={this.props.panelLayout === "grid" ? brandColor : darkGrey}/>
        <button
          key={2}
          style={this.props.panelLayout === "grid" ? materialButtonSelected : materialButton}
          onClick={() => {
            analyticsControlsEvent("change-layout-grid");
            this.props.dispatch({ type: CHANGE_PANEL_LAYOUT, data: "grid" });
          }}
        >
          <span style={styles.title}> {"grid"} </span>
        </button>
      </div>
    );
  }
}


export default PanelLayouts;
