import React from "react";
import Radium from "radium";
import moment from "moment";
import "moment-range";
// import _ from "lodash";
// import Flex from "./framework/flex";
//import { connect } from "react-redux";
// import { FOO } from "../actions";
import TreeNode from "./treeNode";
import Tip from "./tip";
import {slowTransitionDuration} from "../../util/globals";


/*
 * Tree creates all TreeNodes of the tree, which consist of branches and tips.
 * Tree assignes the desired locations to all TreeNodes
*/
class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      branchesFaded: false,
      branchesDistanceMeasure: this.props.distanceMeasure,
      branchesLayout: this.props.layout,
      branchesXScale: this.props.xScale,
      branchesYScale: this.props.yScale
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

  componentWillReceiveProps(nextProps) {
    if (this.state.branchesDistanceMeasure != nextProps.distanceMeasure
      || this.state.branchesLayout != nextProps.layout) {
      this.setState({branchesFaded: true});
    }
    setTimeout(function() {
      this.setState({
        branchesFaded: false,
        branchesDistanceMeasure: this.props.distanceMeasure,
        branchesLayout: this.props.layout,
        branchesXScale: this.props.xScale,
        branchesYScale: this.props.yScale
      });
    }.bind(this), 0.5*slowTransitionDuration);
  }

  xVal(node, distanceMeasure, layout, xScale, yScale) {
    return xScale(node.geometry[distanceMeasure][layout].xVal);
  }
  yVal(node, distanceMeasure, layout, xScale, yScale) {
    return yScale(node.geometry[distanceMeasure][layout].yVal);
  }
  xMidpoint(node, distanceMeasure, layout, xScale, yScale) {
    return xScale(node.geometry[distanceMeasure][layout].xValMidpoint);
  }
  yMidpoint(node, distanceMeasure, layout, xScale, yScale) {
    return yScale(node.geometry[distanceMeasure][layout].yValMidpoint);
  }
  r_x(node, distanceMeasure, layout, xScale, yScale) {
    if (layout === "radial") {
      return xScale(node.geometry[distanceMeasure][layout].radiusInner) - xScale(0);
    } else {
      return 0;
    }
  }
  r_y(node, distanceMeasure, layout, xScale, yScale) {
    if (layout === "radial") {
      return yScale(node.geometry[distanceMeasure][layout].radiusInner) - yScale(0);
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

  drawBranches(nodes, distanceMeasure, layout, xScale, yScale) {
      const branchComponents = nodes.map((node, index) => {
        return (
          <TreeNode
            key={index}
            node={node}
            x={this.xVal(node, distanceMeasure, layout, xScale, yScale)}
            y={this.yVal(node, distanceMeasure, layout, xScale, yScale)}
            midpoint_x={this.xMidpoint(node, distanceMeasure, layout, xScale, yScale)}
            midpoint_y={this.yMidpoint(node, distanceMeasure, layout, xScale, yScale)}
            source_x={this.xVal(node.parent, distanceMeasure, layout, xScale, yScale)}
            source_y={this.yVal(node.parent, distanceMeasure, layout, xScale, yScale)}
            r_x={this.r_x(node, distanceMeasure, layout, xScale, yScale)}
            r_y={this.r_y(node, distanceMeasure, layout, xScale, yScale)}
            smallBigArc={this.smallBigArc(node, distanceMeasure, layout)}
            leftRight={this.leftRight(node, distanceMeasure, layout)}
            nodeColor={this.props.nodeColor[index]}
            tipRadius={this.props.tipRadii[index]}
            nodeColorAttr={this.props.nodeColorAttr[index]}
            tipVisibility={this.props.tipVisibility[index]}
            showBranchLabels={this.props.showBranchLabels}
            strain={node.attr.strain}
            hasChildren={node.children ? true : false}
            layout={layout}
            distanceMeasure={distanceMeasure}
          />
        );
      });
      return branchComponents;
    }

  drawTips(nodes, distanceMeasure, layout, xScale, yScale) {
    const tipComponents = nodes.map((node, index) => {
      return (
        <Tip
          key={index}
          node={node}
          x={this.xVal(node, distanceMeasure, layout, xScale, yScale)}
          y={this.yVal(node, distanceMeasure, layout, xScale, yScale)}
          nodeColor={this.props.nodeColor[index]}
          tipRadius={this.props.tipRadii[index]}
          nodeColorAttr={this.props.nodeColorAttr[index]}
          tipVisibility={this.props.tipVisibility[index]}
          showBranchLabels={this.props.showBranchLabels}
          strain={node.attr.strain}
          hasChildren={node.children ? true : false}
          layout={layout}
          distanceMeasure={distanceMeasure}
        />
      );
    });
    return tipComponents;
  }

  render() {
    const branchesOpacity = this.state.branchesFaded ? "0" : "1";
    return (
      <g>
        <g style={{
          transition: `opacity ${0.5*slowTransitionDuration}ms linear`,
          opacity: branchesOpacity
        }}>
          {this.drawBranches(this.props.nodes, this.state.branchesDistanceMeasure, this.state.branchesLayout,
            this.state.branchesXScale, this.state.branchesYScale)}
        </g>
        <g>
          {this.drawTips(this.props.nodes, this.props.distanceMeasure, this.props.layout,
            this.props.xScale, this.props.yScale)}
        </g>
      </g>
    );
  }
}

export default Tree;
