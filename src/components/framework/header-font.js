import React from "react";
import Radium from "radium";
import {headerFont, darkGrey, medGrey} from "../../globalStyles";

@Radium
class HeaderFont extends React.Component {

  static propTypes = {
    /* react */

    style: React.PropTypes.object,
    size: React.PropTypes.string,
    bold: React.PropTypes.bool,
    dark: React.PropTypes.bool
  }
  static defaultProps = {
    size: "small"
  }
  getStyles() {
    return {
      base: {
        fontFamily: headerFont,
        fontSize: this.props.size === "large" ? 76 : 14,
        lineHeight: "28px",
        // letterSpacing: -1.8,
        marginTop: 20,
        marginBottom: 10,
        fontWeight: this.props.bold ? 500 : 300,
        color: this.props.dark ? darkGrey : medGrey
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
