import React from "react";
import PropTypes from 'prop-types';

class MonoFont extends React.Component {

  static propTypes = {
    /* react */

    style: PropTypes.object,
    size: PropTypes.string
  }
  static defaultProps = {
    size: "small"
  }
  getStyles() {
    return {
      base: {
        fontFamily: "fira-mono, monospace",
        fontSize: 16,
      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <span style={{ ...styles.base, ...this.props.style }}>
        {this.props.children}
      </span>
    );
  }
}

export default MonoFont;
