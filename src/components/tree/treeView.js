/*eslint-env browser*/
import React from "react";
import d3 from "d3";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import Legend from "./legend";
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
import BranchSelectedPanel from "./branchSelectedPanel";
import TipSelectedPanel from "./tipSelectedPanel";
import { connect } from "react-redux";
import computeResponsive from "../../util/computeResponsive";
import { zoomToClade,
         restrictTreeToSingleTip,
         updateVisibleTipsAndBranchThicknesses} from "../../actions/treeProperties";
import _ from "lodash";

/* UNDERSTANDING THIS CODE:
the "tree" object passed in from redux (this.props.tree)
contains the nodes etc used to build the PhyloTree
object called tree (!). Those nodes are in a 1-1 ordering, and
there are actually backlinks from the phylotree tree
(i.e. tree.nodes[i].n links to props.tree.nodes[i])

I (james) don't want to put phylotree into redux
as it's not simply data

the state of this component contains a few flags and
hovered / branchSelected / tipSelected,
each of which reference the nodes currently in that state
they're not in redux as (1) its easier and (2) all components that
need this information are children of this component
(it would probably be a good idea to move them to redux)
*/

/*
 * TreeView creates a (now responsive!) SVG & scales according to layout
 * such that branches and tips are correctly placed.
 * also handles zooming
*/
@connect((state) => {
  return {
    tree: state.tree,
    metadata: state.metadata.metadata,
    colorOptions: state.metadata.colorOptions,
    browserDimensions: state.browserDimensions.browserDimensions,
    map: state.map,
    colorBy: state.controls.colorBy,
    layout: state.controls.layout,
    showBranchLabels: state.controls.showBranchLabels,
    distanceMeasure: state.controls.distanceMeasure,
    sequences: state.sequences,
    selectedLegendItem: state.controls.selectedLegendItem,
    colorScale: state.controls.colorScale,
    datasetGuid: state.tree.datasetGuid,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax
  };
})
class TreeView extends React.Component {
  constructor(props) {
    super(props);
    this.Viewer = null;
    this.state = {
      tool: "pan",  //one of `none`, `pan`, `zoom`, `zoom-in`, `zoom-out`
      hover: null,
      selectedBranch: null,
      selectedTip: null,
      tree: null,
      shouldReRender: false // start off this way I guess
    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    sidebar: React.PropTypes.bool.isRequired
  }

  componentWillMount() {
    /* the tree resets itself on resize, so reset selections */
    window.addEventListener("resize",
      () => this.setState({
        hover: null,
        selectedBranch: null,
        selectedTip: null
      })
    );
  }

  componentWillReceiveProps(nextProps) {
    /*
    This both creates the tree (when it's loaded into redux) and
    works out what to update, based upon changes to redux.control

    NB logic was previously in CDM, but now we wait for browserDimensions
    */
    let tree = this.state.tree
    /* should we create a new tree (dataset change) */

    if ((nextProps.datasetGuid !== this.props.datasetGuid && nextProps.tree.nodes) ||
        (tree === null && nextProps.datasetGuid && nextProps.tree.nodes !== null)) {
      tree = this.makeTree(nextProps)
      // console.log("made tree", tree)
      this.setState({tree, shouldReRender: true});
      if (this.Viewer) {
        this.Viewer.fitToViewer();
      }
    }

    /* if we have a tree and we have new props, figure out what we need to update...
    this is imperitive, as opposed to redux-style coding, due to the fact
    that redrawing the tree is expensive, so we try and do the least amount
    of work possible.
    These attributes are stored in redux.tree
    */
    if (tree) {
      /* the objects storing the changes to make to the tree */
      const tipAttrToUpdate = {};
      const tipStyleToUpdate = {};
      const branchAttrToUpdate = {};
      const branchStyleToUpdate = {};

      if (nextProps.tree.visibilityVersion &&
          this.props.tree.visibilityVersion !== nextProps.tree.visibilityVersion) {
        // console.log("visibilityVersion change detected", this.props.tree.visibilityVersion, nextProps.tree.visibilityVersion)
        tipStyleToUpdate["visibility"] = nextProps.tree.visibility;
      }
      if (nextProps.tree.tipRadiiVersion &&
          this.props.tree.tipRadiiVersion !== nextProps.tree.tipRadiiVersion) {
        // console.log("tipRadiiVersion change detected", this.props.tree.tipRadiiVersion, nextProps.tree.tipRadiiVersion)
        tipAttrToUpdate["r"] = nextProps.tree.tipRadii;
      }
      if (nextProps.tree.nodeColorsVersion &&
          this.props.tree.nodeColorsVersion !== nextProps.tree.nodeColorsVersion) {
        // console.log("nodeColorsVersion change detected", this.props.tree.nodeColorsVersion, nextProps.tree.nodeColorsVersion)
        tipStyleToUpdate["fill"] = nextProps.tree.nodeColors.map((col) => {
          return d3.rgb(col).brighter([0.65]).toString();
        });
        tipStyleToUpdate["stroke"] = nextProps.tree.nodeColors;
        branchStyleToUpdate["stroke"] = nextProps.tree.nodeColors.map((col) => {
          return d3.rgb(d3.interpolateRgb(col, "#BBB")(0.6)).toString();
        });
      }
      if (this.props.tree.branchThicknessVersion !== nextProps.tree.branchThicknessVersion) {
        // console.log("branchThicknessVersion change detected", this.props.tree.branchThicknessVersion, nextProps.tree.branchThicknessVersion)
        branchStyleToUpdate["stroke-width"] = nextProps.tree.branchThickness;
      }

      /* implement style changes */
      if (Object.keys(branchAttrToUpdate).length || Object.keys(branchStyleToUpdate).length) {
        // console.log("applying branch attr", Object.keys(branchAttrToUpdate), "branch style changes", Object.keys(branchStyleToUpdate))
        tree.updateMultipleArray(".branch", branchAttrToUpdate, branchStyleToUpdate, fastTransitionDuration);
      }
      if (Object.keys(tipAttrToUpdate).length || Object.keys(tipStyleToUpdate).length) {
        // console.log("applying tip attr", Object.keys(tipAttrToUpdate), "tip style changes", Object.keys(tipStyleToUpdate))
        tree.updateMultipleArray(".tip", tipAttrToUpdate, tipStyleToUpdate, fastTransitionDuration);
      }

      /* swap layouts */
      if (this.props.layout !== nextProps.layout) {
        tree.updateLayout(nextProps.layout, mediumTransitionDuration);
      }
      /* change distance metrics */
      if (this.props.distanceMeasure !== nextProps.distanceMeasure) {
        tree.updateDistance(nextProps.distanceMeasure, mediumTransitionDuration);
      }

      if (this.props.showBranchLabels!==nextProps.showBranchLabels){
        if (nextProps.showBranchLabels){
          tree.showBranchLabels();
        }else{
          tree.hideBranchLabels();
        }
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    /* we are now in a position to control the rendering to improve performance */
    if (nextState.shouldReRender) {
      this.setState({shouldReRender: false});
      return true;
    } else if (
      this.state.tree &&
      (this.props.browserDimensions.width !== nextProps.browserDimensions.width ||
      this.props.browserDimensions.height !== nextProps.browserDimensions.height ||
      this.props.sidebar !== nextProps.sidebar)
    ) {
      return true;
    } else if (
      this.state.hovered !== nextState.hovered ||
      this.state.selectedTip !== nextState.selectedTip ||
      this.state.selectedBranch !== nextState.selectedBranch
    ) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    /* after a re-render (i.e. perhaps the SVG has changed size) call zoomIntoClade
    so that the tree rescales to fit the SVG
    */
    if (
      // the tree exists AND
      this.state.tree &&
      // it's not the first render (the listener is registered and width/height passed in)  AND
      prevProps.browserDimensions && this.props.browserDimensions &&
      // the browser dimensions have changed
      (prevProps.browserDimensions.width !== this.props.browserDimensions.width ||
      prevProps.browserDimensions.height !== this.props.browserDimensions.height)
    ) {
      this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
    } else if (
      // the tree exists AND the sidebar has changed
      this.state.tree && (this.props.sidebar !== prevProps.sidebar)
    ) {
      this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
    }
  }

  makeTree(nextProps) {
    const nodes = nextProps.tree.nodes;
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
          confidence: false,
          branchLabels: true,      //generate DOM object
          showBranchLabels: false,  //hide them initially -> couple to redux state
          tipLabels: true,      //generate DOM object
          showTipLabels: true   //show
        },
        {
          /* callbacks */
          onTipHover: this.onTipHover.bind(this),
          onTipClick: this.onTipClick.bind(this),
          onBranchHover: this.onBranchHover.bind(this),
          onBranchClick: this.onBranchClick.bind(this),
          onBranchLeave: this.onBranchLeave.bind(this),
          onTipLeave: this.onTipLeave.bind(this),
          // onBranchOrTipLeave: this.onBranchOrTipLeave.bind(this),
          branchLabel: this.branchLabel.bind(this),
          branchLabelSize: this.branchLabelSize.bind(this),
          tipLabel: this.tipLabel.bind(this),
          tipLabelSize: this.tipLabelSize.bind(this)
        },
        /* branch Thicknesses - guarenteed to be in redux by now */
        nextProps.tree.branchThickness,
        nextProps.tree.visibility
      );
      return myTree;
    } else {
      return null;
    }
  }

  /* Callbacks used by the tips / branches when hovered / selected */
  onTipHover(d, x, y) {
    this.state.tree.svg.select("#tip_" + d.n.clade)
      .attr("r", (d) => d["r"] + 4);
    this.setState({
      hovered: {d, type: ".tip", x, y}
    });
  }
  onTipClick(d) {
    // console.log("tip click", d)
    this.setState({
      hovered: null,
      selectedTip: d
    });
    this.props.dispatch(restrictTreeToSingleTip(d.n.arrayIdx))
  }
  onBranchHover(d, x, y) {
    // for (let id of ["#branch_T_" + d.n.clade, "#branch_S_" + d.n.clade]) {
    const id = "#branch_S_" + d.n.clade;
    this.state.tree.svg.select(id)
      .style("stroke", (d) => d["stroke"])
    this.setState({
      hovered: {d, type: ".branch", x, y}
    });
  }
  onBranchClick(d) {
    this.state.tree.zoomIntoClade(d, mediumTransitionDuration);
    /* to stop multiple phyloTree updates potentially clashing,
    we change tipVis after geometry update + transition */
    window.setTimeout(() =>
      this.props.dispatch(zoomToClade(d.arrayIdx)),
      mediumTransitionDuration
    );
    this.setState({
      hovered: null,
      selectedBranch: d
    });
  }
  /* onBranchLeave called when mouse-off, i.e. anti-hover */
  onBranchLeave(d) {
    // for (let id of ["#branch_T_" + d.n.clade, "#branch_S_" + d.n.clade]) {
    const id = "#branch_S_" + d.n.clade;
    this.state.tree.svg.select(id)
      .style("stroke", (d) => d3.rgb(d3.interpolateRgb(d["stroke"], "#BBB")(0.6)).toString());
    if (this.state.hovered) {
      this.setState({hovered: null})
    }
  }
  onTipLeave(d) {
    if (!this.state.selectedTip) {
      this.state.tree.svg.select("#tip_" + d.n.clade)
        .attr("r", (d) => d["r"]);
    }
    if (this.state.hovered) {
      this.setState({hovered: null});
    }
  }
  /* viewEntireTree: triggered by "reset to entire tree" button */
  viewEntireTree() {
    /* reset the SVGPanZoom */
    this.Viewer.fitToViewer();
    /* imperitively manipulate SVG tree elements */
    this.state.tree.zoomIntoClade(this.state.tree.nodes[0], globals.mediumTransitionDuration);
    /* update branch thicknesses / tip vis after SVG tree elemtents have moved */
    window.setTimeout(
      () => this.props.dispatch(zoomToClade(0)),
      mediumTransitionDuration
    );
    this.setState({selectedBranch: null, selectedTip: null});
  }
  /* clearSelectedTip when clicking to go away */
  clearSelectedTip(d) {
    this.state.tree.svg.select("#tip_" + d.n.clade)
      .attr("r", (d) => d["r"]);
    this.setState({selectedTip: null, hovered: null});
    /* restore the tip visibility! */
    this.props.dispatch(updateVisibleTipsAndBranchThicknesses())
  }

  /**
   * @param  {node}
   * @return {string that is displayed as label on the branch
   *          corresponding to the node}
   */
  branchLabel(d){
    if (d.n.muts){
      if (d.n.muts.length>5){
        return d.n.muts.slice(0,5).join(", ") + "...";
      }else{
        return d.n.muts.join(", ");
      }
    }else{
      return "";
    }
  }
  /**
   * @param  {node}
   * @param  {total number of nodes in current view}
   * @return {font size of the branch label}
   */
  branchLabelSize(d,n){
    if (d.leafCount>n/10.0){
      return 12;
    }else{
      return 0;
    }
  }

  /**
   * @param  {node}
   * @return {string that is displayed as label on the branch
   *          corresponding to the node}
   */
  tipLabel(d){
    return d.n.strain;
  }
  /**
   * @param  {node}
   * @param  {total number of nodes in current view}
   * @return {font size of the tip label}
   */
  tipLabelSize(d,n){
    if (n>70){
      return 0;
    }else if (n<20){
      return 14;
    }else{
      const fs = 6+8*(70-n)/(70-20);
      return fs;
    }
  }



  handleIconClick(tool) {
    return () => {
      const V = this.Viewer.getValue();
      if (tool === "zoom-in") {
        this.Viewer.zoomOnViewerCenter(1.4);
      } else { // zoom out
        if (V.a>1.0){ // if there is room to zoom out via the SVGPanZoom, do
          this.Viewer.zoomOnViewerCenter(0.71);
        }else{        // otherwise reset view to have SVG fit the viewer
          this.resetView();
          // if we have clade zoom, zoom out to the parent clade
          if (this.state.selectedBranch && this.state.selectedBranch.n.arrayIdx){
            const dp = this.props.dispatch;
            const arrayIdx = this.state.tree.zoomNode.parent.n.arrayIdx;
            // reset the "clicked" branch, unset if we zoomed out all the way to the root
            this.setState({
              hovered: null,
              selectedBranch: (arrayIdx)?this.state.tree.zoomNode.parent:null
            });

            const makeCallBack = function(){
              return function(){
                dp(updateVisibleTipsAndBranchThicknesses());
              }
            }
            // clear previous timeout bc they potentially mess with the geometry update
            if (this.timeout){
              clearTimeout(this.timeout);
            }
            // call phyloTree to zoom out, this rerenders the geometry
            this.state.tree.zoomToParent(mediumTransitionDuration);
            // wait and reset visibility
            this.timeout = setTimeout(makeCallBack(), mediumTransitionDuration);
          }
        }
      }
      this.resetGrid();
    };
  }

  startPan(d){
  }

  onViewerChange(d){
    if (this.Viewer && this.state.tree){
      const V = this.Viewer.getValue();
      if (V.mode==="panning"){
          this.resetGrid();
      }else if (V.mode==="idle"){
          this.resetGrid();
      }
    }
  }

  resetGrid(){
    const layout = this.props.layout;
    if (this.props.layout !== "unrooted"){
      const tree = this.state.tree;
      const visibleArea = this.visibleArea;
      const viewer = this.Viewer;
      const delayedRedraw = function(){
        return function(){
          const view = visibleArea(viewer);
          tree.addGrid(layout, view.bottom, view.top);
        }
      }
      setTimeout(delayedRedraw(), 200);
    }
  }

  resetView(d){
    this.Viewer.fitToViewer();
  }

  visibleArea(Viewer){
    const V = Viewer.getValue();
    return {left: -V.e/V.a, top:-V.f/V.d,
            right:(V.viewerWidth - V.e)/V.a, bottom: (V.viewerHeight-V.f)/V.d}
  }

  // handleZoomEvent(direction) {
  //   return () => {
  //     this.state.value.matrix
  //     console.log(direction)
  //   }
  // }
  // handleChange(value) {
  //   console.log("handleChange not yet implemented", value)
  // }
  // handleClick(event){
  //   console.log('handleClick not yet implemented', event)
  //   // console.log('click', event.x, event.y, event.originalEvent);
  // }

  infoPanelDismiss() {
    this.setState({clicked: null, hovered: null});
    this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
  }

  render() {
    const responsive = computeResponsive({
      horizontal: this.props.browserDimensions && this.props.browserDimensions.width > globals.twoColumnBreakpoint ? .5 : 1,
      vertical: 1.0,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar,
      minHeight: 480,
      maxAspectRatio: 1.0
    })
    const cardTitle = this.state.selectedBranch ? "" : "Phylogeny";

    /* NOTE these props were removed from SVG pan-zoom as they led to functions that did
    nothing, but they may be useful in the future...
    onChangeValue={this.handleChange.bind(this)}
    onClick={this.handleClick.bind(this)}
    */

    return (
      <Card center title={cardTitle}>
        <Legend sidebar={this.props.sidebar}/>
        <InfoPanel
          tree={this.state.tree}
          hovered={this.state.hovered}
          viewer={this.Viewer}
          colorBy={this.props.colorBy}
        />
        <BranchSelectedPanel
          responsive={responsive}
          viewEntireTreeCallback={() => this.viewEntireTree()}
          branch={this.state.selectedBranch}
        />
        <TipSelectedPanel
          goAwayCallback={(d) => this.clearSelectedTip(d)}
          tip={this.state.selectedTip}
        />
        <ReactSVGPanZoom
          width={responsive ? responsive.width : 1}
          height={responsive ? responsive.height : 1}
          ref={(Viewer) => {
            // https://facebook.github.io/react/docs/refs-and-the-dom.html
            this.Viewer = Viewer
          }}
          style={{cursor: "default"}}
          tool={'pan'}
          detectWheel={false}
          toolbarPosition={"none"}
          detectAutoPan={false}
          background={"#FFF"}
          // onMouseDown={this.startPan.bind(this)}
          onDoubleClick={this.resetView.bind(this)}
          //onMouseUp={this.endPan.bind(this)}
          onChangeValue={ this.onViewerChange.bind(this) }
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
            active
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
  }
}

export default TreeView;

// map animation code to be integrated into componentWillUpdate or other lifecycle later, commented out for big merge -- Colin
// if (
//   this.state.tree &&
//   this.props.layout &&
//   this.props.map &&
//   this.props.map.animating === true /* the map is in motion, move the bar across the tree */
// ) {
//   this.state.tree.updateTimeBar(
//     globals.mapAnimationDurationInMilliseconds,
//     this.props.map.progress, /* where the requestAnimationFrame is at the moment */
//     this.props.layout
//   );
// }
