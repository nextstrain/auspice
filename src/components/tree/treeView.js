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
class TreeView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      okToDraw: false,
      value: ViewerHelper.getDefaultValue(),
      zoom: 1,
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
    /* two svgs! one scales, one doesn't :) */
    // <svg
    //   style={{backgroundColor: "#FFFFFF"}}
    //   width={this.state.width}
    //   height={this.treePlotHeight(this.state.width)}
    //
    //   >

    //
    return (
      <Card title="Phylogeny">
          <p style={{position: "absolute", right: 50, bottom: 150, color: "red", fontWeight: 700 }}> {this.state.scaleFactor} </p>
          <svg width={300} height={300}
            style={{
              position: "absolute", left: 13, top: 50, pointerEvents: "none",
              transform: "translate3d(0, 0, 0)" // force GPU compositing
          }}>
            <Legend colorScale={this.props.colorScale}/>
          </svg>
          <Viewer
            width={this.state.width}
            height={this.treePlotHeight(this.state.width)}
            value={this.state.value}
            tool={this.state.tool}
            detectPinch={false}
            detectAutoPan={false}
            background="#FFF"
            onChange={this.handleChange.bind(this)}
            onClick={this.handleClick.bind(this)}>
            <svg style={{pointerEvents: "auto"}} width={this.state.width} height={this.treePlotHeight(this.state.width)} id="treeplot">
              <Grid
                layout={this.props.layout}
                distanceMeasure={this.props.distanceMeasure}
                xScale={this.state.xScale}
                yScale={this.state.yScale}
                nodes={this.props.nodes}
              />
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
            </svg>
          </Viewer>
          <svg width={50} height={130} style={{position: "absolute", right: 20, bottom: 20}}>
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
            <ZoomInIcon
              handleClick={this.handleIconClick("zoom-in")}
              active={true}
              x={10}
              y={50}
              />
            <ZoomOutIcon
              handleClick={this.handleIconClick("zoom-out")}
              active={true}
              x={10}
              y={90}
              />
          </svg>
      </Card>
    );
    // <MoveIcon
    //   handleClick={this.handleIconClick("pan")}
    //   active={this.state.tool === "pan"}
    //   x={10}
    //   y={10}
    //   />
  }

  handleIconClick(tool) {
    return () => {

      console.log(tool)

      let zoom;
      if (tool === "zoom-in") {
        zoom = this.state.zoom + .1;
        console.log('zooming in', this.state.zoom, zoom)
      } else {
        zoom = this.state.zoom - .1;
        console.log('zooming out', this.state.zoom, zoom)
      }
      let viewerX = this.state.width / 2;
      let viewerY = this.treePlotHeight(this.state.width) / 2;
      let nextValue = ViewerHelper.zoom(this.state.value, zoom, viewerX, viewerY);


      this.setState({value: nextValue})
    };
  }

  // handleZoomEvent(direction) {
  //   return () => {
  //     this.state.value.matrix
  //
  //     console.log(direction)
  //   }
  // }

  handleChange(event) {
    // console.log(event.scaleFactor)
    // console.log('scaleFactor', event.scaleFactor);
    // console.log(this.state, event.value, event)
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
