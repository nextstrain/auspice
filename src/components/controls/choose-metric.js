import React from "react";
import TimeTree from "../framework/svg-time-tree";
import MutationTree from "../framework/svg-mutation-tree";
import {materialButton} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/controls";

/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 */

@connect()
class ChooseMetric extends React.Component {
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        position: "relative",
        top: -5,
        fontWeight: 300
      }
    };
  }

  setMetricQueryParam(title) {
    const location = this.props.router.getCurrentLocation();
    const newQuery = Object.assign({}, location.query, {m: title});
    this.props.router.push({
      pathname: location.pathname,
      query: newQuery
    });
  }

  render() {
  const styles = this.getStyles();
  return (
    <div style={styles.container}>
      <button
        key={1}
        style={materialButton}
        onClick={() => {
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "div" });
          this.setMetricQueryParam("div");
        }}>
        <span style={styles.title}> {"mutations"} </span>
      </button>
      <button
        key={2}
        style={materialButton}
        onClick={() => {
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
          this.setMetricQueryParam("num_date");
        }}>
        <span style={styles.title}> {"time"} </span>
      </button>
    </div>
  );
}
}


export default ChooseMetric;
