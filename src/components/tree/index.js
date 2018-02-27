import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { select } from "d3-selection";
import { rgb } from "d3-color";
import { ReactSVGPanZoom } from "react-svg-pan-zoom";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/treeProperties";
import Card from "../framework/card";
import Legend from "./legend/legend";
import PhyloTree from "./phyloTree/phyloTree";
import HoverInfoPanel from "./infoPanels/hover";
import TipClickedPanel from "./infoPanels/click";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface";
import * as callbacks from "./reactD3Interface/callbacks";
import { calcStrokeCols } from "./treeHelpers";
import { buttonBaseStyle } from "../map/map";
import { darkGrey, dataFont } from "../../globalStyles";

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
    colorBy: state.controls.colorBy,
    colorByConfidence: state.controls.colorByConfidence,
    layout: state.controls.layout,
    temporalConfidence: state.controls.temporalConfidence,
    distanceMeasure: state.controls.distanceMeasure,
    mutType: state.controls.mutType,
    colorScale: state.controls.colorScale,
    metadata: state.metadata,
    panelLayout: state.controls.panelLayout,
    selectedBranchLabel: state.controls.selectedBranchLabel
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
    this.redrawTree = () => {
      this.state.tree.clearSVG();
      this.Viewer.fitToViewer();
      this.renderTree(this.state.tree, this.props);
      this.setState({hover: null, selectedBranch: null, selectedTip: null});
      this.props.dispatch(updateVisibleTipsAndBranchThicknesses({idxOfInViewRootNode: 0}));
    };
  }
  static propTypes = {
    mutType: PropTypes.string.isRequired
  }
  componentDidMount() {
    if (this.props.tree.loaded) {
      const tree = new PhyloTree(this.props.tree.nodes);
      this.renderTree(tree, this.props);
      if (this.Viewer) {
        this.Viewer.fitToViewer();
      }
      this.setState({tree});
    }
  }
  /* CWRP has two tasks: (1) create the tree when it's in redux
  (2) compare props and call phylotree.change() appropritately */
  componentWillReceiveProps(nextProps) {
    let tree = this.state.tree;
    if (!nextProps.tree.loaded) {
      this.setState({tree: null});
    } else if (!tree && nextProps.tree.loaded) {
      tree = new PhyloTree(nextProps.tree.nodes);
      this.renderTree(tree, nextProps);
      this.setState({tree});
      if (this.Viewer) {
        this.Viewer.fitToViewer();
      }
    } else if (tree) {
      changePhyloTreeViaPropsComparison(this, nextProps);
    }
  }

  /* CDU is used to update phylotree when the SVG size _has_ changed (and this is why it's in CDU not CWRP) */
  componentDidUpdate(prevProps) {
    if ( // the tree exists AND the width has changed (browser resize, sidebar open/close...)
      this.state.tree &&
      (this.props.width !== prevProps.width || this.props.height !== prevProps.height)
    ) {
      this.state.tree.change({svgHasChangedDimensions: true});
    }
  }
  renderTree(tree, props) {
    /* simply the call to phylotree.render */
    tree.render(
      select(this.d3ref),
      props.layout,
      props.distanceMeasure,
      { /* parameters (modifies PhyloTree's defaults) */
        grid: true,
        confidence: props.temporalConfidence.display,
        branchLabelKey: props.selectedBranchLabel,
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
        tipLabel: (d) => d.n.strain,
        tipLabelSize: callbacks.tipLabelSize.bind(this)
      },
      props.tree.branchThickness, /* guarenteed to be in redux by now */
      props.tree.visibility,
      props.temporalConfidence.on, /* drawConfidence? */
      props.tree.vaccines,
      calcStrokeCols(props.tree, props.colorByConfidence, props.colorBy),
      props.tree.nodeColors.map((col) => rgb(col).brighter([0.65]).toString()),
      props.tree.tipRadii /* might be null */
    );
  }

  render() {
    return (
      <Card center title={"Phylogeny"}>
        <Legend width={this.props.width}/>
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
          width={this.props.width}
          height={this.props.height}
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
            width={this.props.width}
            height={this.props.height}
          >
            <g
              width={this.props.width}
              height={this.props.height}
              id={"d3TreeElement"}
              style={{cursor: "default"}}
              ref={(c) => {this.d3ref = c;}}
            />
          </svg>
        </ReactSVGPanZoom>
        <button
          style={{...buttonBaseStyle, right: 20, bottom: 30, backgroundColor: "rgb(230, 230, 230)", color: darkGrey, fontFamily: dataFont, fontSize: 12}}
          onClick={this.redrawTree}
        >
          reset tree
        </button>
      </Card>
    );
  }
}

export default Tree;
