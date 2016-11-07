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
import PhyloTree from "../../util/phyloTree";
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

  makeTree(nodes){
    console.log("Did Mount", nodes, this.state);
    if (nodes) {
      var myTree = new PhyloTree(nodes[0]);
      var treeplot = d3.select("#treeplot");
      //treeplot.on("click", function(d){myTree.updateDistance(myTree.distance==="div"?"num_date":"div", 1000);});
      treeplot.on("click", function(d){myTree.updateLayout(myTree.layout==="rectangular"?"radial":"rectangular", 1000);});
      console.log("call render");
      myTree.render(treeplot, "rectangular", "div");
      return myTree;
    }else{
      return null;
    }
  }

  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.datasetGuid) {
      const scales = this.updateScales(this.props.nodes);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.datasetGuid,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    // Do we have a tree to draw? if yes, check whether it needs to be redrawn
    const dt=1000;
    const tree = ((nextProps.datasetGuid === this.props.datasetGuid) && this.state.tree)
                  ? this.state.tree
                  : this.makeTree(nextProps.nodes, this.layout, this.distance);
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
        yScale: scales.yScale,
        tree: tree
      });
    }
    if (tree){
      if (nextProps.nodeColor){
        console.log(nextProps.nodeColor);
        tree.updateStyleArray(".tip", "fill", nextProps.nodeColor, dt);
      }
      if (this.props.layout!==nextProps.layout){
        console.log("reset layout", this.props.layout, nextProps.layout);
        tree.updateLayout(nextProps.layout, dt);
      }
      if (this.props.distanceMeasure!==nextProps.distanceMeasure){
        console.log("reset distance", this.props.distanceMeasure, nextProps.distanceMeasure);
        tree.updateDistance(nextProps.distanceMeasure,dt);
      }
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
        <Card title="Phylogeny">
            <div class="treeplot-container">
              <svg width={800} height={500} id="treeplot">
              </svg>
            </div>
        </Card>
      </div>
    );
  }
}


export default TreeView;
