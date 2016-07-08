import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
// import { connect } from 'react-redux';
// import { FOO } from '../actions';

// @connect(state => {
//   return state.FOO;
// })
@Radium
class TreeNode extends React.Component {
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
    // foo: React.PropTypes.string
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
  getNodeText() {
    let nodeText = "";
    if (this.props.strain) {
      nodeText = this.props.strain
    } else if (this.props.hasChildren && this.props.showBranchLabels) {
      nodeText = this.props.nuc_muts
    }

    return nodeText;
  }
  render() {
    const styles = this.getStyles();
    return (
      <g transform={"translate(" + this.props.x + "," + this.props.y + ")"}>
        <circle r={this.props.hasChildren ? 0 : 3} />
        <text
          dx={this.props.hasChildren ? -6 : 6}
          dy={this.props.hasChildren ? -2 : 3}
            style={{
              fontFamily: "Helvetica",
              fontSize: 8,
              fontWeight: 300
            }}
          textAnchor={this.props.hasChildren ? "end" : "start"}>
          {this.getNodeText()}
        </text>
      </g>
    )
  }
}

export default TreeNode;

// if ((typeof tip_labels !== "undefined") && (tip_labels)) {
//   treeplot.selectAll(".tipLabel").data(tips)
//     .enter()
//     .append("text")
//     .attr("class", "tipLabel")
//     .style("font-size", (d) => {return tipLabelSize(d) + "px"; })
//     .text(tipLabelText);
// }
//
// var tipCircles = treeplot.selectAll(".tip")
//   .data(tips)
//   .enter()
//   .append("circle")
//   .attr("class", "tip")
//   .attr("id", (d) => { return (d.strain).replace(/\//g, ""); })
//   .attr("r", tipRadius)
//   .style("visibility", tipVisibility)
//   .style("fill", tipFillColor)
//   .style("stroke", tipStrokeColor);


// const serumCircles = treeplot.selectAll(".serum") /* bug does this need to be stored or just executed? */
//   .data(sera)
//   .enter()
//   .append("text")
//   .attr("class", "serum")
//   .attr("text-anchor", "middle")
//   .attr("dominant-baseline", "central")
//   .style("font-family", "FontAwesome")
//   .style("fill", (d) => {if (d === focusNode) {return "#FF3300";} else {return "#555555";}})
//   .style("font-size", (d) => {if (d === focusNode) {return "30px";} else {return "12px";}})
//   .text((d) => {
//     if (d === focusNode) {return "\uf05b";} else {return serumSymbol;}
//   })
//   .style("visibility", serumVisibility)
//   .style("cursor", "crosshair");
//
//
//   var vaccineCircles = treeplot.selectAll(".vaccine")
//     .data(vaccines)
//     .enter()
//     .append("text")
//     .attr("class", "vaccine")
//     .attr("text-anchor", "middle")
//     .attr("dominant-baseline", "central")
//     .style("font-size", "28px")
//     .style("font-family", "FontAwesome")
//     .style("fill", "#555555")
//     .text(() => { return "\uf00d"; })
//     .style("cursor", "default");
