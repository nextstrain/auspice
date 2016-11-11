import React from "react";
import Radium from "radium";
import d3 from "d3";
import { processNodes } from "../../util/processNodes";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import Legend from "../controls/legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import MoveIcon from "../framework/move-icon";
import PhyloTree from "../../util/phyloTree";
import {ReactSVGPanZoom, fitToViewer} from "react-svg-pan-zoom";
import ReactDOM from "react-dom"

/*
 * TreeView creates and SVG and scales according to layout
 * such that branches and tips are correctly placed.
 * will handle zooming
*/
@Radium
class TreeView extends React.Component {
  constructor(props) {
    super(props);

    this.Viewer = null;

    this.state = {
      okToDraw: false,
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

makeTree(nodes) {
  // console.log("TreeView.makeTree");
  if (nodes) {
    var myTree = new PhyloTree(nodes[0]);
    var treeplot = d3.select(this.Viewer.ViewerDOM);
    console.info('Line 48 in treeView: d3 elem from react ref, look at this Richard', treeplot)
    myTree.render(treeplot, this.props.layout, this.props.distanceMeasure);
    return myTree;
  } else {
    return null;
  }
}

  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.datasetGuid) {
      const scales = this.updateScales(this.props.nodes);
      // console.log("componentWillMount, width:", globals.width);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.datasetGuid,
        width: globals.width,
        xScale: scales.xScale,
        yScale: scales.yScale
      });
    }
  }

  componentDidMount(){
    console.log("TreeView.componentDidMount");

    this.Viewer.fitToViewer();

    const tree = (this.state.tree)
                  ? this.state.tree
                  : this.makeTree(this.props.nodes, this.props.layout, this.props.distance);
      this.setState({
        tree: tree
      });
  }

  componentWillReceiveProps(nextProps) {
    // Do we have a tree to draw? if yes, check whether it needs to be redrawn
    const dt=1000;
    const tree = ((nextProps.datasetGuid === this.props.datasetGuid) && this.state.tree)
                  ? this.state.tree
                  : this.makeTree(nextProps.nodes, this.props.layout, this.props.distance);
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

  handleChange(value) {
    // console.log(event.scaleFactor)
    // console.log('scaleFactor', event.scaleFactor);
    // console.log(this.state, event.value, event)
    this.setState({value});
  }

  handleClick(event){
    console.log('event', event)
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
          <p style={{position: "absolute", right: 50, bottom: 150, color: "red", fontWeight: 700 }}> {this.state.scaleFactor} </p>
          <svg width={300} height={300}
               style={{position: "absolute", left: 13,
                       top: 50, pointerEvents: "none"}}>
            <Legend colorScale={this.props.colorScale}/>
          </svg>
          <ReactSVGPanZoom
            width={globals.width}
            height={this.treePlotHeight(globals.width)}
            ref={(Viewer) => {
              this.Viewer = Viewer
            }}
            style={{border: "1px solid green"}}
            value={this.state.value}
            tool={this.state.tool}
            detectWheel={false}
            toolbarPosition={"none"}
            detectAutoPan={false}
            background={"#FFF"}
            onChangeValue={this.handleChange.bind(this)}
            onClick={this.handleClick.bind(this)}>
            <svg style={{pointerEvents: "auto"}}
              width={globals.width}
              height={this.treePlotHeight(globals.width)}
              >
            </svg>
          </ReactSVGPanZoom>
          <svg width={50} height={130}
               style={{position: "absolute", right: 20, bottom: 20}}>
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
      </div>
    );
  }
}


export default TreeView;
