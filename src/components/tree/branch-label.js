import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class BranchLabel extends React.Component {
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
  render() {
    const styles = this.getStyles();
    return (
      <text
        x={this.props.x}
        y={this.props.y}> allo :D </text>
    );
  }
}

export default BranchLabel;

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
