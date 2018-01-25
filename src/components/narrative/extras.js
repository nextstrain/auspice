import React from "react";
import { connect } from "react-redux";
import { calendarToNumeric } from "../../util/dateHelpers";

@connect((state) => {
  return {
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax
  };
})
export class Timeline extends React.Component { // eslint-disable-line

  render() {
    /* to do: we use these so much that they should be in redux state */
    const absoluteDateMinNumeric = calendarToNumeric(this.props.absoluteDateMin);
    const absoluteDateMaxNumeric = calendarToNumeric(this.props.absoluteDateMax);
    const dateMinNumeric = calendarToNumeric(this.props.dateMin);
    const dateMaxNumeric = calendarToNumeric(this.props.dateMax);
    return (
      <div style={{minWidth: this.props.w, fontSize: 12, lineHeight: 1}}>
        <svg width="100%" height="10">
          <line x1="0" y1="5" x2={this.props.w} y2="5" stroke="#AAA" strokeWidth="0.5"/>
          <rect
            x={(dateMinNumeric - absoluteDateMinNumeric) / (absoluteDateMaxNumeric - absoluteDateMinNumeric) * this.props.w}
            y="0"
            width={(dateMaxNumeric - dateMinNumeric) / (absoluteDateMaxNumeric - absoluteDateMinNumeric) * this.props.w}
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
