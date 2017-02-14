import React from "react";
import Radium from "radium";
import { titleStyles } from "../../globalStyles";

@Radium
class HeaderFont extends React.Component {
  static propTypes = {
    style: React.PropTypes.object,
    children: React.PropTypes.string.isRequired
  }
  render() {
    return (
      <span style={[titleStyles.small, this.props.style]}>
        {this.props.children}
      </span>
    );
  }
}

export default HeaderFont;
