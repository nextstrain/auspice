import React from "react";
import { connect } from "react-redux";
import { titleColors } from "../../util/globals";
import { titleFont, medGrey } from "../../globalStyles";

@connect((state) => {
  return {
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Title extends React.Component {
  getStyles() {
    let fontSize = 106;
    if (this.props.browserDimensions.width < 500) {
      fontSize = 84;
    }
    if (this.props.browserDimensions.width < 450) {
      fontSize = 78;
    }
    if (this.props.browserDimensions.width < 400) {
      fontSize = 72;
    }
    if (this.props.browserDimensions.width < 350) {
      fontSize = 66;
    }
    return {
      title: {
        fontFamily: titleFont,
        fontSize: fontSize,
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
    return title.split("").map((letter, i) => (
      <span
        key={i} // eslint-disable-line react/no-array-index-key
        style={{color: titleColors[i] }}
      >
        {letter}
      </span>
    ));
  }
  render() {
    const styles = this.getStyles();
    return (
      <span style={{ ...styles.title, ...this.props.style }}>
        {this.createTitle()}
      </span>
    );
  }
}

export default Title;
