import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import Toggle from "./toggle";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { toggleTemporalConfidence } from "../../actions/tree";
import { SelectLabel } from "../framework/select-label";

/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 */
@connect((state) => {
  return {
    distanceMeasure: state.controls.distanceMeasure,
    showTreeToo: state.controls.showTreeToo,
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    temporalConfidence: state.controls.temporalConfidence
  };
})
class ChooseMetric extends React.Component {
  static propTypes = {
    // analysisSlider: PropTypes.any,
    temporalConfidence: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
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
  render() {
    const styles = this.getStyles();
    const selected = this.props.distanceMeasure;
    const potentialOffset = this.props.showTreeToo ? {marginTop: "0px"} : {};
    if (this.props.branchLengthsToDisplay === "divAndDate") {
      return (
        <div style={styles.container}>
          <SelectLabel text="Branch Length" extraStyles={potentialOffset}/>
          <button
            key={1}
            style={selected === "num_date" ? materialButtonSelected : materialButton}
            onClick={() => {
              analyticsControlsEvent("tree-metric-temporal");
              this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
            }}
          >
            <span style={styles.title}> {"time"} </span>
          </button>
          <button
            key={2}
            style={selected === "div" ? materialButtonSelected : materialButton}
            onClick={() => {
              analyticsControlsEvent("tree-metric-divergence");
              this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "div" });
            }}
          >
            <span style={styles.title}> {"divergence"} </span>
          </button>
          {this.props.showTreeToo ?
            null : (
              <div style={styles.toggle}>
                <Toggle
                  display={this.props.temporalConfidence.display}
                  on={this.props.temporalConfidence.on}
                  callback={() => this.props.dispatch(toggleTemporalConfidence())}
                  label="Show confidence intervals"
                />
              </div>
            )
          }
        </div>
      );
    }
    /* else - if dateOnly or divOnly - don't show anything */
    return (<div></div>);
  }
}

export default ChooseMetric;
