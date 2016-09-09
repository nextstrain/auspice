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

import {Viewer, ViewerHelper} from 'react-svg-pan-zoom';

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
      value: ViewerHelper.getDefaultValue(),
      tool: "zoom",  //one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
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
  handleChange(event) {
    console.log('scaleFactor', event.scaleFactor);

    this.setState({value: event.value});
  }

  handleClick(event){
    console.log('click', event.x, event.y, event.originalEvent);
  }
  render() {
    /*
      1. if we just loaded a new dataset, run setup tree,
      2. otherwise if we just rescaled, run updatescales,
      3. otherwise just have components rerender because for instance colorby changed
    */
    return (
        <Viewer
          width={this.state.width}
          height={this.treePlotHeight(this.state.width)}
          value={this.state.value}
          tool={this.state.tool}
          onChange={this.handleChange.bind(this)}
          onClick={this.handleClick.bind(this)}>
        </Viewer>
        {this.state.okToDraw ? this.createSvgAndNodes() : "We don't have tree data yet [spinner]"}
      <div>
      </div>
    );
  }
}



export default Tree;
