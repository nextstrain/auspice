import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { ReactSVGPanZoom } from "react-svg-pan-zoom";
import Card from "../framework/card";
import Legend from "./legend/legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import PhyloTree from "./phyloTree/phyloTree";
import { mediumTransitionDuration } from "../../util/globals";
import HoverInfoPanel from "./infoPanels/hover";
import TipClickedPanel from "./infoPanels/click";
import computeResponsive from "../../util/computeResponsive";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface";
import * as callbacks from "./reactD3Interface/callbacks";
import { calcStrokeCols } from "./treeHelpers";

/*
this.props.tree contains the nodes etc used to build the PhyloTree
object "tree". Those nodes are in a 1-1 ordering, and
there are actually backlinks from the phylotree tree
(i.e. tree.nodes[i].n links to props.tree.nodes[i])
*/

@connect((state) => {
  return {
    tree: state.tree,
    quickdraw: state.controls.quickdraw,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy,
    colorByConfidence: state.controls.colorByConfidence,
    layout: state.controls.layout,
    temporalConfidence: state.controls.temporalConfidence,
    showBranchLabels: state.controls.showBranchLabels,
    distanceMeasure: state.controls.distanceMeasure,
    mutType: state.controls.mutType,
    colorScale: state.controls.colorScale,
    metadata: state.metadata,
    panelLayout: state.controls.panelLayout
  };
})
class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.Viewer = null;
    this.state = {
      tool: "pan", // one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
      hover: null,
      selectedBranch: null,
      selectedTip: null,
      tree: null
    };
    /* bind callbacks */
    this.clearSelectedTip = callbacks.clearSelectedTip.bind(this);
    this.resetView = callbacks.resetView.bind(this);
    this.onViewerChange = callbacks.onViewerChange.bind(this);
    this.handleIconClickHOF = callbacks.handleIconClickHOF.bind(this);
  }
  static propTypes = {
    mutType: PropTypes.string.isRequired
  }


  /* CWRP has two tasks: (1) create the tree when it's in redux
  (2) compare props and call phylotree.change() appropritately */
  componentWillReceiveProps(nextProps) {
    let tree = this.state.tree;
    if (!nextProps.tree.loaded) {
      this.setState({tree: null});
    } else if (tree === null && nextProps.tree.loaded) {
      tree = this.makeTree(nextProps);
      this.setState({tree});
      if (this.Viewer) {
        this.Viewer.fitToViewer();
      }
    } else if (tree) {
      changePhyloTreeViaPropsComparison(this, nextProps);
    }
  }

  componentDidMount() {
    const tree = this.makeTree(this.props);
    this.setState({tree});
    if (this.Viewer) {
      this.Viewer.fitToViewer();
    }
  }

  componentDidUpdate(prevProps) {
    /* if the  SVG has changed size, call zoomIntoClade so that the tree rescales to fit the SVG */
    if (
      // the tree exists AND
      this.state.tree &&
      // either the browser dimensions have changed
      (
        prevProps.browserDimensions.width !== this.props.browserDimensions.width ||
        prevProps.browserDimensions.height !== this.props.browserDimensions.height ||
        // or the sidebar(s) have (dis)appeared
        this.props.padding.left !== prevProps.padding.left ||
        this.props.padding.right !== prevProps.padding.right ||
        prevProps.panelLayout !== this.props.panelLayout /* full vs grid */
      )

    ) {
      const baseNodeInView = this.state.selectedBranch ? this.state.selectedBranch.n.arrayIdx : 0;
      this.state.tree.zoomIntoClade(this.state.tree.nodes[baseNodeInView], mediumTransitionDuration);
    }
  }

  makeTree(nextProps) {
    const nodes = nextProps.tree.nodes;
    if (nodes && this.d3ref) {
      const myTree = new PhyloTree(nodes);
      // https://facebook.github.io/react/docs/refs-and-the-dom.html
      myTree.render(
        select(this.d3ref),
        this.props.layout,
        this.props.distanceMeasure,
        { /* options */
          grid: true,
          confidence: nextProps.temporalConfidence.display,
          branchLabels: true,
          showBranchLabels: false,
          tipLabels: true,
          showTipLabels: true
        },
        { /* callbacks */
          onTipHover: callbacks.onTipHover.bind(this),
          onTipClick: callbacks.onTipClick.bind(this),
          onBranchHover: callbacks.onBranchHover.bind(this),
          onBranchClick: callbacks.onBranchClick.bind(this),
          onBranchLeave: callbacks.onBranchLeave.bind(this),
          onTipLeave: callbacks.onTipLeave.bind(this),
          branchLabel: callbacks.branchLabel,
          branchLabelSize: callbacks.branchLabelSize,
          tipLabel: (d) => d.n.strain,
          tipLabelSize: callbacks.tipLabelSize.bind(this)
        },
        nextProps.tree.branchThickness, /* guarenteed to be in redux by now */
        nextProps.tree.visibility,
        nextProps.temporalConfidence.on, /* drawConfidence? */
        nextProps.tree.vaccines,
        calcStrokeCols(nextProps.tree, nextProps.colorByConfidence, nextProps.colorBy),
        nextProps.tree.nodeColors.map((col) => rgb(col).brighter([0.65]).toString())
      );
      return myTree;
    }
    return null;
  }

  render() {
    const grid = this.props.panelLayout === "grid"; /* add a check here for min browser width tbd */
    const responsive = computeResponsive({
      horizontal: grid ? 0.5 : 1,
      vertical: grid ? 0.7 : 0.88,
      browserDimensions: this.props.browserDimensions,
      padding: this.props.padding
    });
    const cardTitle = "Phylogeny";

    return (
      <Card center title={cardTitle}>
        <Legend padding={this.props.padding}/>
        <HoverInfoPanel
          tree={this.state.tree}
          mutType={this.props.mutType}
          temporalConfidence={this.props.temporalConfidence.display}
          distanceMeasure={this.props.distanceMeasure}
          hovered={this.state.hovered}
          viewer={this.Viewer}
          colorBy={this.props.colorBy}
          colorByConfidence={this.props.colorByConfidence}
          colorScale={this.props.colorScale}
        />
        <TipClickedPanel
          goAwayCallback={this.clearSelectedTip}
          tip={this.state.selectedTip}
          metadata={this.props.metadata}
        />
        <ReactSVGPanZoom
          width={responsive ? responsive.width : 1}
          height={responsive ? responsive.height : 1}
          ref={(Viewer) => {
            // https://facebook.github.io/react/docs/refs-and-the-dom.html
            this.Viewer = Viewer;
          }}
          style={{cursor: "default"}}
          tool={'pan'}
          detectWheel={false}
          toolbarPosition={"none"}
          detectAutoPan={false}
          background={"#FFF"}
          miniaturePosition={"none"}
          onDoubleClick={this.resetView}
          onChangeValue={this.onViewerChange}
        >
          <svg style={{pointerEvents: "auto"}}
            width={responsive.width}
            height={responsive.height}
          >
            <g
              width={responsive.width}
              height={responsive.height}
              id={"d3TreeElement"}
              style={{cursor: "default"}}
              ref={(c) => {this.d3ref = c;}}
            />
          </svg>
        </ReactSVGPanZoom>
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
            handleClick={this.handleIconClickHOF("zoom-in")}
            active
            x={10}
            y={50}
          />
          <ZoomOutIcon
            handleClick={this.handleIconClickHOF("zoom-out")}
            active
            x={10}
            y={90}
          />
        </svg>
      </Card>
    );
  }
}

export default Tree;
