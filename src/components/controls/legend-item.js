import React from "react";
import Radium from "radium";
import titleCase from "title-case";
// import d3 from "d3";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class LegendItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    legendRectSize: React.PropTypes.number,
    legendSpacing: React.PropTypes.number,
    rectFill: React.PropTypes.string,
    rectStroke: React.PropTypes.string,
    transform: React.PropTypes.string
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
    let label = titleCase(d.toString());
    if (this.props.dFreq) {
      label += "\u00D7";
    }
    return label;
  }
  render() {
    const styles = this.getStyles();
    return (
      <g transform={this.props.transform}>
        <rect
          style={{strokeWidth: 2}}
          width={this.props.legendRectSize}
          height={this.props.legendRectSize}
          fill={this.props.rectFill}
          stroke={this.props.rectStroke}/>
        <text
          x={this.props.legendRectSize + this.props.legendSpacing + 5}
          y={this.props.legendRectSize - this.props.legendSpacing}
          style={{fontSize: 12}}>{this.createLabelText(this.props.label)}</text>
      </g>
    );
  }
}

export default LegendItem;
/*
tmp_leg.append("rect")
  .on("mouseover", (leg) => {
    treeplot.selectAll(".tip") //highlight all tips corresponding to legend
      .filter((d) => { return legend_match(leg, d); })
      .attr("r", (d) => { return tipRadius(d) * 1.7; })
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t)).brighter();
      });
  })
  .on("mouseout", (leg) => {
    treeplot.selectAll(".tip") //undo highlight
      .filter((d) => { return legend_match(leg, d);})
      .attr("r", (d) => { return tipRadius(d); })
      .style("fill", (t) => {
        return d3.rgb(tipFillColor(t));
      });
  });


  // .on("mouseover", (leg) => {
  //   treeplot.selectAll(".tip")
  //     .filter((d) => {return legend_match(leg, d);})
  //     .attr("r", (d) => {return tipRadius(d) * 1.7;})
  //     .style("fill", (t) => {
  //       return d3.rgb(tipFillColor(t)).brighter();
  //     });
  // })
  // .on("mouseout", (leg) => {
  //   treeplot.selectAll(".tip")
  //     .filter((d) => {return legend_match(leg, d);})
  //     .attr("r", (d) => {return tipRadius(d); })
  //     .style("fill", (t) => {
  //       return d3.rgb(tipFillColor(t));
  //     });
  // });

  */
