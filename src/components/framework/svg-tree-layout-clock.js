import React from "react";

class RootToTipTreeLayout extends React.Component {
  static defaultProps = {
    // foo: "bar"
    stroke: "black",
    width: 30
  }
  getStyles() {
    return {
      stroke: this.props.stroke
    };
  }

  render() {
    const styles = this.getStyles();
    return (
      <svg width={this.props.width+5} height={this.props.width+5}>
        <g transform="translate(0,7)">
          <svg width={this.props.width} height={this.props.width} viewBox="0 0 30 30 ">
            <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(17.000000, 20.000000)">
              <polyline id="Path-3" stroke={styles.stroke} points="-15 5 -15 -25 "></polyline>
              <polyline id="Path-4" stroke={styles.stroke} points="-15 5 25 5"></polyline>
              <polyline id="Path-5" stroke={styles.stroke} points="-12 3 20 -25 "></polyline>
              <circle id="c-1" stroke={styles.stroke} cx="-8" cy="0" r="2"></circle>
              <circle id="c-2" stroke={styles.stroke} cx="4" cy="-10" r="2"></circle>
              <circle id="c-3" stroke={styles.stroke} cx="4" cy="-15" r="2"></circle>
              <circle id="c-4" stroke={styles.stroke} cx="-4" cy="-5" r="2"></circle>
              <circle id="c-5" stroke={styles.stroke} cx="-2" cy="-11" r="2"></circle>
            </g>
          </svg>
        </g>
      </svg>
    );
  }
}

export default RootToTipTreeLayout;
