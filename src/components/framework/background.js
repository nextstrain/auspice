import React from "react";
import { connect } from "react-redux";

/* add connect, browserDimensions & documentHeight here and use instead of 100% */
@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Background extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#F4F4F4",
        height: this.props.docHeight,
        overflowX: "hidden"
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div id="background" style={{ ...styles.base, ...this.props.style }}>
        {this.props.children}
      </div>
    );
  }
}

export default Background;
