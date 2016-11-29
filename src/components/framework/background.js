import React from "react";
import Radium from "radium";

@Radium
class Background extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#F8F8F8",
        height: "100%"
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
