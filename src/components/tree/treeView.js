import React from "react";
import d3 from "d3";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import Legend from "../controls/legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import MoveIcon from "../framework/move-icon";
import PhyloTree from "../../util/phyloTree";
import {ReactSVGPanZoom, fitToViewer} from "react-svg-pan-zoom";
import ReactDOM from "react-dom";
import {Viewer, ViewerHelper} from 'react-svg-pan-zoom';
import {fastTransitionDuration, mediumTransitionDuration, slowTransitionDuration} from "../../util/globals";
import * as globalStyles from "../../globalStyles";
import InfoPanel from "./infoPanel";
import { connect } from "react-redux";
import computeResponsive from "../../util/computeResponsive";

const arrayInEquality = function(a,b) {
  if (a&&b){
    const eq = a.map((d,i)=>d!==b[i]);
    return eq.some((d)=>d);
  }else{
    return true;
  }
};

/*
 * TreeView creates a (now responsive!) SVG & scales according to layout
 * such that branches and tips are correctly placed.
 * also handles zooming
*/
@connect((state) => {
  return {
    tree: state.tree.tree,
    metadata: state.metadata.metadata,
    browserDimensions: state.browserDimensions.browserDimensions,
    layout: state.controls.layout,
    distanceMeasure: state.controls.distanceMeasure
  };
})
class TreeView extends React.Component {
  constructor(props) {
    super(props);

    this.Viewer = null;

    this.state = {
      okToDraw: false,
      tool: "pan",  //one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
      clicked: null,
      hover: null
    };
  }
  componentWillMount() {
    if (this.state.currentDatasetGuid !== this.props.datasetGuid) {
      this.setState({
        okToDraw: true,
        currentDatasetGuid: this.props.datasetGuid,
        width: globals.width,
      });
    }
  }
  componentWillReceiveProps(nextProps) {

    /*
      previously in componentDidMount, but we don't mount immediately anymore -
      need to wait for browserDimensions
    */
    const good_tree = (this.state.tree && (nextProps.datasetGuid === this.props.datasetGuid));
    if (this.Viewer && !good_tree) {
      this.Viewer.fitToViewer();
      const tree = (this.state.tree)
        ? this.state.tree
        : this.makeTree(this.props.nodes, this.props.layout, this.props.distance);
      this.setState({tree: tree});
    }

    /* Do we have a tree to draw? if yes, check whether it needs to be redrawn */
    const tree = good_tree
      ? this.state.tree
      : this.makeTree(nextProps.nodes, this.props.layout, this.props.distance);

    /* if we don't have a dataset or nodes, don't draw */
    if (!(nextProps.datasetGuid && nextProps.nodes)) {
      this.setState({okToDraw: false});
    } else if (
      /* if the dataset, layout or distance measure has changed, do book keeping & redraw */
      (nextProps.datasetGuid !== this.props.datasetGuid) ||
      (nextProps.layout !== this.props.layout) ||
      (nextProps.distanceMeasure !== this.props.distanceMeasure)
    ) {
      this.setState({
        okToDraw: true,
        currentDatasetGuid: nextProps.datasetGuid,
        width: globals.width,
        tree: tree
      });
    }

    /* if we have a tree and we have new props, figure out what we need to update */
    if (tree) {

      /* update tips */
      let attrToUpdate = {};
      let styleToUpdate = {};

      /* tip color has changed */
      if (nextProps.nodeColor && arrayInEquality(nextProps.nodeColor, this.props.nodeColor)) {
        styleToUpdate['fill'] = nextProps.nodeColor.map((col) => {
          return d3.rgb(col).brighter([0.65]).toString();
        });
        styleToUpdate['stroke'] = nextProps.nodeColor;
      }
      /* tip radius has changed */
      if (nextProps.tipRadii && arrayInEquality(nextProps.tipRadii, this.props.tipRadii)) {
        attrToUpdate['r'] = nextProps.tipRadii;
      }
      /* tip visibility has changed, for instance because of date slider */
      if (nextProps.tipVisibility && arrayInEquality(nextProps.tipVisibility, this.props.tipVisibility)) {
        // console.log("updateVisibility");
        styleToUpdate['visibility'] = nextProps.tipVisibility;
      }
      /* implement style changes */
      if (Object.keys(attrToUpdate).length || Object.keys(styleToUpdate).length) {
        tree.updateMultipleArray(".tip", attrToUpdate, styleToUpdate, fastTransitionDuration);
      }

      /* update branches */
      attrToUpdate = {};
      styleToUpdate = {};

      /* branch color has changed */
      if (nextProps.nodeColor && arrayInEquality(nextProps.nodeColor, this.props.nodeColor)) {
        styleToUpdate['stroke'] = nextProps.nodeColor.map((col) => {
          var modCol = d3.interpolateRgb(col, "#BBB")(0.6);
        	return d3.rgb(modCol).toString();
        });
      }
      /* branch stroke width has changed */
      if (nextProps.branchThickness && arrayInEquality(nextProps.branchThickness, this.props.branchThickness)) {
        styleToUpdate['stroke-width'] = nextProps.branchThickness;
      }
      /* implement style changes */
      if (Object.keys(attrToUpdate).length || Object.keys(styleToUpdate).length) {
        tree.updateMultipleArray(".branch", attrToUpdate, styleToUpdate, fastTransitionDuration);
      }

      /* swap layouts */
      if (this.props.layout !== nextProps.layout) {
        tree.updateLayout(nextProps.layout, mediumTransitionDuration);
      }
      /* change distance metrics */
      if (this.props.distanceMeasure !== nextProps.distanceMeasure) {
        tree.updateDistance(nextProps.distanceMeasure, mediumTransitionDuration);
      }
    }
  }
  componentWillUpdate(nextProps, nextState) {
    /* reconcile hover and click selections in tree */
    if (
      this.state.tree &&
      (this.state.hovered || this.state.clicked) &&
      this.props.layout === nextProps.layout // this block interferes with layout transition otherwise
    ) {
      /* check whether or not the previously selected item was clicked */
      if (this.state.clicked && nextState.clicked) { // was the previous item a click?
        this.state.tree.updateSelectedBranchOrTip(
          this.state.clicked, /* turn this one off */
          nextState.clicked, /* turn this one on */
        );
      } else if (this.state.hovered && nextState.clicked) { // previously a hover, now a click
        this.state.tree.updateSelectedBranchOrTip(
          this.state.hovered,
          nextState.clicked,
        );
      } else if (this.state.hovered && nextState.hovered) { // deselect the previously selected hover
        this.state.tree.updateSelectedBranchOrTip(
          this.state.hovered,
          nextState.hovered,
        );
      }
      else if (this.state.clicked && nextState.clicked === null) {
        // x clicked or clicked off will give a null value, so reset everything to be safe
        this.state.tree.updateSelectedBranchOrTip(
          this.state.clicked,
          null
        )
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.tree && /* tree exists */
      prevProps.browserDimensions && /* it's not the first render, the listener is registered and width/height passed in */
      this.props.browserDimensions &&
      (prevProps.browserDimensions.width !== this.props.browserDimensions.width || /* the browser dimensions have changed */
      prevProps.browserDimensions.height !== this.props.browserDimensions.height)
    ) {
      this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
    }
  }

  makeTree(nodes) {
    if (nodes && this.refs.d3TreeElement) {
      var myTree = new PhyloTree(nodes[0]);
      // https://facebook.github.io/react/docs/refs-and-the-dom.html
      var treeplot = d3.select(this.refs.d3TreeElement);
      myTree.render(
        treeplot,
        this.props.layout,
        this.props.distanceMeasure,
        {
          /* options */
          grid: true,
          confidence: false
        },
        {
          /* callbacks */
          onTipHover: this.onTipHover.bind(this),
          onTipClick: this.onTipClick.bind(this),
          onBranchHover: this.onBranchHover.bind(this),
          onBranchClick: this.onBranchClick.bind(this),
          onBranchOrTipLeave: this.onBranchOrTipLeave.bind(this)
        },
        {
          /* presently selected node / branch */
          hovered: this.state.hovered,
          clicked: this.state.clicked
        }
      );
      return myTree;
    } else {
      return null;
    }
  }

  onTipHover(d) {
    if (!this.state.clicked) {
      this.setState({
        hovered: {
          d,
          type: ".tip"
        }
      });
    }
  }
  onTipClick(d) {
    // if it's the same, deselect
    this.setState({
      clicked: {
        d,
        type: ".tip"
      },
      hovered: null
    });
  }
  onBranchHover(d) {
    if (!this.state.clicked) {
      this.setState({
        hovered: {
          d,
          type: ".branch"
        }
      });
    }
  }
  onBranchClick(d) {
    // console.log('clicked', d)
    // if it's the same, deselect
    this.setState({
      clicked: {
        d,
        type: ".branch"
      },
      hovered: null
    });
  }
  // mouse out from tip/branch
  onBranchOrTipLeave(){
    if (this.state.hovered) {
      this.setState({hovered: null})
    }
  }

  handleIconClick(tool) {
    return () => {

      if (tool === "zoom-in") {
        this.Viewer.zoomOnViewerCenter(1.4);
        // console.log('zooming in', this.state.zoom, zoom)
      } else {
        this.Viewer.zoomOnViewerCenter(0.71);
      }

      // const viewerX = this.state.width / 2;
      // const viewerY = this.treePlotHeight(this.state.width) / 2;
      // const nextValue = ViewerHelper.zoom(this.state.value, zoom, viewerX, viewerY);

      // this.setState({value: nextValue});
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
    // console.log(value)
  }

  handleClick(event){
    // console.log('event', event)
    // console.log('click', event.x, event.y, event.originalEvent);
  }

  infoPanelDismiss() {
    this.setState({clicked: null, hovered: null});
    this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
  }

  createTreeMarkup() {
    const responsive = computeResponsive({
      horizontal: this.props.browserDimensions && this.props.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
      vertical: 1,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      minHeight: 400,
      maxAspectRatio: 1.3
    })

    return (
      <Card center title="Phylogeny">
        <Legend
          colorScale={this.props.colorScale}
          sidebar={this.props.sidebar}/>
        <InfoPanel
          dismiss={this.infoPanelDismiss.bind(this)}
          zoom={this.state.tree ? this.state.tree.zoomIntoClade.bind(this.state.tree) : null}
          hovered={this.state.hovered}
          clicked={this.state.clicked}/>
        <ReactSVGPanZoom
          width={responsive ? responsive.width : 1}
          height={responsive ? responsive.height : 1}
          ref={(Viewer) => {
            // https://facebook.github.io/react/docs/refs-and-the-dom.html
            this.Viewer = Viewer
          }}
          style={{cursor: "default"}}
          tool={this.state.tool}
          detectWheel={false}
          toolbarPosition={"none"}
          detectAutoPan={false}
          background={"#FFF"}
          onChangeValue={this.handleChange.bind(this)}
          onClick={this.handleClick.bind(this)}>
          <svg style={{pointerEvents: "auto"}}
            width={responsive.width}
            height={responsive.height}
            >
            <g
              width={responsive.width}
              height={responsive.height}
              style={{cursor: "default"}}
              ref="d3TreeElement">
            </g>
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
    )
  }
  render() {
    /*
      1. set up SVGs
      2. tree will be added on props loading
    */
    return (
      <span>
        {this.props.browserDimensions ? this.createTreeMarkup() : null}
      </span>
    );
  }
}


export default TreeView;
