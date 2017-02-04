import React from "react";
import Radium from "radium";
import {titleFont, darkGrey, medGrey} from "../../globalStyles";

@Radium
class TitleFont extends React.Component {

  static propTypes = {
    /* react */
    style: React.PropTypes.object,
  }
  static defaultProps = {
  }
  getStyles() {
    return {
      base: {
        fontFamily: titleFont,
        fontSize: 76,
        lineHeight: "28px",
        letterSpacing: -1.8,
        marginTop: 20,
        marginBottom: 10,
        fontWeight: 300,
        color: medGrey
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

export default TitleFont;
