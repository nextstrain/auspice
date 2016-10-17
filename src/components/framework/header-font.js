import React from "react";
import Radium from "radium";
// import Flex from "./framework/flex";

@Radium
class HeaderFont extends React.Component {

  static propTypes = {
    /* react */

    style: React.PropTypes.object,
    size: React.PropTypes.string
  }
  static defaultProps = {
    size: "small"
  }
  getStyles() {
    return {
      base: {
        fontFamily: "aw-conqueror-sans, sans-serif",
        fontSize: this.props.size === "large" ? 76 : 28,
        lineHeight: "68px",
        letterSpacing: -1.8,
        margin: 0
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <span style={[
        styles.base,
        this.props.style
      ]}>{this.props.children}</span>
    );
  }
}

export default HeaderFont;
