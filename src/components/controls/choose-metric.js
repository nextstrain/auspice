import React from "react";
import TimeTree from "../framework/svg-time-tree";
import MutationTree from "../framework/svg-mutation-tree";
import {materialButton} from "../../globalStyles";

/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 * copied from chose-layout
 */
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
  componentDidMount() {
    // Richard move to algo that checks for url validity
    if (!this.props.location.query.l) {
      this.setMetricQueryParam("div");
    }
  }

  setMetricQueryParam(title) {
    const newQuery = Object.assign({}, this.props.location.query, {m: title});
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.container}>
        <button
          key={1}
          style={materialButton}
          onClick={() => { this.setMetricQueryParam("div"); }}
        >
          <span style={styles.title}> {"divergence"} </span>
        </button>
        <button
          key={2}
          style={materialButton}
          onClick={() => { this.setMetricQueryParam("num_date"); }}
        >
          <span style={styles.title}> {"time"} </span>
        </button>
      </div>
    );
  }
}
// <TimeTree width={25} stroke="rgb(130,130,130)"/>
// <MutationTree width={25} stroke="rgb(130,130,130)"/>

export default ChooseMetric;
