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
import Tooltip from "./tooltip";
import { processNodes } from "../../util/processNodes";
import * as globals from "../../util/globals";

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
    metadata: React.PropTypes.object,
    tree: React.PropTypes.object,
    sequences: React.PropTypes.object,
    frequencies: React.PropTypes.object
  }
  componentDidMount() {
    // visualization(
    //   this.props.tree.tree,
    //   this.props.sequences.sequences,
    //   this.props.frequencies.frequencies,
    //   null /* todo: this is vaccineStrains */
    // )
  }
  componentDidUpdate(nextProps) {
    if (newVirus(this.props, nextProps)) {
      this.setupTree()
    }
  }
  setupTree() {
    const tree = d3.layout.tree()
      .size([this.treePlotHeight(globals.width), globals.width]);
    const nodes = processNodes(tree.nodes(props.tree.tree));
    const links = tree.links(nodes);

    const xValues = nodes.map((d) => {
      return +d.xvalue;
    });

    const yValues = nodes.map((d) => {
      return +d.yvalue;
    });

    this.setState({
      width: globals.width,
      nodes,
      links,
      xScale: d3.scale.linear()
                      .domain([d3.min(xValues), d3.max(xValues)])
                      .range([globals.margin, globals.width - globals.margin]),
      yScale: d3.scale.linear()
                      .domain([d3.min(yValues), d3.max(yValues)])
                      .range([globals.margin, this.treePlotHeight(globals.width) - globals.margin])
    })
  }
  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }
  drawNodes(nodes) {
    return nodes.map((node, index) => {
      return (
        <Node
          index={index}
          node={node}
          key={index}
          strain={node.strain}
          xScale={this.state.xScale}
          yScale={this.state.yScale}/>
      );
    });
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
  drawTooltip(node, type) {
    return (
      <Tooltip
        type={type}
        node={node}
        x={this.state.xScale(node.xvalue)}
        y={this.state.yScale(node.yvalue)}/>
    )
  }
  drawTreeIfData() {
    // is it NEW data? have we drawn this tree yet? setupTree()
    const p = this.props;
    let markup;

    if (
      p.metadata.metadata &&
      p.tree.tree
      // p.sequences.sequences &&
      // p.frequencies.frequencies
    ) {
      markup = (
        <svg
          height={this.treePlotHeight(this.state.width)}
          width={this.state.width}
          id="treeplot"
          style={{
          }}>
          {this.drawBranches(this.state.links)}
          {this.drawNodes(this.state.nodes)}
          {
            this.props.controls.selectedBranch ?
            this.drawTooltip(this.props.controls.selectedBranch.target, "branch") :
            null
          }
          {
            this.props.controls.selectedNode ?
            this.drawTooltip(this.props.controls.selectedNode, "node") :
            null
          }
        </svg>
      );
    }

    return markup;
  }
  render() {
    return (
      <div>
        {this.drawTreeIfData()}
      </div>
    );
  }
}

export default Tree;
