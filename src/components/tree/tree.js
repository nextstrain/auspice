import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from './framework/flex';
import { connect } from "react-redux";
// import { FOO } from "../actions";
// import { visualization } from "../../visualization/visualization";
import d3 from "d3";
import { processNodes } from "../../util/processNodes";
import * as globals from "../../util/globals";
import moment from "moment";
import "moment-range";
import Nodes from "./nodes";

const returnStateNeeded = (fullStateTree) => {
  return {
    tree: fullStateTree.tree,
    controls: fullStateTree.controls,
  };
};

@connect(returnStateNeeded)
@Radium
class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      okToDraw: false
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
    // is it NEW data? have we drawn this tree yet? setupTree()
    if (this.state.currentDatasetGuid !== this.props.tree.datasetGuid) {
      this.setupTree();
      return;
    }
  }
  componentDidUpdate() {
    // is it NEW data? have we drawn this tree yet? setupTree()
    if (this.state.currentDatasetGuid !== this.props.tree.datasetGuid) {
      this.setupTree();
      return;
    }
  }
  updateScales(nodes, branches) {
    const xValues = nodes.map((d) => {
      return +d.xvalue;
    });

    const yValues = nodes.map((d) => {
      return +d.yvalue;
    });

    this.setState({
      okToDraw: true,
      currentDatasetGuid: this.props.tree.datasetGuid,
      nodes: nodes,
      branches: branches,
      width: globals.width,
      xScale: d3.scale.linear()
                      .domain([d3.min(xValues), d3.max(xValues)])
                      .range([globals.margin, globals.width - globals.margin]),
      yScale: d3.scale.linear()
                      .domain([d3.min(yValues), d3.max(yValues)])
                      .range([globals.margin, this.treePlotHeight(globals.width) - globals.margin])
    });
  }
  setupTree() {
    const tree = d3.layout.tree()
      .size([this.treePlotHeight(globals.width), globals.width]);
    const nodes = processNodes(tree.nodes(this.props.tree.tree));
    nodes[0].parent = nodes[0];
    const branches = tree.links(nodes);
    this.updateScales(nodes, branches);
  }
  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }
  createSvgAndNodes() {
  drawNodes(nodes) {
    const range = moment().range(
      new Date(+this.props.query.dmin),
      new Date(+this.props.query.dmax)
    )
    const nodeComponents = nodes.map((node, index) => {
     return (
        <VictoryAnimation duration={1000} key={index} data={{
            x: this.xVal(node, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time"),
            y: this.yVal(node, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time")
          }}>
          {(props) => {
            return (
              <Node
                {...this.props} {...props} animate={null}
                controls={this.props.controls}
                node={node}
                dateRange={range}
                fill={this.props.controls.colorScale(node.attr[this.props.controls.colorBy])}
                nuc_muts={node.nuc_muts}
                showBranchLabels={this.props.controls.showBranchLabels}
                strain={node.strain}
                hasChildren={node.children ? true : false}/>
            )
          }}
        </VictoryAnimation>
      );
    });
    return nodeComponents;
  }
  drawBranches(links) {
    const branchComponents = links.map((link, index) => {
      return (
        <VictoryAnimation duration={1000} key={index} data={{
            target_x: this.xVal(link.target, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time"),
            target_y: this.yVal(link.target, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time"),
            source_x: this.xVal(link.source, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time"),
            source_y: this.yVal(link.source, (this.state.remove_me%2)?"radial":"rectangular", (this.state.remove_me%3)?"mutation":"time"),
            layout: (this.state.remove_me%2)?"radial":"rectangular",
            center:this.state.center,
        }}>
        {(props) => {
          return (
            <Link
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
      <svg
        width={this.state.width}
        height={this.treePlotHeight(this.state.width)}
        id="treeplot">
        <Nodes
          query={this.props.query}
          nodes={this.state.nodes}
          xScale={this.state.xScale}
          yScale={this.state.yScale}/>
      </svg>
    )
  }
  render() {
    /*
      1. if we just loaded a new dataset, run setup tree,
      2. otherwise if we just rescaled, run updatescales,
      3. otherwise just have components rerender because for instance colorby changed
    */
    return (
      <div>
        {this.state.okToDraw ? this.createSvgAndNodes() : "We don't have tree data yet [spinner]"}
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <svg
          onClick={() => { this.setState({remove_me: this.state.remove_me+1}) }}
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
      </div>
    );
  }
}



export default Tree;
