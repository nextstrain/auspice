import React from "react";
import Radium from "radium";
// import Flex from "./framework/flex";

@Radium
class Background extends React.Component {
  getStyles() {
    return {
      base: {
        backgroundColor: "#F8F8F8"
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
