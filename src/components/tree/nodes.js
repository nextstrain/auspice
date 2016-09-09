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
import {VictoryAnimation} from "victory";

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
    style: React.PropTypes.object
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  xVal(node, distanceMeasure, layout){
    return this.props.xScale(node.geometry[distanceMeasure][layout].xVal);
  }
  yVal(node, distanceMeasure, layout){
    return this.props.yScale(node.geometry[distanceMeasure][layout].yVal);
  }
  xMidpoint(node, distanceMeasure, layout){
    return this.props.xScale(node.geometry[distanceMeasure][layout].xValMidpoint);
  }
  yMidpoint(node, distanceMeasure, layout){
    return this.props.yScale(node.geometry[distanceMeasure][layout].yValMidpoint);
  }
  r_x(node, distanceMeasure, layout){
    if ("layout"==="radial"){
      return this.props.xScale(node.geometry[distanceMeasure][layout].radius_inner);
    }else{
      return 0;
    }
  }
  r_y(node, distanceMeasure, layout){
    if ("layout"==="radial"){
      return this.props.yScale(node.geometry[distanceMeasure][layout].radius_inner);
    }else{
      return 0;
    }
  }

  drawNodes(nodes) {
    const range = moment().range(
      new Date(+this.props.query.dmin),
      new Date(+this.props.query.dmax)
    )
    const nodeComponents = nodes.map((node, index) => {
      return (
        <VictoryAnimation duration={1000} key={index} data={{
          x: this.xVal(node, this.props.distanceMeasure, this.props.layout),
          y: this.yVal(node, this.props.distanceMeasure, this.props.layout)
        }}>
        {(props) => {
          return (
            <Node
              index={index}
              node={node}
              key={index}
              dateRange={range}
              fill={this.props.controls.colorScale(node[this.props.controls.colorBy])}
              showBranchLabels={this.props.controls.showBranchLabels}
              strain={node.strain}
              hasChildren={node.children ? true : false}
            />
          )
        }}
      </VictoryAnimation>
     );
    });
    return nodeComponents;
  }

  drawBranches(nodes) {
    const branchComponents = nodes.map((node, index) => {
      return (
        <VictoryAnimation duration={1000} key={index} data={{
            target_x:   this.xVal(node, this.props.distanceMeasure, this.props.layout),
            target_y:   this.yVal(node, this.props.distanceMeasure, this.props.layout),
            midpoint_x: this.xMidpoint(node, this.props.distanceMeasure, this.props.layout),
            midpoint_y: this.yMidpoint(node, this.props.distanceMeasure, this.props.layout),
            source_x:   this.xVal(node.parent, this.props.distanceMeasure, this.props.layout),
            source_y:   this.yVal(node.parent, this.props.distanceMeasure, this.props.layout),
            r_x: this.r_x(node.parent, this.props.distanceMeasure, this.props.layout),
            r_y: this.r_y(node.parent, this.props.distanceMeasure, this.props.layout),
            layout: this.props.layout,
        }}>
        {(props) => {
          return (
            <Branch
              {...this.props} {...props} animate={null}
              key={index} />
           );}}
      </VictoryAnimation>
      );
    });
    return branchComponents;
  }

  drawTooltip(node, type) {
    return (
      <Tooltip
        type={type}
        node={node}
        x={this.xVal(node, this.state.distanceMeasure, this.state.layout)}
        y={this.yVal(node, this.state.distanceMeasure, this.state.layout)}/>
    )
  }
  render() {
    return (
      <g>
        {this.drawBranches(this.props.nodes)}
        {this.drawNodes(this.props.nodes)}
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
