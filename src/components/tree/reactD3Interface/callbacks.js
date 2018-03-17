import { rgb } from "d3-color";
import { interpolateRgb } from "d3-interpolate";
import { updateVisibleTipsAndBranchThicknesses} from "../../../actions/tree";
import { mediumTransitionDuration } from "../../../util/globals";
import { branchOpacityFunction } from "../../../util/colorHelpers";

/* Callbacks used by the tips / branches when hovered / selected */

export const onTipHover = function onTipHover(d) {
  this.state.tree.svg.select("#tip_" + d.n.clade)
    .attr("r", (e) => e["r"] + 4);
  this.setState({
    hovered: {d, type: ".tip"}
  });
};

export const onTipClick = function onTipClick(d) {
  // console.log("tip click", d)
  this.setState({
    hovered: null,
    selectedTip: d
  });
  /* are we clicking from tree1 or tree2? */
  const tipSelected = d.that.params.orientation[0] === 1 ?
    {treeIdx: d.n.arrayIdx} :
    {treeTooIdx: d.n.arrayIdx};
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({tipSelected}));
};


export const onBranchHover = function onBranchHover(d) {
  /* emphasize the color of the branch */
  for (const id of ["#branch_S_" + d.n.clade, "#branch_T_" + d.n.clade]) {
    if (this.props.colorByConfidence) {
      this.state.tree.svg.select(id)
        .style("stroke", (el) => { // eslint-disable-line no-loop-func
          const ramp = branchOpacityFunction(this.props.tree.nodes[el.n.arrayIdx].attr[this.props.colorBy + "_entropy"]);
          const raw = this.props.tree.nodeColors[el.n.arrayIdx];
          const base = el.branchStroke;
          return rgb(interpolateRgb(raw, base)(ramp)).toString();
        });
    } else {
      this.state.tree.svg.select(id)
        .style("stroke", (el) => this.props.tree.nodeColors[el.n.arrayIdx]);
    }
  }
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    this.state.tree.svg.append("g").selectAll(".conf")
      .data([d])
      .enter()
      .call((sel) => this.state.tree.drawSingleCI(sel, 0.5));
  }
  this.setState({
    hovered: {d, type: ".branch"}
  });
};

export const onBranchClick = function onBranchClick(d) {
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses({idxOfInViewRootNode: d.n.arrayIdx}));
};

/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function onBranchLeave(d) {
  for (const id of ["#branch_T_" + d.n.clade, "#branch_S_" + d.n.clade]) {
    this.state.tree.svg.select(id)
      .style("stroke", (el) => el.branchStroke);
  }
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    this.state.tree.removeConfidence(mediumTransitionDuration);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

export const onTipLeave = function onTipLeave(d) {
  if (!this.state.selectedTip) {
    this.state.tree.svg.select("#tip_" + d.n.clade)
      .attr("r", (dd) => dd["r"]);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

/* clearSelectedTip when clicking to go away */
export const clearSelectedTip = function clearSelectedTip(d) {
  this.state.tree.svg.select("#tip_" + d.n.clade)
    .attr("r", (dd) => dd["r"]);
  this.setState({selectedTip: null, hovered: null});
  /* restore the tip visibility! */
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses(
    {tipSelected: {clear: true}}
  ));
};


const visibleArea = function visibleArea(Viewer) {
  const V = Viewer.getValue();
  return {
    left: -V.e / V.a,
    top: -V.f / V.d,
    right: (V.viewerWidth - V.e) / V.a,
    bottom: (V.viewerHeight - V.f) / V.d
  };
};

const resetGrid = function resetGrid() {
  const layout = this.props.layout;
  if (this.props.layout !== "unrooted") {
    const tree = this.state.tree;
    // const visibleArea = .visibleArea;
    const viewer = this.Viewer;
    window.setTimeout(() => {
      const view = visibleArea(viewer);
      tree.addGrid(layout, view.bottom, view.top);
    }, 200);
  }
};

export const onViewerChange = function onViewerChange() {
  if (this.Viewer && this.state.tree) {
    const V = this.Viewer.getValue();
    if (V.mode === "panning") {
      resetGrid.bind(this)();
    } else if (V.mode === "idle") {
      resetGrid.bind(this);
    }
  }
};

export const resetView = function resetView() {
  this.Viewer.fitToViewer();
};

// export const handleIconClickHOF = function handleIconClickHOF(tool) {
//   return () => {
//     const V = this.Viewer.getValue();
//     if (tool === "zoom-in") {
//       this.Viewer.zoomOnViewerCenter(1.4);
//     } else if (V.a > 1.0) { // if there is room to zoom out via the SVGPanZoom, do
//       this.Viewer.zoomOnViewerCenter(0.71);
//     } else { // otherwise reset view to have SVG fit the viewer
//       resetView.bind(this)();
//       // if we have clade zoom, zoom out to the parent clade
//       if (this.state.selectedBranch && this.state.selectedBranch.n.arrayIdx) {
//         this.props.dispatch(updateVisibleTipsAndBranchThicknesses({
//           idxOfInViewRootNode: this.state.tree.zoomNode.parent.n.arrayIdx
//         }));
//       }
//     }
//     resetGrid.bind(this)();
//   };
// };

/**
 * @param  {node} d tree node object
 * @param  {int} n total number of nodes in current view
 * @return {int} font size of the tip label
 */
export const tipLabelSize = (d, n) => {
  if (n > 70) {
    return 0;
  } else if (n < 20) {
    return 14;
  }
  const fs = 6 + 8 * (70 - n) / (70 - 20);
  return fs;
};
