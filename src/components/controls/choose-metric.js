import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import Toggle from "./toggle";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { toggleTemporalConfidence } from "../../actions/treeProperties";

/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 */

 @connect((state) => {
   return {
     distanceMeasure: state.controls.distanceMeasure,
     temporalConfidence: state.controls.temporalConfidence
   };
 })
class ChooseMetric extends React.Component {
  static propTypes = {
    analysisSlider: PropTypes.any,
    temporalConfidence: PropTypes.object.isRequired,
    dispatch: PropTypes.func
  }
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
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  render() {
  const styles = this.getStyles();
  const selected = this.props.distanceMeasure;
  return (
    <div style={styles.container}>
      <button
        key={1}
        style={selected === "num_date" ? materialButtonSelected : materialButton}
        onClick={() => {
          analyticsControlsEvent("tree-metric-temporal");
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
          modifyURLquery(this.context.router, {m: "num_date"}, true);
        }}>
        <span style={styles.title}> {"time"} </span>
      </button>
      <button
        key={2}
        style={selected === "div" ? materialButtonSelected : materialButton}
        onClick={() => {
          analyticsControlsEvent("tree-metric-divergence");
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "div" });
          modifyURLquery(this.context.router, {m: "div"}, true);
        }}>
        <span style={styles.title}> {"divergence"} </span>
      </button>
      <div style={styles.toggle}>
      <Toggle
        display={this.props.temporalConfidence.display}
        on={this.props.temporalConfidence.on}
        callback={() => this.props.dispatch(toggleTemporalConfidence())}
        label="Show confidence intervals"
      />
      </div>
    </div>
  );
}
}


export default ChooseMetric;
