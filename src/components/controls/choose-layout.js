import React from "react";
import Radium from "radium";
// import _ from "lodash";
import Flex from "../framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import RectangleTreeLayout from "../framework/svg-tree-layout-rectangle";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import queryString from "query-string";

// @connect(state => {
//   return state.FOO;
// })
@Radium
class ChooseLayout extends React.Component {
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
    style: React.PropTypes.object,
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
      this.setLayoutQueryParam("rectangular")
    }
  }

  setLayoutQueryParam(title) {
    const newQuery = Object.assign({}, this.props.location.query, {l: title});
    // https://www.npmjs.com/package/query-string
    const url = "/" + this.props.location.pathname + "/?" + queryString.stringify(newQuery);
    window.history.pushState({}, '', url);
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.container}>
        <button
          key={1}
          style={styles.button}
          onClick={() => { this.setLayoutQueryParam("rectangular"); }}>
          <RectangleTreeLayout width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"rectangular"} </span>
        </button>
        <button
          key={2}
          style={styles.button}
          onClick={() => { this.setLayoutQueryParam("radial"); }}>
          <RadialTreeLayout width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"radial"} </span>
        </button>
      </div>
    );
  }
}

export default ChooseLayout;
