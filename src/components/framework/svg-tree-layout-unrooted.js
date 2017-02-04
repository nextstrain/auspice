import React from "react";

class UnrootedTreeLayout extends React.Component {
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
        <g transform="translate(0,5)">
          <svg width={this.props.width} height={this.props.width} viewBox="106 49 150 118">
            <polyline
              id="Path-2"
              stroke={styles.stroke}
              strokeWidth="4"
              fill="none"
              points="108 77 125.182237 87.8599894 133.381156 119.402591 111.867082 144.368016">
            </polyline>
            <path d="M125.2,87.5 L137.624777,70"
              id="Path-3"
              stroke={styles.stroke}
              strokeWidth="4"
              fill="none">
            </path>
            <polyline
              id="Path-4"
              stroke={styles.stroke}
              strokeWidth="4"
              fill="none"
              points="133 119.331781 192.127357 119.400002 215.445998 80.3916603 203.946476 51.4000015">
            </polyline>
            <path d="M215.5,80.5 L253.378522,73"
              id="Path-5"
              stroke={styles.stroke}
              strokeWidth="4"
              fill="none">
            </path>
            <path d="M192,119.2 L229.854937,164.55391"
              id="Path-6"
              stroke={styles.stroke}
              strokeWidth="4"
              fill="none">
            </path>
          </svg>
        </g>
      </svg>
    );
  }
}

export default UnrootedTreeLayout;
