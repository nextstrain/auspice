import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import * as icons from "../framework/svg-icons";
import { materialButton, materialButtonSelected, lightGrey, brandColor, darkGrey } from "../../globalStyles";
import { CHANGE_LAYOUT } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

@connect((state) => {
  return {
    layout: state.controls.layout
  };
})
class ChooseLayout extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    layout: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        margin: 5,
        position: "relative",
        top: -1
      }
    };
  }

  render() {
    const styles = this.getStyles();
    const selected = this.props.layout;
    return (
      <div style={styles.container}>
        <div style={{margin: 5}}>
        <icons.RectangularTree width={25} stroke={selected === "rect" ? brandColor : darkGrey}/>
        <button
          key={1}
          style={selected === "rect" ? materialButtonSelected : materialButton}
          onClick={() => {
            const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop;
            if (!loopRunning) {
              analyticsControlsEvent("change-layout-rectangular");
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "rect" });
              modifyURLquery(this.context.router, {l: "rect"}, true);
            }
          }}
        >
          <span style={styles.title}> {"rectangular"} </span>
        </button>
        </div>
        <div style={{margin: 5}}>
        <icons.RadialTree width={25} stroke={selected === "radial" ? brandColor : darkGrey}/>
        <button
          key={2}
          style={selected === "radial" ? materialButtonSelected : materialButton}
          onClick={() => {
            const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop;
            if (!loopRunning) {
              analyticsControlsEvent("change-layout-radial");
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "radial" });
              modifyURLquery(this.context.router, {l: "radial"}, true);
            }
          }}
        >
          <span style={styles.title}> {"radial"} </span>
        </button>
        </div>
        <div style={{margin: 5}}>
        <icons.UnrootedTree width={25} stroke={selected === "unrooted" ? brandColor : darkGrey}/>
        <button
          key={3}
          style={selected === "unrooted" ? materialButtonSelected : materialButton}
          onClick={() => {
            const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop;
            if (!loopRunning) {
              analyticsControlsEvent("change-layout-unrooted");
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "unrooted" });
              modifyURLquery(this.context.router, {l: "unrooted"}, true);
            }
          }}
        >
          <span style={styles.title}> {"unrooted"} </span>
        </button>
        </div>
        <div style={{margin: 5}}>
        <icons.Clock width={25} stroke={selected === "clock" ? brandColor : darkGrey}/>
        <button
          key={4}
          style={selected === "clock" ? materialButtonSelected : materialButton}
          onClick={() => {
            const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop;
            if (!loopRunning) {
              analyticsControlsEvent("change-layout-clock");
              this.props.dispatch({ type: CHANGE_LAYOUT, data: "clock" });
              modifyURLquery(this.context.router, {l: "clock"}, true);
            }
          }}
        >
          <span style={styles.title}> {"clock"} </span>
        </button>
        </div>
      </div>
    );
  }
}

export default ChooseLayout;
