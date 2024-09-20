import React from "react";
import { withTranslation } from "react-i18next";
import { FaSearchMinus } from "react-icons/fa";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import Card from "../framework/card";
import Legend from "./legend/legend";
import PhyloTree from "./phyloTree/phyloTree";
import { getParentBeyondPolytomy } from "./phyloTree/helpers";
import HoverInfoPanel from "./infoPanels/hover";
import NodeClickedPanel from "./infoPanels/click";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface/change";
import * as callbacks from "./reactD3Interface/callbacks";
import { tabSingle, darkGrey, lightGrey } from "../../globalStyles";
import { renderTree } from "./reactD3Interface/initialRender";
import Tangle from "./tangle";
import { attemptUntangle } from "../../util/globals";
import ErrorBoundary from "../../util/errorBoundary";
import { untangleTreeToo } from "./tangle/untangling";
import { sortByGeneOrder } from "../../util/treeMiscHelpers";

export const spaceBetweenTrees = 100;
export const lhsTreeId = "LEFT";
const rhsTreeId = "RIGHT";

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.domRefs = {
      mainTree: undefined,
      secondTree: undefined
    };
    this.tangleRef = undefined;
    this.state = {
      hoveredNode: null,
      tree: null,
      treeToo: null
    };

    /* bind callbacks */
    this.clearSelectedNode = callbacks.clearSelectedNode.bind(this);
  }

  redrawTree = () => {
    this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
      root: [0, 0]
    }));
  }

  /* pressing the escape key should dismiss an info modal (if one exists) */
  handlekeydownEvent = (event) => {
    if (event.key==="Escape" && this.props.selectedNode) {
      this.clearSelectedNode(this.props.selectedNode);
    }
  }

  setUpAndRenderTreeToo(props, newState) {
    /* this.setState(newState) will be run sometime after this returns */
    /* modifies newState in place */
    newState.treeToo = new PhyloTree(props.treeToo.nodes, rhsTreeId, props.treeToo.idxOfInViewRootNode);
    if (attemptUntangle) {
      untangleTreeToo(newState.tree, newState.treeToo);
    }
    renderTree(this, false, newState.treeToo, props);
  }

  componentDidMount() {
    document.addEventListener('keyup', this.handlekeydownEvent);
    if (this.props.tree.loaded) {
      const newState = {};
      newState.tree = new PhyloTree(this.props.tree.nodes, lhsTreeId, this.props.tree.idxOfInViewRootNode);
      renderTree(this, true, newState.tree, this.props);
      if (this.props.showTreeToo) {
        this.setUpAndRenderTreeToo(this.props, newState); /* modifies newState in place */
      }
      newState.geneSortFn = sortByGeneOrder(this.props.genomeMap);
      this.setState(newState); /* this will trigger an unnecessary CDU :( */
    }
  }

  componentDidUpdate(prevProps) {
    let newState = {};
    let rightTreeUpdated = false;

    /* potentially change the (main / left hand) tree */
    const [potentialNewState, leftTreeUpdated] = changePhyloTreeViaPropsComparison(true, this.state.tree, prevProps, this.props);
    if (potentialNewState) newState = potentialNewState;

    /* has the 2nd (right hand) tree just been turned on, off or swapped? */
    if (prevProps.showTreeToo !== this.props.showTreeToo) {
      if (!this.props.showTreeToo) { /* turned off -> remove the 2nd tree */
        newState.treeToo = null;
      } else { /* turned on -> render the 2nd tree */
        if (this.state.treeToo) { /* tree has been swapped -> remove the old tree */
          this.state.treeToo.clearSVG();
        }
        newState.tree = this.state.tree; // setUpAndRenderTreeToo needs newState.tree
        this.setUpAndRenderTreeToo(this.props, newState); /* modifies newState in place */
        if (this.tangleRef) this.tangleRef.drawLines();
      }
    } else if (this.state.treeToo) { /* the tree hasn't just been swapped, but it does exist and may need updating */
      let _unusedNewState;
      [_unusedNewState, rightTreeUpdated] = changePhyloTreeViaPropsComparison(false, this.state.treeToo, prevProps, this.props);
      /* note, we don't incorporate _unusedNewState into the state? why not? */
    }

    /* we may need to (imperatively) tell the tangle to redraw */
    if (this.tangleRef && (leftTreeUpdated || rightTreeUpdated)) {
      this.tangleRef.drawLines();
    }
    if (Object.keys(newState).length) this.setState(newState);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.handlekeydownEvent);
  }

  getStyles = () => {
    const activeResetTreeButton = this.props.tree.idxOfInViewRootNode !== 0 ||
      this.props.treeToo.idxOfInViewRootNode !== 0;

    const filteredTree = !!this.props.tree.idxOfFilteredRoot &&
      this.props.tree.idxOfInViewRootNode !== this.props.tree.idxOfFilteredRoot;
    const filteredTreeToo = !!this.props.treeToo.idxOfFilteredRoot &&
      this.props.treeToo.idxOfInViewRootNode !== this.props.treeToo.idxOfFilteredRoot;
    const activeZoomButton = filteredTree || filteredTreeToo;

    const treeIsZoomed = this.props.tree.idxOfInViewRootNode !== 0 ||
      this.props.treeToo.idxOfInViewRootNode !== 0;

    return {
      treeButtonsDiv: {
        zIndex: 100,
        position: "absolute",
        right: 5,
        top: 0
      },
      resetTreeButton: {
        zIndex: 100,
        display: "inline-block",
        marginLeft: 4,
        cursor: activeResetTreeButton ? "pointer" : "auto",
        color: activeResetTreeButton ? darkGrey : lightGrey
      },
      zoomToSelectedButton: {
        zIndex: 100,
        display: "inline-block",
        cursor: activeZoomButton ? "pointer" : "auto",
        color: activeZoomButton ? darkGrey : lightGrey,
        pointerEvents: activeZoomButton ? "auto" : "none"
      },
      zoomOutButton: {
        zIndex: 100,
        display: "inline-block",
        cursor: treeIsZoomed ? "pointer" : "auto",
        color: treeIsZoomed ? darkGrey : lightGrey,
        pointerEvents: treeIsZoomed ? "auto" : "none",
        marginRight: "4px"
      }
    };
  };

  renderTreeDiv({width, height, mainTree}) {
    return (
      <svg
        id={mainTree ? "MainTree" : "SecondTree"}
        style={{pointerEvents: "auto", cursor: "default", userSelect: "none"}}
        width={width}
        height={height}
        ref={(c) => {mainTree ? this.domRefs.mainTree = c : this.domRefs.secondTree = c;}}
      />
    );
  }

  zoomToSelected = () => {
    this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
      root: [this.props.tree.idxOfFilteredRoot, this.props.treeToo.idxOfFilteredRoot]
    }));
  };

  zoomBack = () => {
    let newRoot, newRootToo;
    // Zoom out of main tree if index of root node is not 0
    if (this.props.tree.idxOfInViewRootNode !== 0) {
      const rootNode = this.props.tree.nodes[this.props.tree.idxOfInViewRootNode];
      newRoot = getParentBeyondPolytomy(rootNode, this.props.distanceMeasure, this.props.tree.observedMutations).arrayIdx;
    }
    // Also zoom out of second tree if index of root node is not 0
    if (this.props.treeToo.idxOfInViewRootNode !== 0) {
      const rootNodeToo = this.props.treeToo.nodes[this.props.treeToo.idxOfInViewRootNode];
      newRootToo = getParentBeyondPolytomy(rootNodeToo, this.props.distanceMeasure, this.props.treeToo.observedMutations).arrayIdx;
    }
    const root = [newRoot, newRootToo];
    this.props.dispatch(updateVisibleTipsAndBranchThicknesses({root}));
  }

  render() {
    const { t } = this.props;
    const styles = this.getStyles();
    const widthPerTree = this.props.showTreeToo ? (this.props.width - spaceBetweenTrees) / 2 : this.props.width;
    return (
      <Card center infocard={this.props.showOnlyPanels} title={t("Phylogeny")}>
        <ErrorBoundary>
          <Legend width={this.props.width}/>
        </ErrorBoundary>
        <HoverInfoPanel
          selectedNode={this.state.hoveredNode}
          colorBy={this.props.colorBy}
          colorByConfidence={this.props.colorByConfidence}
          colorScale={this.props.colorScale}
          colorings={this.props.colorings}
          geneSortFn={this.state.geneSortFn}
          observedMutations={this.props.tree.observedMutations}
          panelDims={{width: this.props.width, height: this.props.height, spaceBetweenTrees}}
          tipLabelKey={this.props.tipLabelKey}
          t={t}
        />
        <NodeClickedPanel
          clearSelectedNode={this.clearSelectedNode}
          selectedNode={this.props.selectedNode}
          nodesLhsTree={this.props.tree.nodes}
          nodesRhsTree={this.props.treeToo?.nodes}
          observedMutations={this.props.tree.observedMutations}
          colorings={this.props.colorings}
          geneSortFn={this.state.geneSortFn}
          tipLabelKey={this.props.tipLabelKey}
          t={t}
        />
        {this.props.showTangle && this.state.tree && this.state.treeToo ? (
          <Tangle
            ref={(r) => {this.tangleRef = r;}}
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
            leftTreeName={this.props.tree.name}
            rightTreeName={this.props.showTreeToo}
          />
        ) : null }
        {this.renderTreeDiv({width: widthPerTree, height: this.props.height, mainTree: true})}
        {this.props.showTreeToo ? <div id="treeSpacer" style={{width: spaceBetweenTrees}}/> : null}
        {this.props.showTreeToo ?
          this.renderTreeDiv({width: widthPerTree, height: this.props.height, mainTree: false}) :
          null
        }
        {this.props.narrativeMode ? null : (
          <div style={{...styles.treeButtonsDiv}}>
            <button
              style={{...tabSingle, ...styles.zoomOutButton}}
              onClick={this.zoomBack}
            >
              <FaSearchMinus/>
            </button>
            <button
              style={{...tabSingle, ...styles.zoomToSelectedButton}}
              onClick={this.zoomToSelected}
            >
              {t("Zoom to Selected")}
            </button>
            <button
              style={{...tabSingle, ...styles.resetTreeButton}}
              onClick={this.redrawTree}
            >
              {t("Reset Layout")}
            </button>
          </div>
        )}
      </Card>
    );
  }
}

const WithTranslation = withTranslation()(Tree);
export default WithTranslation;
