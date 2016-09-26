import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from './framework/flex';
import { connect } from "react-redux";
// import { FOO } from "../actions";
// import { visualization } from "../../visualization/visualization";
import d3 from "d3";
import { processNodes, calcLayouts } from "../../util/processNodes";
import * as globals from "../../util/globals";
import Tree from "./tree";

import {Viewer, ViewerHelper} from 'react-svg-pan-zoom';

const returnStateNeeded = (fullStateTree) => {
  return {
    tree: fullStateTree.tree,
    controls: fullStateTree.controls
  };
};

@connect(returnStateNeeded)
@Radium
class TreeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      okToDraw: false,
      value: ViewerHelper.getDefaultValue(),
      tool: "pan",  //one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
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
    tree: React.PropTypes.object
  }
  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.tree.datasetGuid) {
      const nodes = this.setupTree();
      const scales = this.updateScales(nodes);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.tree.datasetGuid,
        nodes: nodes,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    // is it NEW data? have we drawn this tree yet? setupTree()
    console.log('will receive props in tree', this.state.currentDatasetGuid, this.props.tree.datasetGuid, this.props)
    if (!this.props.tree.datasetGuid){
      console.log("no data yet");
      this.setState({okToDraw: false});
    } else if (this.state.currentDatasetGuid !== this.props.tree.datasetGuid) {
      const nodes = this.setupTree();
      const scales = this.updateScales(nodes, nextProps.query.l, nextProps.query.m);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.tree.datasetGuid,
        nodes: nodes,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
      return;
    } else if (this.state.currentDatasetGuid
              && (nextProps.query.l !== this.props.query.l
                  || nextProps.query.m !== this.props.query.m) ) {
      const scales = this.updateScales(this.state.nodes, nextProps.query.l, nextProps.query.m);
      this.setState({
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  updateScales(nodes, layout_in, distanceMeasure_in) {
    const layout = (layout_in)?layout_in:"rectangular";
    const distanceMeasure = (distanceMeasure_in)?distanceMeasure_in:"div";
    console.log("Making scales:",layout, distanceMeasure);

    const xValues = nodes.map((node) => {
      return +node.geometry[distanceMeasure][layout].xVal;
    });

    const yValues = nodes.map((node) => {
      return +node.geometry[distanceMeasure][layout].yVal;
    });

    const xScale = d3.scale.linear().range([globals.margin, globals.width - globals.margin]);
    const yScale = d3.scale.linear().range([
      globals.margin,
      this.treePlotHeight(globals.width) - globals.margin
    ]);

    if (layout === "radial") {
      xScale.domain([-d3.max(xValues), d3.max(xValues)]);
      yScale.domain([-d3.max(xValues), d3.max(xValues)]);
    } else {
      xScale.domain([d3.min(xValues), d3.max(xValues)]);
      yScale.domain([d3.min(yValues), d3.max(yValues)]);
    }

    return {
      xScale,
      yScale
    };

  }

  setupTree() {
    const tree = d3.layout.tree()
      .size([this.treePlotHeight(globals.width), globals.width]);
    const nodes = processNodes(tree.nodes(this.props.tree.tree));
    nodes[0].parent = nodes[0];
    calcLayouts(nodes, ["div", "num_date"]);
    return nodes;
  }

  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }

  determineLegendMatch(node) {
    const {
      colorBy,
      continuous,
      selectedLegendItem,
      legendBoundsMap
    } = this.props.controls;
    // construct a dictionary that maps a legend entry to the preceding interval
    let bool;
    // equates a tip and a legend element
    // exact match is required for categorical qunantities such as genotypes, regions
    // continuous variables need to fall into the interal (lower_bound[leg], leg]
    if (continuous) {
      bool = (node.attr[colorBy] <= legendBoundsMap.upper_bound[selectedLegendItem]) &&
        (node.attr[colorBy] > legendBoundsMap.lower_bound[selectedLegendItem]);
    } else {
      bool = node.attr[colorBy] === selectedLegendItem;
    }
    return bool;
  }


  tipRadius (node){
    if (this.determineLegendMatch(node)){
      return 6;
    }else{
      return 3;
    }
  }

  nodeColor(node){
    if (node.clade%10){
      return this.props.controls.colorScale(node.attr[this.props.controls.colorBy]);
    }else{
      return "CCC";
    }
  }

  createTree() {
    // <Viewer
    //   width={this.state.width}
    //   height={this.treePlotHeight(this.state.width)}
    //   value={this.state.value}
    //   tool={this.state.tool}
    //   onChange={this.handleChange.bind(this)}
    //   onClick={this.handleClick.bind(this)}>
    return (
        <svg
          width={this.state.width}
          height={this.treePlotHeight(this.state.width)}
          id="treeplot">
          <Tree
            query={this.props.query}
            nodes={this.state.nodes}
            layout={(this.props.query.l)?this.props.query.l:"rectangular"}
            distanceMeasure={(this.props.query.m)?this.props.query.m:"div"}
            xScale={this.state.xScale}
            yScale={this.state.yScale}
            tipRadius={this.tipRadius.bind(this)}
            nodeColor={this.nodeColor.bind(this)}
          />
        </svg>
    )
  // </Viewer>
  }
  handleChange(event) {
    // console.log('scaleFactor', event.scaleFactor);

    this.setState({value: event.value});
  }

  handleClick(event){
    // console.log('click', event.x, event.y, event.originalEvent);
  }
  render() {
    /*
      1. if we just loaded a new dataset, run setup tree,
      2. otherwise if we just rescaled, run updatescales,
      3. otherwise just have components rerender because for instance colorby changed
    */
    console.log('tree', this.props)
    return (
      <div>
        {this.state.okToDraw ? this.createTree() : "We don't have tree data yet [spinner]"}
      </div>
    );
  }
}


export default TreeView;
