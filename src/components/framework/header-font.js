import React from "react";
import Radium from "radium";
import * as globalStyles from "../../globalStyles";

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
        fontFamily: globalStyles.sans,
        fontSize: this.props.size === "large" ? 76 : 28,
        lineHeight: "28px",
        letterSpacing: -1.8,
        marginTop: 20,
        marginBottom: 10
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
