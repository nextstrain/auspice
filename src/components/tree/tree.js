import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from './framework/flex';
import { connect } from "react-redux";
// import { FOO } from "../actions";
// import { visualization } from "../../visualization/visualization";
import d3 from "d3";
import Link from "./branch";
import Node from "./node";
import { processNodes } from "../../util/processNodes";
import BranchLabel from "./branch-label";

const returnStateNeeded = (fullStateTree) => {
  return {
    metadata: fullStateTree.metadata,
    tree: fullStateTree.tree,
    sequences: fullStateTree.sequences,
    frequencies: fullStateTree.frequencies,
    controls: fullStateTree.controls
  };
};

@connect(returnStateNeeded)
@Radium
class Tree extends React.Component {
  constructor(props) {
    super(props);
    /* static for now, then hand rolled version of https://github.com/digidem/react-dimensions */
    const width = 1000;
    const margin = 60;

    const tree = d3.layout.tree()
      .size([this.treePlotHeight(width), width]);
    const nodes = processNodes(tree.nodes(props.tree.tree));
    const links = tree.links(nodes);

    const xValues = nodes.map((d) => {
      return +d.xvalue;
    });

    const yValues = nodes.map((d) => {
      return +d.yvalue;
    });

    this.state = {
      width,
      nodes,
      links,
      xScale: d3.scale.linear()
                      .domain([d3.min(xValues), d3.max(xValues)])
                      .range([margin, width - margin]),
      yScale: d3.scale.linear()
                      .domain([d3.min(yValues), d3.max(yValues)])
                      .range([margin, this.treePlotHeight(width) - margin])
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
    metadata: React.PropTypes.object,
    tree: React.PropTypes.object,
    sequences: React.PropTypes.object,
    frequencies: React.PropTypes.object
  }
  static defaultProps = {
    // foo: "bar"
  }
  componentDidMount() {
    // visualization(
    //   this.props.tree.tree,
    //   this.props.sequences.sequences,
    //   this.props.frequencies.frequencies,
    //   null /* todo: this is vaccineStrains */
    // )
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }
  drawNodes(nodes) {
    const nodeComponents = nodes.map((node, index) => {
      return (
        <Node
          node={node}
          key={index}
          fill={this.props.controls.colorScale(node[this.props.controls.colorBy])}
          nuc_muts={node.nuc_muts}
          showBranchLabels={this.props.controls.showBranchLabels}
          strain={node.strain}
          hasChildren={node.children ? true : false}
          x={this.state.xScale(node.xvalue)}
          y={this.state.yScale(node.yvalue)}/>
      );
    });
    return nodeComponents;
  }
  drawBranches(links) {
    const branchComponents = links.map((link, index) => {
      return (
        <Link
          xscale={this.state.xScale}
          yscale={this.state.yScale}
          datum={link}
          key={index} />
      );
    });
    return branchComponents;
  }
  drawBranchLabels(nodes) {
    const branchLabelComponents = nodes.map((node, index) => {
      if (node.children) {
        return (
          <BranchLabel
            key={index}
            x={this.state.xScale(node.xvalue)}
            y={this.state.yScale(node.yvalue)}/>
        );
      }
    });
    return branchLabelComponents;
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <svg
          height={this.treePlotHeight(this.state.width)}
          width={this.state.width}
          id="treeplot"
          style={{
          }}>
          {this.drawBranches(this.state.links)}
          {this.drawNodes(this.state.nodes)}
        </svg>
      </div>
    );
  }
}

export default Tree;
