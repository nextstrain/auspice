import React from "react";
import Radium from "radium";
import queryString from "query-string";
import TimeTree from "../framework/svg-time-tree";
import MutationTree from "../framework/svg-mutation-tree";


/*
 * implements a pair of buttons the toggle between timetree and divergence tree
 * copied from chose-layout
 */
@Radium
class ChooseMetric extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      container: {
        marginTop: 20
      },
      button: {
        border: "1px solid rgb(130,130,130)",
        backgroundColor: "white",
        borderRadius: 2,
        color: "rgb(130,130,130)",
        height: 40,
        width: 140,
        cursor: "pointer",
        marginRight: 20,
        ":hover": {
          backgroundColor: "rgb(245,245,245)"
        }
      },
      title: {
        marginLeft: 7,
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
          style={styles.button}
          onClick={() => { this.setMetricQueryParam("div"); }}
        >
          <MutationTree width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"div"} </span>
        </button>
        <button
          key={2}
          style={styles.button}
          onClick={() => { this.setMetricQueryParam("num_date"); }}
        >
          <TimeTree width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"num_date"} </span>
        </button>
      </div>
    );
  }
}

export default ChooseMetric;
