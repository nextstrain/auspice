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

  makeTree() {
      console.log("MakeTree1",d3.select("#treeplot"));
      var treeplot = d3.select("#treeplot");
      var tip_labels = true, branch_labels=false;

      var mutType='aa'; //mutations displayed in tooltip
      console.log("MakeTree2");
      treeplot.left_margin = 10;
      treeplot.bottom_margin = 16;
      treeplot.top_margin = 32;
      if (branch_labels) {treeplot.top_margin +=15;}
      treeplot.right_margin = 10;
      console.log(treeplot);
      console.log("MakeTree3", this.props.nodes[0]);
      var myTree = PhyloTree(this.props.nodes[0], treeplot, d3.select('.treeplot-container'));
      console.log("MakeTree4");
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
    if (this.props.nodes) {
      var nodes = this.props.nodes;
      var myTree = new PhyloTree2(nodes[0]);

      console.log(myTree.nodes);
      var delay = function(myTree){
          var treeplot = d3.select("#treeplot");
          var tmp_tree = myTree;
          treeplot.on("click", function(d){tmp_tree.updateDistance(tmp_tree.distance==="div"?"num_date":"div", 1000);});
          //treeplot.on("click", function(d){tmp_tree.updateLayout(tmp_tree.layout==="radial"?"rectangular":"radial", 1000);});
          return function() {
            console.log("calling render", tmp_tree, myTree)
            tmp_tree.render(treeplot, "rectangular", "div");
          };
      };
      setTimeout(delay(myTree), 3000);
    }
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
