import React from "react";
import Radium from "radium";
import titleCase from "title-case";
// import d3 from "d3";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
import { LEGEND_ITEM_MOUSEENTER, LEGEND_ITEM_MOUSELEAVE } from "../../actions/controls";

@connect()
@Radium
class LegendItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    legendRectSize: React.PropTypes.number,
    legendSpacing: React.PropTypes.number,
    rectFill: React.PropTypes.string,
    rectStroke: React.PropTypes.string,
    transform: React.PropTypes.string,
    dFreq: React.PropTypes.bool,
    label: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }

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
          this.props.dispatch({ type: LEGEND_ITEM_MOUSEENTER, data: this.props.label });
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
