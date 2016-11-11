import React from "react";
import Radium from "radium";
import d3 from "d3";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import Legend from "../controls/legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import MoveIcon from "../framework/move-icon";
import PhyloTree from "../../util/phyloTree";
import {ReactSVGPanZoom, fitToViewer} from "react-svg-pan-zoom";
import ReactDOM from "react-dom"
import {Viewer, ViewerHelper} from 'react-svg-pan-zoom';
import {fastTransitionDuration, mediumTransitionDuration, slowTransitionDuration} from "../../util/globals";

const arrayInEquality = function(a,b){
  if (a&&b){
    const eq = a.map((d,i)=>d!==b[i]);
    return eq.some((d)=>d);
  }else{
    return true;
  }
};

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
    // https://facebook.github.io/react/docs/refs-and-the-dom.html
    var treeplot = d3.select(this.Viewer.ViewerDOM);
    myTree.render(treeplot, this.props.layout, this.props.distanceMeasure, {grid:true});
    return myTree;
  } else {
    return null;
  }
}

  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.datasetGuid) {
      // console.log("componentWillMount, width:", globals.width);
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.datasetGuid,
        width: globals.width,
      });
    }
  }

  componentDidMount(){
    // console.log("TreeView.componentDidMount");

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
    const tree = ((nextProps.datasetGuid === this.props.datasetGuid) && this.state.tree)
                  ? this.state.tree
                  : this.makeTree(nextProps.nodes, this.props.layout, this.props.distance);
    if (!(nextProps.datasetGuid && nextProps.nodes)){
      this.setState({okToDraw: false});
    } else if ((nextProps.datasetGuid !== this.props.datasetGuid)
               || (nextProps.layout !== this.props.layout)
               || (nextProps.distanceMeasure !== this.props.distanceMeasure)) {
      // console.log("setting ok to draw");
      this.setState({
        okToDraw: true,
        currentDatasetGuid: nextProps.datasetGuid,
        width: globals.width,
        tree: tree
      });
    }
    if (tree){
      const attrToUpdate ={};
      const styleToUpdate ={};
      if (nextProps.nodeColor &&
          arrayInEquality(nextProps.nodeColor,
                         this.props.nodeColor)){
        // console.log("updateColor", this.props.layout, nextProps.layout);
        styleToUpdate['fill'] = nextProps.nodeColor;
        tree.updateStyleArray(".branch", "stroke", nextProps.nodeColor, fastTransitionDuration);
        styleToUpdate['stroke'] = nextProps.nodeColor.map(d=>d3.rgb(d).darker(0.7));
      }
      if (nextProps.tipRadii &&
          arrayInEquality(nextProps.tipRadii,
                         this.props.tipRadii)) {
        // console.log("updateRadii", this.props.layout, nextProps.layout);
        attrToUpdate['r'] = nextProps.tipRadii;
      }
      if (nextProps.tipVisibility &&
          arrayInEquality(nextProps.tipVisibility,
                         this.props.tipVisibility)) {
        // console.log("updateVisibility");
        styleToUpdate['visibility'] = nextProps.tipVisibility;
      }
      if (Object.keys(attrToUpdate).length || Object.keys(styleToUpdate).length){
        tree.updateMultipleArray(".tip", attrToUpdate, styleToUpdate, fastTransitionDuration);
      }

      if (this.props.layout!==nextProps.layout){
        // console.log("reset layout", this.props.layout, nextProps.layout);
        tree.updateLayout(nextProps.layout, slowTransitionDuration);
      }
      if (this.props.distanceMeasure!==nextProps.distanceMeasure){
        // console.log("reset distance", this.props.distanceMeasure, nextProps.distanceMeasure);
        tree.updateDistance(nextProps.distanceMeasure, slowTransitionDuration);
      }
    }
  }


  treePlotHeight(width) {
    return 400 + 0.30 * width;
  }

  handleIconClick(tool) {
    return () => {

      console.log(tool)

      let zoom;
      if (tool === "zoom-in") {
        zoom = this.state.zoom + .1;
        // console.log('zooming in', this.state.zoom, zoom)
      } else {
        zoom = this.state.zoom - .1;
        // console.log('zooming out', this.state.zoom, zoom)
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
    // console.log('event', event)
    // console.log('click', event.x, event.y, event.originalEvent);
  }

  render() {
    /*
      1. set up SVGs
      2. tree will be added on props loading
    */
    return (
      <div>
        <Card center title="Phylogeny">
          <p style={{position: "absolute", right: 50, bottom: 150, color: "red", fontWeight: 700 }}> {this.state.scaleFactor} </p>
          <ReactSVGPanZoom
            width={globals.width}
            height={this.treePlotHeight(globals.width)}
            ref={(Viewer) => {
              // https://facebook.github.io/react/docs/refs-and-the-dom.html
              this.Viewer = Viewer
            }}
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
          <svg width={300} height={300}
               style={{position: "absolute", left: 13,
                       top: 50}}>
            <Legend colorScale={this.props.colorScale}/>
          </svg>
        </Card>
      </div>
    );
  }
}


export default TreeView;
