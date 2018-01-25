import React from "react";
import { connect } from "react-redux";

@connect((state) => {
  return {
    dateMinNumeric: state.controls.dateMinNumeric,
    dateMaxNumeric: state.controls.dateMaxNumeric,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    absoluteDateMinNumeric: state.controls.absoluteDateMinNumeric,
    absoluteDateMaxNumeric: state.controls.absoluteDateMaxNumeric
  };
})
export class Timeline extends React.Component { // eslint-disable-line

  render() {
    const period = this.props.absoluteDateMaxNumeric - this.props.absoluteDateMinNumeric;
    return (
      <div style={{minWidth: this.props.w, fontSize: 12, lineHeight: 1}}>
        <svg width="100%" height="10">
          <line x1="0" y1="5" x2={this.props.w} y2="5" stroke="#AAA" strokeWidth="0.5"/>
          <rect
            x={(this.props.dateMinNumeric - this.props.absoluteDateMinNumeric) / period * this.props.w}
            y="0"
            width={(this.props.dateMaxNumeric - this.props.dateMinNumeric) / period * this.props.w}
            height="10"
            fill="#AAA"
          />
        </svg>
        <span style={{float: "left"}}>{this.props.absoluteDateMin}</span>
        <span style={{float: "right"}}>{this.props.absoluteDateMax}</span>
      </div>
    );
  }
}
