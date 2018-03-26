import React from "react";
import { ReactSVGPanZoom } from "react-svg-pan-zoom";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import Card from "../framework/card";
import Legend from "./legend/legend";
import PhyloTree from "./phyloTree/phyloTree";
import HoverInfoPanel from "./infoPanels/hover";
import TipClickedPanel from "./infoPanels/click";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface/change";
import * as callbacks from "./reactD3Interface/callbacks";
import { resetTreeButtonStyle } from "../../globalStyles";
import { renderTree } from "./reactD3Interface/initialRender";
import Tangle from "./tangle";

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.Viewer = null;
    this.state = {
      tool: "pan", // one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
      hover: null,
      selectedBranch: null,
      selectedTip: null,
      tree: null,
      treeToo: null
    };
    /* bind callbacks */
    this.clearSelectedTip = callbacks.clearSelectedTip.bind(this);
    this.resetView = callbacks.resetView.bind(this);
    this.onViewerChange = callbacks.onViewerChange.bind(this);
    // this.handleIconClickHOF = callbacks.handleIconClickHOF.bind(this);
    this.redrawTree = () => {
      this.state.tree.clearSVG();
      this.Viewer.fitToViewer();
      renderTree(this, true, this.state.tree, this.props);
      if (this.props.showTreeToo) {
        this.state.treeToo.clearSVG();
        this.ViewerToo.fitToViewer();
        renderTree(this, false, this.state.treeToo, this.props);
      }
      this.setState({hover: null, selectedBranch: null, selectedTip: null});
      this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root: [0, 0]}));
    };
  }
  componentDidMount() {
    if (this.props.tree.loaded) {
      const tree = new PhyloTree(this.props.tree.nodes, "LEFT");
      renderTree(this, true, tree, this.props);
      this.Viewer.fitToViewer();
      const newState = {tree};
      if (this.props.showTreeToo) {
        const treeToo = new PhyloTree(this.props.treeToo.nodes, "RIGHT");
        renderTree(this, false, treeToo, this.props);
        this.ViewerToo.fitToViewer();
        newState.treeToo = treeToo;
      }
      this.setState(newState);
    }
  }
  /* CWRP has two tasks: (1) create the tree when it's in redux
  (2) compare props and call phylotree.change() appropritately */
  componentWillReceiveProps(nextProps) {
    if (!nextProps.tree.loaded) {
      this.setState({tree: null, treeToo: null});
      return;
    }
    if (!this.state.tree && nextProps.tree.loaded) {
      const tree = new PhyloTree(nextProps.tree.nodes, "LEFT");
      renderTree(this, true, tree, nextProps);
      this.Viewer.fitToViewer();
      this.setState({tree});
    }
  }

  /* CDU is used to update phylotree when the SVG size _has_ changed (and this is why it's in CDU not CWRP) */
  componentDidUpdate(prevProps) {
    let newState;
    if (this.state.tree) {
      newState = changePhyloTreeViaPropsComparison(true, this.state.tree, this.Viewer, prevProps, this.props);
      changePhyloTreeViaPropsComparison(this, prevProps, this.props);
      if (prevProps.showTreeToo !== this.props.showTreeToo) {
        console.warn("potential race condition");
        this.state.tree.change({svgHasChangedDimensions: true});
        return;
      }
    }
    /* tree too */
    if (this.state.treeToo) {
      if (!prevProps.showTreeToo && this.props.showTreeToo) {
        newState.treeToo = new PhyloTree(this.props.treeToo.nodes, "RIGHT");
        renderTree(this, false, newState.treeToo, this.props);
        this.ViewerToo.fitToViewer();
      } else if (!this.props.showTreeToo) {
        newState.treeToo = null;
      } else {
        changePhyloTreeViaPropsComparison(false, this.state.treeToo, this.ViewerToo, prevProps, this.props);
      }
    }
    if (newState) this.setState(newState);
  }
  renderTreeDiv({width, height, d3ref, viewerRef}) {
    return (
      <ReactSVGPanZoom
        width={width}
        height={height}
        ref={(Viewer) => {this[viewerRef] = Viewer;}}
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
          width={width}
          height={height}
        >
          <g
            width={width}
            height={height}
            style={{cursor: "default"}}
            ref={(c) => {this[d3ref] = c;}}
          />
        </svg>
      </ReactSVGPanZoom>
    );
  }

  render() {
    const spaceBetweenTrees = 100;
    const widthPerTree = this.props.showTreeToo ? (this.props.width - spaceBetweenTrees) / 2 : this.props.width;
    return (
      <Card center title={"Phylogeny"}>
        <Legend width={this.props.width}/>
        <HoverInfoPanel
          mutType={this.props.mutType}
          temporalConfidence={this.props.temporalConfidence.display}
          distanceMeasure={this.props.distanceMeasure}
          hovered={this.state.hovered}
          viewer={this.Viewer}
          colorBy={this.props.colorBy}
          colorByConfidence={this.props.colorByConfidence}
          colorScale={this.props.colorScale}
          panelDims={{width: this.props.width, height: this.props.height, spaceBetweenTrees}}
        />
        <TipClickedPanel
          goAwayCallback={this.clearSelectedTip}
          tip={this.state.selectedTip}
          metadata={this.props.metadata}
        />
        {this.props.showTangle ? (
          <Tangle
            width={this.props.width}
            height={this.props.height}
            lookup={this.props.treeToo.tangleTipLookup}
            leftNodes={this.props.tree.nodes}
            rightNodes={this.props.treeToo.nodes}
            colors={this.props.tree.nodeColors}
            cVersion={this.props.tree.nodeColorsVersion}
            vVersion={this.props.tree.visibilityVersion}
            metric={this.props.distanceMeasure}
            spaceBetweenTrees={spaceBetweenTrees}
          />
        ) : null }
        {this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3ref", viewerRef: "Viewer"})}
        {this.props.showTreeToo ? <div style={{width: spaceBetweenTrees}}/> : null}
        {this.props.showTreeToo ?
          this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3refToo", viewerRef: "ViewerToo"}) :
          null
        }
        <button
          style={resetTreeButtonStyle}
          onClick={this.redrawTree}
        >
          reset layout
        </button>
      </Card>
    );
  }
}

export default Tree;
