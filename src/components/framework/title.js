import React from "react";
import { titleColors } from "../../util/globals";
import { titleStyles, titleFont, medGrey } from "../../globalStyles";
import Radium from "radium";

@Radium
class Title extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    style: React.PropTypes.object.isRequired
  }
  getStyles() {
    return {
      title: {
        fontFamily: titleFont,
        fontSize: 106,
        marginTop: 0,
        marginBottom: 0,
        fontWeight: 300,
        color: medGrey,
        letterSpacing: "-1px"
      }
    };
  }
  createTitle() {
    const title = "nextstrain";
    return title.split("").map((letter, i) =>
      <span key={i} style={{color: this.props.minified ? "#fff" : titleColors[i] }}>{letter}</span>
    );
  }
  render() {
    const styles = this.getStyles();
    return (
      <span style={[styles.title, this.props.style]}>
        {this.createTitle()}
      </span>
    );
  }
}

export default Title;
