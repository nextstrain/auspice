import React from "react";
// import TimeTree from "../framework/svg-time-tree";
// import MutationTree from "../framework/svg-mutation-tree";
import {materialButton, materialButtonSelected} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/types";
import { modifyURLquery } from "../../util/urlHelpers";

/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 */

 @connect((state) => {
   return {
     distanceMeasure: state.controls.distanceMeasure
   };
 })
class ChooseMetric extends React.Component {
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
  static contextTypes = {
    router: React.PropTypes.object.isRequired
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
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
          modifyURLquery(this.context.router, {m: "num_date"}, true);
        }}>
        <span style={styles.title}> {"time"} </span>
      </button>
      <button
        key={2}
        style={selected === "div" ? materialButtonSelected : materialButton}
        onClick={() => {
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "div" });
          modifyURLquery(this.context.router, {m: "div"}, true);
        }}>
        <span style={styles.title}> {"divergence"} </span>
      </button>
    </div>
  );
}
}


export default ChooseMetric;
