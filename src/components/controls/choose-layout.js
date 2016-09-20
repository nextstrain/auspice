import React from "react";
import Radium from "radium";
// import _ from "lodash";
import Flex from "../framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import RectangleTreeLayout from "../framework/svg-tree-layout-rectangle";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import { withRouter } from "react-router";

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
    if (!this.props.location.query.l) {
      this.setLayoutQueryParam("rectangular")
    }
  }

  setLayoutQueryParam(title) {
    this.props.router.push({
      pathname: this.props.location.pathname,
      query: Object.assign({}, this.props.location.query, {l: title})
    });
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

export default withRouter(ChooseLayout);
