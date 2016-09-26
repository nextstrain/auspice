import React from "react";
import Radium from "radium";
import moment from "moment";
import "moment-range";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import Branch from "./branch";
import {VictoryAnimation} from "victory";


/*
 * Tree creates all TreeNodes of the tree, which consist of branches and tips.
 * Tree assignes the desired locations to all TreeNodes
*/
@connect((state) => {
  return {controls: state.controls};
})
@Radium
class Tree extends React.Component {
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

  xVal(node, distanceMeasure, layout) {
    return this.props.xScale(node.geometry[distanceMeasure][layout].xVal);
  }
  yVal(node, distanceMeasure, layout) {
    return this.props.yScale(node.geometry[distanceMeasure][layout].yVal);
  }
  xMidpoint(node, distanceMeasure, layout) {
    return this.props.xScale(node.geometry[distanceMeasure][layout].xValMidpoint);
  }
  yMidpoint(node, distanceMeasure, layout) {
    return this.props.yScale(node.geometry[distanceMeasure][layout].yValMidpoint);
  }
  r_x(node, distanceMeasure, layout) {
    if (layout === "radial") {
      return this.props.xScale(node.geometry[distanceMeasure][layout].radiusInner) - this.props.xScale(0);
    } else {
      return 0;
    }
  }
  r_y(node, distanceMeasure, layout) {
    if (layout === "radial") {
      return this.props.yScale(node.geometry[distanceMeasure][layout].radiusInner) - this.props.yScale(0);
    } else {
      return 0;
    }
  }
  smallBigArc(node, distanceMeasure, layout) {
    if (layout === "radial") {
      return node.geometry[distanceMeasure][layout].smallBigArc;
    } else {
      return 0;
    }
  }
  leftRight(node, distanceMeasure, layout) {
    if (layout === "radial") {
      return node.geometry[distanceMeasure][layout].leftRight;
    } else {
      return 0;
    }
  }

  drawBranches(nodes) {
    const range = moment().range(
      new Date(+this.props.query.dmin),
      new Date(+this.props.query.dmax)
    )
    const branchComponents = nodes.map((node, index) => {
      return (
        <VictoryAnimation duration={1000} key={index} data={{
          x: this.xVal(node, this.props.distanceMeasure, this.props.layout),
          y: this.yVal(node, this.props.distanceMeasure, this.props.layout),
          midpoint_x: this.xMidpoint(node, this.props.distanceMeasure, this.props.layout),
          midpoint_y: this.yMidpoint(node, this.props.distanceMeasure, this.props.layout),
          source_x:   this.xVal(node.parent, this.props.distanceMeasure, this.props.layout),
          source_y:   this.yVal(node.parent, this.props.distanceMeasure, this.props.layout),
          r_x: this.r_x(node, this.props.distanceMeasure, this.props.layout),
          r_y: this.r_y(node, this.props.distanceMeasure, this.props.layout),
          smallBigArc: this.smallBigArc(node, this.props.distanceMeasure, this.props.layout),
          leftRight: this.leftRight(node, this.props.distanceMeasure, this.props.layout)
        }}>
        {(props) => {
          return (
            <Branch
              {...this.props} {...props} animate={null}
              key={index}
              node={node}
              dateRange={range}
              fill={this.props.nodeColor ? this.props.nodeColor(node) : "CCC"}
              showBranchLabels={this.props.controls.showBranchLabels}
              strain={node.attr.strain}
              hasChildren={node.children ? true : false}
            />
          )
        }}
      </VictoryAnimation>
     );
    });
    return branchComponents;
  }

  render() {
    return (
      <g>
        {this.drawBranches(this.props.nodes)}
      </g>
    );
  }
}

export default Tree;
