import React from "react";
import TimeTree from "../framework/svg-time-tree";
import MutationTree from "../framework/svg-mutation-tree";
import {materialButton} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_DISTANCE_MEASURE } from "../../actions/controls";
import { modifyURLquery } from "../../util/urlHelpers";

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
  static contextTypes = {
    router: React.PropTypes.object.isRequired
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
          modifyURLquery(this.context.router, {m: "div"}, true);
        }}>
        <span style={styles.title}> {"mutations"} </span>
      </button>
      <button
        key={2}
        style={materialButton}
        onClick={() => {
          this.props.dispatch({ type: CHANGE_DISTANCE_MEASURE, data: "num_date" });
          modifyURLquery(this.context.router, {m: "num_date"}, true);
        }}>
        <span style={styles.title}> {"time"} </span>
      </button>
    </div>
  );
}
}


export default ChooseMetric;
