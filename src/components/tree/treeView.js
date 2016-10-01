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


/*
 * TreeView creates and SVG and scales according to layout
 * such that branches and tips are correctly placed.
 * will handle zooming
*/

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
    // Do we have a tree to draw? if yes, check whether it needs to be redrawn
    if (!(nextProps.tree.datasetGuid && nextProps.tree.nodes)){
      console.log("no data yet");
      this.setState({okToDraw: false});
    } else if ((nextProps.tree.datasetGuid !== this.props.tree.datasetGuid)
               || (nextProps.location.query.l !== this.props.location.query.l)
               || (nextProps.location.query.m !== this.props.location.query.m)) {
      const scales = this.updateScales(nextProps.tree.nodes, nextProps.location.query.l, nextProps.location.query.m);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: nextProps.tree.datasetGuid,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  updateScales(nodes, layout_in, distanceMeasure_in) {
    const layout = (layout_in) ? layout_in : "rectangular";
    const distanceMeasure = (distanceMeasure_in) ? distanceMeasure_in : "div";

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

  treePlotHeight(width) {
    return 400 + 0.30 * width;
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
            colorScale={this.props.colorScale}
            location={this.props.location}
            nodes={this.props.tree.nodes}
            layout={(this.props.location.query.l)?this.props.location.query.l:"rectangular"}
            distanceMeasure={(this.props.location.query.m)?this.props.location.query.m:"div"}
            xScale={this.state.xScale}
            yScale={this.state.yScale}
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
    return (
      <div>
        {this.state.okToDraw ? this.createTree() : "We don't have tree data yet [spinner]"}
      </div>
    );
  }
}


export default TreeView;
