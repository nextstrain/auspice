import React from "react";
import Radium from "radium";
import moment from "moment";
import "moment-range";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Branch from "./branch";
import Node from "./node";
import Tooltip from "./tooltip";

@connect((state) => {
  return {controls: state.controls};
})
@Radium
class Nodes extends React.Component {
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
  drawNodes(nodes) {
    const range = moment().range(
      new Date(+this.props.query.dmin),
      new Date(+this.props.query.dmax)
    )
    return nodes.map((node, index) => {
      return (
        <Node
          index={index}
          node={node}
          key={index}
          dateRange={range}
          fill={this.props.controls.colorScale(node[this.props.controls.colorBy])}
          nuc_muts={node.nuc_muts}
          showBranchLabels={this.props.controls.showBranchLabels}
          strain={node.strain}
          xScale={this.props.xScale}
          yScale={this.props.yScale}/>
      );
    });
  }
  drawBranches(nodes) {
    const branchComponents = nodes.map((node, index) => {
      return (
        <Branch
          xscale={this.props.xScale}
          yscale={this.props.yScale}
          datum={node}
          key={index} />
      );
    });
    return branchComponents;
  }
  drawTooltip(node, type) {
    return (
      <Tooltip
        type={type}
        node={node}
        x={this.props.xScale(node.xvalue)}
        y={this.props.yScale(node.yvalue)}/>
    )
  }

  render() {
    return (
      <g>
        {this.drawNodes(this.props.nodes)}
        {this.drawBranches(this.props.nodes)}
      </g>
    );
  }
}

export default Nodes;
//
// drawTreeIfData() {
//   let markup;
//
//     markup = (

//         {this.drawBranches(this.state.branches)}
//         {this.drawNodes(this.state.nodes)}
//         {
//           this.props.controls.selectedBranch ?
//           this.drawTooltip(this.props.controls.selectedBranch.target, "branch") :
//           null
//         }
//         {
//           this.props.controls.selectedNode ?
//           this.drawTooltip(this.props.controls.selectedNode, "node") :
//           null
//         }
//     );
//     return markup;
// }
