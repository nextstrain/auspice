import React from "react";
import { updateVisibleTipsAndBranchThicknesses } from "../../actions/tree";
import Card from "../framework/card";
import Legend from "./legend/legend";
import PhyloTree from "./phyloTree/phyloTree";
import HoverInfoPanel from "./infoPanels/hover";
import TipClickedPanel from "./infoPanels/click";
import { changePhyloTreeViaPropsComparison } from "./reactD3Interface/change";
import * as callbacks from "./reactD3Interface/callbacks";
import { tabSingle, darkGrey, lightGrey } from "../../globalStyles";
import { renderTree } from "./reactD3Interface/initialRender";
import Tangle from "./tangle";
import { attemptUntangle } from "../../util/globals";
import { untangleTreeToo } from "./tangle/untangling";

class Tree extends React.Component {
  constructor(props) {
    super(props);
    this.tangleRef = undefined;
    this.state = {
      hover: null,
      selectedBranch: null,
      selectedTip: null,
      tree: null,
      treeToo: null
    };
    /* bind callbacks */
    this.clearSelectedTip = callbacks.clearSelectedTip.bind(this);
    // this.handleIconClickHOF = callbacks.handleIconClickHOF.bind(this);
    this.redrawTree = () => {
      this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
        root: [0, 0]
      }));
    };
  }
  setUpAndRenderTreeToo(props, newState) {
    /* this.setState(newState) will be run sometime after this returns */
    /* modifies newState in place */
    newState.treeToo = new PhyloTree(props.treeToo.nodes, "RIGHT");
    if (attemptUntangle) {
      untangleTreeToo(newState.tree, newState.treeToo);
    }
    renderTree(this, false, newState.treeToo, props);
  }
  componentDidMount() {
    if (this.props.tree.loaded) {
      const newState = {};
      newState.tree = new PhyloTree(this.props.tree.nodes, "LEFT");
      renderTree(this, true, newState.tree, this.props);
      if (this.props.showTreeToo) {
        this.setUpAndRenderTreeToo(this.props, newState); /* modifies newState in place */
      }
      this.setState(newState); /* this will trigger an unneccessary CDU :( */
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
      this.state.tree.change({svgHasChangedDimensions: true}); /* readjust co-ordinates */
      if (!this.props.showTreeToo) { /* turned off -> remove the 2nd tree */
        newState.treeToo = null;
      } else { /* turned on -> render the 2nd tree */
        if (this.state.treeToo) { /* tree has been swapped -> remove the old tree */
          this.state.treeToo.clearSVG();
        }
        newState.tree = this.state.tree; // setUpAndRenderTreeToo needs newState.tree
        this.setUpAndRenderTreeToo(this.props, newState); /* modifies newState in place */
        // this.resetView(); /* reset the position of the left tree */
        if (this.tangleRef) this.tangleRef.drawLines();
      }
    } else if (this.state.treeToo) { /* the tree hasn't just been swapped, but it does exist and may need updating */
      let unusedNewState; // eslint-disable-line
      [unusedNewState, rightTreeUpdated] = changePhyloTreeViaPropsComparison(false, this.state.treeToo, prevProps, this.props);
      /* note, we don't incorporate unusedNewState into the state? why not? */
    }

    /* we may need to (imperitively) tell the tangle to redraw */
    if (this.tangleRef && (leftTreeUpdated || rightTreeUpdated)) {
      this.tangleRef.drawLines();
    }
    if (Object.keys(newState).length) this.setState(newState);
  }

  getStyles = () => {
    const activeResetTreeButton = this.props.tree.idxOfInViewRootNode !== 0
      || this.props.treeToo.idxOfInViewRootNode !== 0;
    return {
      resetTreeButton: {
        zIndex: 100,
        position: "absolute",
        right: 5,
        top: 0,
        cursor: activeResetTreeButton ? "pointer" : "auto",
        color: activeResetTreeButton ? darkGrey : lightGrey
      }
    };
  };

  renderTreeDiv({width, height, d3ref}) {
    return (
      <svg style={{pointerEvents: "auto"}}
        width={width}
        height={height}
      >
        <g
          id={"d3TreeElement"}
          width={width}
          height={height}
          style={{cursor: "default"}}
          ref={(c) => {this[d3ref] = c;}}
        />
      </svg>
    );
  }

  render() {
    const styles = this.getStyles();
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
            leftTreeName={this.props.tree.name.toUpperCase()}
            rightTreeName={this.props.showTreeToo.toUpperCase()}
          />
        ) : null }
        {this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3ref"})}
        {this.props.showTreeToo ? <div style={{width: spaceBetweenTrees}}/> : null}
        {this.props.showTreeToo ?
          this.renderTreeDiv({width: widthPerTree, height: this.props.height, d3ref: "d3refToo"}) :
          null
        }
        <button
          style={{...tabSingle, ...styles.resetTreeButton}}
          onClick={this.redrawTree}
        >
          reset layout
        </button>
      </Card>
    );
  }
}

export default Tree;
