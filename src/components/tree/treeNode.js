import React from "react";
import Radium from "radium";
// import _ from "lodash";
import { connect } from "react-redux";
import { BRANCH_MOUSEENTER, BRANCH_MOUSELEAVE } from "../../actions/controls";
import Tip from "./tip";
import Tooltip from "./tooltip";

/*
 * A TreeNode draws the path leading to the node and instantiates
 * Tip attached to its end. TreeNode determines the apprearance and
 * behavior of the path.
*/
@connect()
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
    showBranchLabels: React.PropTypes.bool,
    node: React.PropTypes.object,
    fill: React.PropTypes.string,
    tipRadius: React.PropTypes.number,
    branchStrokeWidth: React.PropTypes.number,
    branchStrokeColor: React.PropTypes.string,
  }
  static defaultProps = {
    // foo: "bar"
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
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
    } else if (this.props.node.children && this.props.showBranchLabels) {
      /* this is a branch label */
      nodeText = this.props.node.muts.join(',');
    }

    return nodeText;
  }

  branchStrokeWidth() {
    return 2;
  }

  branchStrokeColor() {
    return this.props.nodeColor;
  }

  branchPoints() {
    const mod = 0;

    if (this.props.layout==="rectangular"){
      return 'M'+(this.props.source_x - mod).toString() +
        " " +
        this.props.source_y.toString() +
        " L " +
        (this.props.midpoint_x - mod).toString() +
        " " +
        this.props.midpoint_y.toString() +
        " L " +
        (this.props.x).toString() +
        " " +
        this.props.y.toString();
    }else if (this.props.layout==="radial"){
      var tmp_d = 'M '+(this.props.source_x).toString() +
        "  " +
        this.props.source_y.toString() +
        " A " +
        this.props.r_x.toString() +
        " " +
        this.props.r_y.toString() +
        " 0 " + (this.props.smallBigArc?"1 ":"0 ") +  (this.props.leftRight?"0 ":"1 ") +
        this.props.midpoint_x.toString() +
        " " +
        this.props.midpoint_y.toString() +
        " L " +
        this.props.x.toString() +
        " " +
        this.props.y.toString();
      return tmp_d;
    }
  }

  render() {
    return (
      <g>
        <path
          d={this.branchPoints()}
          onMouseEnter={() => {
            this.props.dispatch({
              type: BRANCH_MOUSEENTER,
              /*
                send the source and target nodes in the action,
                use x and y values in them to place tooltip
              */
              data: this.props.datum
            });
          }}
          onMouseLeave={() => {
            this.props.dispatch({ type: BRANCH_MOUSELEAVE });
          }}
          style={{
            stroke: this.branchStrokeColor(),
            strokeWidth: this.branchStrokeWidth(),
            strokeLinejoin: "round",
            fill: "none",
            cursor: "pointer"
          }}>
        </path>
        <Tip {...this.props}/>
      </g>
    );
  }
}

export default TreeNode;


// drawTooltip(node, type) {
//   return (
//     <Tooltip
//       type={type}
//       node={node}
//       x={this.xVal(node, this.state.distanceMeasure, this.props.layout)}
//       y={this.yVal(node, this.state.distanceMeasure, this.props.layout)}
//     />
//   )
// }

// <text
//   dx={this.props.hasChildren ? -6 : 6}
//   dy={this.props.hasChildren ? -2 : 3}
//     style={{
//       fontFamily: "Helvetica",
//       fontSize: 8,
//       fontWeight: 300
//     }}
//   textAnchor={this.props.hasChildren ? "end" : "start"}>
//   {this.getNodeText()}
// </text>


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
