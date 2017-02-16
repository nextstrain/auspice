import React from "react";
import { titleColors } from "../../util/globals";
import { titleStyles } from "../../globalStyles";
import Radium from "radium";

@Radium
class Title extends React.Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    style: React.PropTypes.object.isRequired
  }
  createTitle() {
    const title = "nextstrain";
    return title.split("").map((letter, i) =>
      <span key={i} style={{color: titleColors[i]}}>{letter}</span>
    );
  }
  render() {
    return (
      <span style={[this.props.style]}>
        {this.createTitle()}
      </span>
    );
  }
}

export default Title;
