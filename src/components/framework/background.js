import React from "react";
import { connect } from "react-redux";
import Radium from "radium"; // necessary

/* add connect, browserDimensions & documentHeight here and use instead of 100% */
@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
@Radium
class Background extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#F8F8F8",
        height: this.props.docHeight
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {this.props.children}
      </div>
    );
  }
}

export default Background;
