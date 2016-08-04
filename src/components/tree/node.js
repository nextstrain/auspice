import React from "react";
import Radium from "radium";
// import _ from 'lodash';
import { connect } from 'react-redux';
// import { FOO } from '../actions';
import * as globals from "../../util/globals";
import { NODE_MOUSEENTER, NODE_MOUSELEAVE } from "../../actions/controls";

@connect()
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
    controls: React.PropTypes.object,
    strain: React.PropTypes.string,
    hasChildren: React.PropTypes.bool,
    nuc_muts: React.PropTypes.string,
    showBranchLabels: React.PropTypes.bool,
    node: React.PropTypes.object
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }

  getNodeText() {
    /*
      this is a bit of trickiness. we'll see if it's too clever.
      if a node is a tip, we show the strain, and if it's not, we
      append a branch label (but only if show branch label is checked),
      and the placement of the branch label is based on the
      position of the node.

      What we're doing here is overloading the idea of node text
      to also include branch label, rather than making that its
      own thing.
    */
    let nodeText = "";
    if (this.props.strain) {
      /* this is a tip label */
      nodeText = this.props.strain;
    } else if (this.props.hasChildren && this.props.showBranchLabels) {
      /* this is a branch label */
      nodeText = this.props.nuc_muts;
    }

    return nodeText;
  }
  determineLegendMatch(node) {
    const colorBy = this.props.controls.colorBy;
    const c = this.props.controls;
    // construct a dictionary that maps a legend entry to the preceding interval
    let bool;
    // equates a tip and a legend element
    // exact match is required for categorical qunantities such as genotypes, regions
    // continuous variables need to fall into the interal (lower_bound[leg], leg]
    if (
      (colorBy === "lbi") ||
      (colorBy === "date") ||
      (colorBy === "dfreq") ||
      (colorBy === "HI_dist") ||
      (colorBy === "cHI")
    ) {
      bool = (node.coloring <= c.legendBoundsMap.upper_bound[c.selectedLegendItem]) &&
        (node.coloring > c.legendBoundsMap.lower_bound[c.selectedLegendItem]);
    } else {
      bool = node[this.props.controls.colorBy] === c.selectedLegendItem;
    }
    return bool;
  }
  tipRadius(node) {
    if (
      typeof node.pred_distance !== "undefined" &&
      this.props.controls.colorBy === "fitness"
    ) {
      return globals.distanceScale(node.pred_distance);
    } else {
      return globals.tipRadius;
    }
  }
  chooseTipRadius(node) {
    let r;

    if (this.determineLegendMatch(node)) {
      r = this.tipRadius(node) *
        globals.tipRadiusOnLegendMatchMultiplier;
    } else {
      r = this.tipRadius(node, this.props.controls.colorBy);
    }
    return r;
  }
  render() {
    return (
      <g
        onMouseEnter={() => {
          this.props.dispatch({
            type: NODE_MOUSEENTER,
            /*
              send the source and target nodes in the action,
              use x and y values in them to place tooltip
            */
            data: this.props.node
          });
        }}
        onMouseLeave={() => {
          this.props.dispatch({ type: NODE_MOUSELEAVE });
        }}
        transform={"translate(" + this.props.x + "," + this.props.y + ")"}>
        <circle
          fill={this.props.fill}
          r={
            this.props.hasChildren ?
              globals.nonTipNodeRadius :
              this.chooseTipRadius(this.props.node)} />
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

// const addBranchLabels = () => {
//   /* bug mutations is not necessary just execute treeplot.selectAll */
//   const mutations = treeplot.selectAll(".branchLabel")
//     .data(nodes)
//     .enter()
//     .append("text")
//     .attr("class", "branchLabel")
//     .style("font-size", branchLabelSize)
//     .style("text-anchor", "end")
//     .text(branchLabelText)
//     .style("visibility", "hidden");
// };


// d3.select("#branchlabels")
//   .on("change", (d) => {
//     branchLabels = document.getElementById("branchlabels").checked;
//     treeplot.selectAll(".branchLabel").data(nodes)
//       .text(branchLabelText)
//       .style("visibility", (branchLabels) ? "visible" : "hidden");
//     treeplot.selectAll(".annotation").data(clades)
//       .style("visibility", (branchLabels) ? "hidden" : "visible");
//   });
//
