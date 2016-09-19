import React from "react";
import Radium from "radium";
// import _ from "lodash";
import { connect } from "react-redux";
import * as globals from "../../util/globals";
import { NODE_MOUSEENTER, NODE_MOUSELEAVE } from "../../actions/controls";
import moment from "moment";

const returnStateNeeded = (fullStateTree) => {
  return {
    selectedLegendItem: fullStateTree.controls.selectedLegendItem,
    colorBy: fullStateTree.controls.colorBy,
    colorScale: fullStateTree.controls.colorScale,
    showBranchLabels: fullStateTree.controls.showBranchLabels,
    legendBoundsMap: fullStateTree.controls.legendBoundsMap
  };
};

@connect(returnStateNeeded)
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
    showBranchLabels: React.PropTypes.bool,
    node: React.PropTypes.object,
    xScale: React.PropTypes.func,
    yScale: React.PropTypes.func,
    colorBy: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  shouldComponentUpdate(nextProps, nextState) {
    return true;
    /*
      If nextProps.selectedLegendItem is null, nothing is selected b/c mouseout.
      This means that and we want to check the present, not future state for match with this.props.selectedLegendItem.
      If it was a match on last render, we need to rerender, so that it goes back to default tip radius.

      DUPLICATION WARNING: this should be refactored so that it doesn't duplicate the code below in determineLegendMatch
      ultimately determineLegendMatch should take an argument.
    */
    //const _selectedLegendItem = nextProps.selectedLegendItem || this.props.selectedLegendItem;

    //if (this.props.hasChildren) {
      /* nodes without children are never visible, so will not update */
    //  return false;
    //}
    // else if (
    //   /* special cases */
    //   (nextProps.colorBy === "lbi") ||
    //   (nextProps.colorBy === "date") ||
    //   (nextProps.colorBy === "dfreq") ||
    //   (nextProps.colorBy === "HI_dist") ||
    //   (nextProps.colorBy === "cHI")
    // ) {
    //   return (nextProps.node.coloring <= nextProps.legendBoundsMap.upper_bound[_selectedLegendItem]) &&
    //     (nextProps.node.coloring > nextProps.legendBoundsMap.lower_bound[_selectedLegendItem]);
    // }
    //else {
    //  return true; /* loop over all nodes is sure to remove stale mouseover state, maybe fast enough with prod react*/
      /* default accessor */
      // some of the legend items don't trigger any nodes. why? mismatch capitalizations of same regions?
      // if (nextProps.node[nextProps.colorBy] !== _selectedLegendItem) { console.log(_selectedLegendItem) }
      // return nextProps.node[nextProps.colorBy] === _selectedLegendItem;
    //}
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
  determineLegendMatch() {
    const {
      node,
      colorBy,
      selectedLegendItem,
      legendBoundsMap
    } = this.props;
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
      (colorBy === "cTiter")
    ) {
      bool = (node.coloring <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
        (node.coloring > legendBoundsMap.lower_bound[selectedLegendItem]);
    } else {
      bool = node.attr[this.props.controls.colorBy] === this.props.selectedLegendItem;
    }
    return bool;
  }
  checkColorBy(node) {
    /* move this logic into the main chooseTipRadius function */
    if (
      typeof node.pred_distance !== "undefined" &&
      this.props.colorBy === "fitness"
    ) {
      return globals.distanceScale(node.pred_distance);
    } else {
      return globals.tipRadius;
    }
  }
  chooseTipRadius(node) {
    /* if it's not a tip, or if it is out of date range return 0 */
    if (this.props.hasChildren) {
      return globals.nonTipNodeRadius;
    }

    let inRange;
    if (typeof node.attr==="undefined"){
      inRange = this.props.dateRange.contains(
        moment(node.date.replace(/XX/g, "01"), "YYYY-MM-DD")
      );
    } else {
      inRange = this.props.dateRange.contains(
        moment(node.attr.date.replace(/XX/g, "01"), "YYYY-MM-DD")
      );
    }

    if (!inRange) {
      return globals.nonTipNodeRadius;
    }

    let r;
    /* see if it's currently selected, make it big */
    if (this.determineLegendMatch(node)) {
      r = this.checkColorBy(node) * globals.tipRadiusOnLegendMatchMultiplier;
    } else /* default */ {
      r = this.checkColorBy(node, this.props.controls.colorBy);
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

      transform={
        "translate(" +
        this.props.x +
        "," +
        this.props.y +
        ")"
      }>
        <circle
          fill={this.props.fill}
          r={
            this.props.node.children ?
              globals.nonTipNodeRadius :
              this.chooseTipRadius(this.props.node)} />
      </g>
    );
  }
}
// <text
//   dx={this.props.hasChildren ? -6 : 6}
//   dy={this.props.hasChildren ? -2 : 3}
//   style={{
//     fontFamily: "Helvetica",
//     fontSize: 8,
//     fontWeight: 300
//   }}
//   textAnchor={this.props.hasChildren ? "end" : "start"}>
//   {this.getNodeText()}
// </text>

export default TreeNode;

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
