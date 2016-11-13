import React from "react";
import Radium from "radium";
import RectangleTreeLayout from "../framework/svg-tree-layout-rectangle";
import RadialTreeLayout from "../framework/svg-tree-layout-radial";
import UnrootedTreeLayout from "../framework/svg-tree-layout-unrooted";
import queryString from "query-string";
import {materialButton} from "../../globalStyles";

@Radium
class ChooseLayout extends React.Component {
  getStyles() {
    return {
      container: {
        marginBottom: 10
      },
      title: {
        marginLeft: 7,
        position: "relative",
        top: -7,
        fontWeight: 300
      }
    };
  }

  componentDidMount() {
    // Richard move to algo that checks for url validity
    if (!this.props.location.query.l) {
      this.setLayoutQueryParam("rectangular");
    }
  }

  setLayoutQueryParam(title) {
    const newQuery = Object.assign({}, this.props.location.query, {l: title});
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  render() {
    const styles = this.getStyles();
    return (
      <div style={styles.container}>
        <button
          key={1}
          style={materialButton}
          onClick={() => { this.setLayoutQueryParam("rectangular"); }}>
          <RectangleTreeLayout width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"rectangular"} </span>
        </button>
        <button
          key={2}
          style={materialButton}
          onClick={() => { this.setLayoutQueryParam("radial"); }}>
          <RadialTreeLayout width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"radial"} </span>
        </button>
        <button
          key={3}
          style={materialButton}
          onClick={() => { this.setLayoutQueryParam("rootToTip"); }}>
          <UnrootedTreeLayout width={25} stroke="rgb(130,130,130)"/>
          <span style={styles.title}> {"unrooted"} </span>
        </button>
      </div>
    );
  }
}

export default ChooseLayout;
