import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from './framework/flex';
// import { connect } from "react-redux";
// import { FOO } from "../actions";
// import { visualization } from "../../visualization/visualization";
import d3 from "d3";
import { processNodes, calcLayouts } from "../../util/processNodes";
import * as globals from "../../util/globals";
import Tree from "./tree";
import Grid from "./grid";
import Card from "../framework/card";
import Legend from "../controls/legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import MoveIcon from "../framework/move-icon";

import {Viewer, ViewerHelper} from 'react-svg-pan-zoom';


/*
 * TreeView creates and SVG and scales according to layout
 * such that branches and tips are correctly placed.
 * will handle zooming
*/
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
    tree: React.PropTypes.object
  }

  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.datasetGuid) {
      const scales = this.updateScales(nodes);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.datasetGuid,
        nodes: nodes,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    // Do we have a tree to draw? if yes, check whether it needs to be redrawn
    if (!(nextProps.datasetGuid && nextProps.nodes)){
      this.setState({okToDraw: false});
    } else if ((nextProps.datasetGuid !== this.props.datasetGuid)
               || (nextProps.layout !== this.props.layout)
               || (nextProps.distanceMeasure !== this.props.distanceMeasure)) {
      const scales = this.updateScales(nextProps.nodes, nextProps.layout, nextProps.distanceMeasure);
      console.log("setting ok to draw");
      this.setState({
        okToDraw: true,
        currentDatasetGuid: nextProps.datasetGuid,
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

    const height = this.treePlotHeight(globals.width);
    const minDim = ((globals.width<height) ? globals.width : height) - 2 * globals.margin;
    const xScale = d3.scale.linear().range([globals.margin, globals.width - globals.margin]);
    const yScale = d3.scale.linear().range([globals.margin, height - globals.margin ]);

    if (layout === "radial") {
      xScale.domain([-d3.max(xValues), d3.max(xValues)]);
      yScale.domain([-d3.max(xValues), d3.max(xValues)]);
      xScale.range([globals.width - minDim - globals.margin, globals.width - globals.margin]);
      yScale.range([height - minDim - globals.margin, height - globals.margin]);
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
      <Card title="Phylogeny">
        <svg
          width={this.state.width}
          height={this.treePlotHeight(this.state.width)}
          id="treeplot"
        >
          <defs>
            <filter id="dropshadow" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <Grid
            layout={this.props.layout}
            distanceMeasure={this.props.distanceMeasure}
            xScale={this.state.xScale}
            yScale={this.state.yScale}
            nodes={this.props.nodes}
          />
          <Legend colorScale={this.props.colorScale}/>
          <Tree
            nodes={this.props.nodes}
            nodeColor={this.props.nodeColor}
            nodeColorAttr={this.props.nodeColorAttr}
            tipRadii={this.props.tipRadii}
            tipVisibility={this.props.tipVisibility}
            layout={this.props.layout}
            distanceMeasure={this.props.distanceMeasure}
            xScale={this.state.xScale}
            yScale={this.state.yScale}
          />
        <ZoomOutIcon
          y={this.treePlotHeight(this.state.width) - 40}
          x={this.state.width - 40}/>
        <ZoomOutIcon
          y={this.treePlotHeight(this.state.width) - 40}
          x={this.state.width - 40}/>
        <ZoomOutIcon
          y={this.treePlotHeight(this.state.width) - 40}
          x={this.state.width - 40}/>

        <rect
          width={30}
          height={30}
          rx="3" ry="3"
          fill={"rgb(255,255,255)"}
          filter="url(#dropshadow)"
          x={this.state.width - 40}
          y={this.treePlotHeight(this.state.width) - 80} />
        <g transform={`translate(${this.state.width - 35},${this.treePlotHeight(this.state.width) - 75}), scale(.04)`}>
          <path
            d="M464.524,412.846l-97.929-97.925c23.6-34.068,35.406-72.04,35.406-113.917c0-27.218-5.284-53.249-15.852-78.087    c-10.561-24.842-24.838-46.254-42.825-64.241c-17.987-17.987-39.396-32.264-64.233-42.826    C254.246,5.285,228.217,0.003,200.999,0.003c-27.216,0-53.247,5.282-78.085,15.847C98.072,26.412,76.66,40.689,58.673,58.676    c-17.989,17.987-32.264,39.403-42.827,64.241C5.282,147.758,0,173.786,0,201.004c0,27.216,5.282,53.238,15.846,78.083    c10.562,24.838,24.838,46.247,42.827,64.241c17.987,17.986,39.403,32.257,64.241,42.825    c24.841,10.563,50.869,15.844,78.085,15.844c41.879,0,79.852-11.807,113.922-35.405l97.929,97.641    c6.852,7.231,15.406,10.849,25.693,10.849c10.089,0,18.699-3.566,25.838-10.705c7.139-7.138,10.704-15.748,10.704-25.837    S471.567,419.889,464.524,412.846z M291.363,291.358c-25.029,25.033-55.148,37.549-90.364,37.549    c-35.21,0-65.329-12.519-90.36-37.549c-25.031-25.029-37.546-55.144-37.546-90.36c0-35.21,12.518-65.334,37.546-90.36    c25.026-25.032,55.15-37.546,90.36-37.546c35.212,0,65.331,12.519,90.364,37.546c25.033,25.026,37.548,55.15,37.548,90.36 C328.911,236.214,316.392,266.329,291.363,291.358z"
            style="fill: rgb(0, 0, 0);"></path>
          <path
            d="M283.232,182.728h-63.954v-63.953c0-2.475-0.905-4.615-2.712-6.424c-1.809-1.809-3.951-2.712-6.423-2.712H191.87    c-2.474,0-4.615,0.903-6.423,2.712c-1.807,1.809-2.712,3.949-2.712,6.424v63.953h-63.954c-2.474,0-4.615,0.905-6.423,2.712    c-1.809,1.809-2.712,3.949-2.712,6.424v18.271c0,2.475,0.903,4.617,2.712,6.424c1.809,1.809,3.946,2.713,6.423,2.713h63.954    v63.954c0,2.478,0.905,4.616,2.712,6.427c1.809,1.804,3.949,2.707,6.423,2.707h18.272c2.473,0,4.615-0.903,6.423-2.707    c1.807-1.811,2.712-3.949,2.712-6.427v-63.954h63.954c2.478,0,4.612-0.905,6.427-2.713c1.804-1.807,2.703-3.949,2.703-6.424    v-18.271c0-2.475-0.899-4.615-2.703-6.424C287.851,183.633,285.709,182.728,283.232,182.728z"
            style="fill: rgb(0, 0, 0);"></path>
        </g>
        <rect
          width={30}
          height={30}
          rx="3" ry="3"
          fill={"rgb(255,255,255)"}
          filter="url(#dropshadow)"
          x={this.state.width - 40}
          y={this.treePlotHeight(this.state.width) - 120} />
          <g transform={`translate(${this.state.width - 35},${this.treePlotHeight(this.state.width) - 115}), scale(.04)`}>
            <path d="M506.199,242.968l-73.09-73.089c-3.614-3.617-7.898-5.424-12.848-5.424c-4.948,0-9.229,1.807-12.847,5.424   c-3.613,3.619-5.424,7.902-5.424,12.85v36.547H292.355V109.641h36.549c4.948,0,9.232-1.809,12.847-5.424   c3.614-3.617,5.421-7.896,5.421-12.847c0-4.952-1.807-9.235-5.421-12.851L268.66,5.429c-3.613-3.616-7.895-5.424-12.847-5.424   c-4.952,0-9.232,1.809-12.85,5.424l-73.088,73.09c-3.618,3.619-5.424,7.902-5.424,12.851c0,4.946,1.807,9.229,5.424,12.847   c3.619,3.615,7.898,5.424,12.85,5.424h36.545v109.636H109.636v-36.547c0-4.952-1.809-9.234-5.426-12.85   c-3.619-3.617-7.902-5.424-12.85-5.424c-4.947,0-9.23,1.807-12.847,5.424L5.424,242.968C1.809,246.585,0,250.866,0,255.815   s1.809,9.233,5.424,12.847l73.089,73.087c3.617,3.613,7.897,5.431,12.847,5.431c4.952,0,9.234-1.817,12.85-5.431   c3.617-3.61,5.426-7.898,5.426-12.847v-36.549H219.27v109.636h-36.542c-4.952,0-9.235,1.811-12.851,5.424   c-3.617,3.617-5.424,7.898-5.424,12.847s1.807,9.233,5.424,12.854l73.089,73.084c3.621,3.614,7.902,5.424,12.851,5.424   c4.948,0,9.236-1.81,12.847-5.424l73.087-73.084c3.621-3.62,5.428-7.905,5.428-12.854s-1.807-9.229-5.428-12.847   c-3.614-3.613-7.898-5.424-12.847-5.424h-36.542V292.356h109.633v36.553c0,4.948,1.807,9.232,5.42,12.847   c3.621,3.613,7.905,5.428,12.854,5.428c4.944,0,9.226-1.814,12.847-5.428l73.087-73.091c3.617-3.617,5.424-7.901,5.424-12.85   S509.82,246.585,506.199,242.968z"
              style="fill: rgb(0, 0, 0);"></path>
          </g>
        </svg>
      </Card>
    );
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
