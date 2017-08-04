import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { select } from "d3-selection";
import { ReactSVGPanZoom } from "react-svg-pan-zoom";
import Card from "../framework/card";
import Legend from "./legend";
import ZoomOutIcon from "../framework/zoom-out-icon";
import ZoomInIcon from "../framework/zoom-in-icon";
import PhyloTree from "./phyloTree";
import { mediumTransitionDuration, twoColumnBreakpoint } from "../../util/globals";
import InfoPanel from "./infoPanel";
import BranchSelectedPanel from "./branchSelectedPanel";
import TipSelectedPanel from "./tipSelectedPanel";
import computeResponsive from "../../util/computeResponsive";
import * as funcs from "./treeViewFunctions";

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
    // map: state.map,
    splitTreeAndMap: state.controls.splitTreeAndMap,
    colorBy: state.controls.colorBy,
    colorByConfidence: state.controls.colorByConfidence,
    layout: state.controls.layout,
    temporalConfidence: state.controls.temporalConfidence,
    showBranchLabels: state.controls.showBranchLabels,
    distanceMeasure: state.controls.distanceMeasure,
    mutType: state.controls.mutType,
    sequences: state.sequences,
    colorScale: state.controls.colorScale,
    metadata: state.metadata,
    panelLayout: state.controls.panelLayout
  };
})
class TreeView extends React.Component {
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
  }
  static propTypes = {
    sidebar: PropTypes.bool.isRequired,
    mutType: PropTypes.string.isRequired
  }

  componentWillReceiveProps(nextProps) {
    /* This both creates the tree (when it's loaded into redux) and
    works out what to update, based upon changes to redux.control */
    let tree = this.state.tree;
    const changes = funcs.salientPropChanges(this.props, nextProps, tree);
    /* usefull for debugging: */
    // console.log("CWRP Changes:",
    //    Object.keys(changes).filter((k) => !!changes[k]).reduce((o, k) => {
    //      o[k] = changes[k]; return o;
    //    }, {}));

    if (changes.dataInFlux) {
      this.setState({tree: null});
      return null;
    } else if (changes.newData) {
      tree = this.makeTree(nextProps);
      /* extra (initial, once only) call to update the tree colouring */
      for (const k in changes) {
        changes[k] = false;
      }
      changes.colorBy = true;
      funcs.updateStylesAndAttrs(changes, nextProps, tree);
      this.setState({tree});
      if (this.Viewer) {
        this.Viewer.fitToViewer();
      }
      return null; /* return to avoid an unnecessary updateStylesAndAttrs call */
    }
    if (tree) {
      funcs.updateStylesAndAttrs(changes, nextProps, tree);
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    /* if the  SVG has changed size, call zoomIntoClade so that the tree rescales to fit the SVG */
    if (
      // the tree exists AND
      this.state.tree &&
      // either the browser dimensions have changed
      (prevProps.browserDimensions.width !== this.props.browserDimensions.width ||
      prevProps.browserDimensions.height !== this.props.browserDimensions.height ||
      // or the sidebar's (dis)appeared
      this.props.sidebar !== prevProps.sidebar)
    ) {
      const baseNodeInView = this.state.selectedBranch ? this.state.selectedBranch.n.arrayIdx : 0;
      this.state.tree.zoomIntoClade(this.state.tree.nodes[baseNodeInView], mediumTransitionDuration);
    }
  }

  makeTree(nextProps) {
    const nodes = nextProps.tree.nodes;
    if (nodes && this.refs.d3TreeElement) {
      const myTree = new PhyloTree(nodes[0]);
      // https://facebook.github.io/react/docs/refs-and-the-dom.html
      myTree.render(
        select(this.refs.d3TreeElement),
        this.props.layout,
        this.props.distanceMeasure,
        { /* options */
          grid: true,
          confidence: nextProps.temporalConfidence.display,
          branchLabels: true,      //generate DOM object
          showBranchLabels: false,  //hide them initially -> couple to redux state
          tipLabels: true,      //generate DOM object
          showTipLabels: true   //show
        },
        { /* callbacks */
          onTipHover: funcs.onTipHover.bind(this),
          onTipClick: funcs.onTipClick.bind(this),
          onBranchHover: funcs.onBranchHover.bind(this),
          onBranchClick: funcs.onBranchClick.bind(this),
          onBranchLeave: funcs.onBranchLeave.bind(this),
          onTipLeave: funcs.onTipLeave.bind(this),
          branchLabel: funcs.branchLabel,
          branchLabelSize: funcs.branchLabelSize,
          tipLabel: (d) => d.n.strain,
          tipLabelSize: funcs.tipLabelSize.bind(this)
        },
        nextProps.tree.branchThickness, /* guarenteed to be in redux by now */
        nextProps.tree.visibility,
        nextProps.temporalConfidence.on /* drawConfidence? */
      );
      return myTree;
    } else {
      return null;
    }
  }

  render() {
    const widescreen = this.props.browserDimensions && this.props.browserDimensions.width > twoColumnBreakpoint && this.props.splitTreeAndMap;
    const thirds = this.props.panelLayout === "thirds"; /* add a check here for min browser width tbd */

    const responsive = computeResponsive({
      horizontal: widescreen || thirds ? .5 : 1,
      vertical: this.props.panelLayout === "thirds" ? 0.85 : 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      maxAspectRatio: 1.2
    });
    const cardTitle = this.state.selectedBranch ? "." : "Phylogeny";

    return (
      <Card center title={cardTitle}>
        <Legend sidebar={this.props.sidebar}/>
        <InfoPanel
          tree={this.state.tree}
          mutType={this.props.mutType}
          temporalConfidence={this.props.temporalConfidence.display}
          distanceMeasure={this.props.distanceMeasure}
          hovered={this.state.hovered}
          viewer={this.Viewer}
          colorBy={this.props.colorBy}
          colorByConfidence={this.props.colorByConfidence}
          colorScale={this.props.colorScale}
          sequences={this.props.sequences}
        />
        <BranchSelectedPanel
          responsive={responsive}
          viewEntireTreeCallback={() => funcs.viewEntireTree.bind(this)()}
          branch={this.state.selectedBranch}
        />
        <TipSelectedPanel
          goAwayCallback={(d) => funcs.clearSelectedTip.bind(this)(d)}
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
          // onMouseDown={this.startPan.bind(this)}
          onDoubleClick={funcs.resetView.bind(this)}
          //onMouseUp={this.endPan.bind(this)}
          onChangeValue={ funcs.onViewerChange.bind(this) }
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
              ref="d3TreeElement"
            >
            </g>
          </svg>
        </ReactSVGPanZoom>
        <svg width={50} height={130}
          style={{position: "absolute", right: 20, bottom: 20}}
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
          <ZoomInIcon
            handleClick={funcs.handleIconClick.bind(this)("zoom-in")}
            active
            x={10}
            y={50}
          />
          <ZoomOutIcon
            handleClick={funcs.handleIconClick.bind(this)("zoom-out")}
            active
            x={10}
            y={90}
          />
        </svg>
      </Card>
    );
  }
}

export default TreeView;
