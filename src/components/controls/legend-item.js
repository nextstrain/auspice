import React from "react";
import Radium from "radium";
import titleCase from "title-case";
import { connect } from "react-redux";
import { LEGEND_ITEM_MOUSEENTER, LEGEND_ITEM_MOUSELEAVE } from "../../actions/controls";

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

@connect()
@Radium
class LegendItem extends React.Component {

  getStyles() {
    return {
      base: {

      }
    };
  }
  createLabelText(d) {
    // We assume that label text arrives either Properly Formatted or as snake_case or as CamelCase
    let label = "";
    // d was undefined in some cases, Honduras thing, may not need conditional after fixed
    if (d) {
      label = titleCase(d.toString());
    }
    if (isNumeric(d)){
      const val = parseFloat(d);
      const magnitude = Math.ceil(Math.log10(Math.abs(val)+1e-10));
      label = val.toFixed(5-magnitude);
    }

    if (this.props.dFreq) {
      label += "\u00D7";
    }
    return label;
  }
  render() {
    const label = this.createLabelText(this.props.label);
    return (
      <g
        transform={this.props.transform}
        onMouseEnter={() => {
          this.props.dispatch({ type: LEGEND_ITEM_MOUSEENTER,
                                data: this.props.label });
        }}
        onMouseLeave={() => {
          this.props.dispatch({ type: LEGEND_ITEM_MOUSELEAVE });
        }}>
        <rect
          style={{strokeWidth: 2}}
          width={this.props.legendRectSize}
          height={this.props.legendRectSize}
          fill={this.props.rectFill}
          stroke={this.props.rectStroke}/>
        <text
          x={this.props.legendRectSize + this.props.legendSpacing + 5}
          y={this.props.legendRectSize - this.props.legendSpacing}
          style={{fontSize: 12}}>{label}</text>
      </g>
    );
  }
}

export default LegendItem;
