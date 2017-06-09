/*eslint no-invalid-this: 0*/
/*eslint-env browser*/
/*eslint dot-notation: 0*/
/*eslint max-len : 0*/
import { zoomToClade,
         restrictTreeToSingleTip,
         updateVisibleTipsAndBranchThicknesses} from "../../actions/treeProperties";
import { branchOpacityConstant,
         branchOpacityFunction,
         branchInterpolateColour } from "../../util/treeHelpers";
import { mediumTransitionDuration } from "../../util/globals";
import d3 from "d3";


export const visibleArea = function (Viewer) {
  const V = Viewer.getValue();
  return {
    left: -V.e / V.a,
    top: -V.f / V.d,
    right: (V.viewerWidth - V.e) / V.a,
    bottom: (V.viewerHeight - V.f) / V.d
  };
};

export const resetGrid = function () {
  const layout = this.props.layout;
  if (this.props.layout !== "unrooted") {
    const tree = this.state.tree;
    // const visibleArea = .visibleArea;
    const viewer = this.Viewer;
    const delayedRedraw = function () {
      return function () {
        const view = visibleArea(viewer);
        tree.addGrid(layout, view.bottom, view.top);
      };
    };
    window.setTimeout(delayedRedraw(), 200);
  }
};


export const onViewerChange = function () {
  if (this.Viewer && this.state.tree) {
    const V = this.Viewer.getValue();
    if (V.mode === "panning") {
      resetGrid.bind(this)();
    }else if (V.mode === "idle") {
      resetGrid.bind(this);
    }
  }
};

export const resetView = function () {
  this.Viewer.fitToViewer();
};

/* Callbacks used by the tips / branches when hovered / selected */
export const onTipHover = function (d, x, y) {
  this.state.tree.svg.select("#tip_" + d.n.clade)
    .attr("r", (e) => e["r"] + 4);
  this.setState({
    hovered: {d, type: ".tip", x, y}
  });
};

export const onTipClick = function (d) {
  // console.log("tip click", d)
  this.setState({
    hovered: null,
    selectedTip: d
  });
  this.props.dispatch(restrictTreeToSingleTip(d.n.arrayIdx));
};

export const onBranchHover = function (d, x, y) {
  /* emphasize the color of the branch */
  for (const id of ["#branch_S_" + d.n.clade, "#branch_T_" + d.n.clade]) {
    if (this.props.colorByConfidence) {
      this.state.tree.svg.select(id)
        .style("stroke", (el) => {
          const ramp = branchOpacityFunction(this.props.tree.nodes[el.n.arrayIdx].attr[this.props.colorBy + "_entropy"]);
          const raw = this.props.tree.nodeColors[el.n.arrayIdx];
          const base = el["stroke"];
          return d3.rgb(d3.interpolateRgb(raw, base)(ramp)).toString();
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
    hovered: {d, type: ".branch", x, y}
  });
};

export const onBranchClick = function (d) {
  this.Viewer.fitToViewer();
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
};

/* onBranchLeave called when mouse-off, i.e. anti-hover */
export const onBranchLeave = function (d) {
  for (const id of ["#branch_T_" + d.n.clade, "#branch_S_" + d.n.clade]) {
    this.state.tree.svg.select(id)
      .style("stroke", (el) => el["stroke"]);
  }
  if (this.props.temporalConfidence.exists && this.props.temporalConfidence.display && !this.props.temporalConfidence.on) {
    this.state.tree.removeConfidence(mediumTransitionDuration);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

export const onTipLeave = function (d) {
  if (!this.state.selectedTip) {
    this.state.tree.svg.select("#tip_" + d.n.clade)
      .attr("r", (dd) => dd["r"]);
  }
  if (this.state.hovered) {
    this.setState({hovered: null});
  }
};

/* viewEntireTree: triggered by "reset to entire tree" button */
export const viewEntireTree = function () {
  /* reset the SVGPanZoom */
  this.Viewer.fitToViewer();
  /* imperitively manipulate SVG tree elements */
  this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
  /* update branch thicknesses / tip vis after SVG tree elemtents have moved */
  window.setTimeout(
    () => this.props.dispatch(zoomToClade(0)),
    mediumTransitionDuration
  );
  this.setState({selectedBranch: null, selectedTip: null});
};

/* clearSelectedTip when clicking to go away */
export const clearSelectedTip = function (d) {
  this.state.tree.svg.select("#tip_" + d.n.clade)
    .attr("r", (dd) => dd["r"]);
  this.setState({selectedTip: null, hovered: null});
  /* restore the tip visibility! */
  this.props.dispatch(updateVisibleTipsAndBranchThicknesses());
};

export const handleIconClick = function (tool) {
  return () => {
    const V = this.Viewer.getValue();
    if (tool === "zoom-in") {
      this.Viewer.zoomOnViewerCenter(1.4);
    } else if (V.a > 1.0) { // if there is room to zoom out via the SVGPanZoom, do
      this.Viewer.zoomOnViewerCenter(0.71);
    } else {                // otherwise reset view to have SVG fit the viewer
      resetView.bind(this)();
      // if we have clade zoom, zoom out to the parent clade
      if (this.state.selectedBranch && this.state.selectedBranch.n.arrayIdx) {
        const dp = this.props.dispatch;
        const arrayIdx = this.state.tree.zoomNode.parent.n.arrayIdx;
        // reset the "clicked" branch, unset if we zoomed out all the way to the root
        this.setState({
          hovered: null,
          selectedBranch: (arrayIdx) ? this.state.tree.zoomNode.parent : null
        });
        const makeCallBack = function () {
          return function () {
            dp(updateVisibleTipsAndBranchThicknesses());
          };
        };
        // clear previous timeout bc they potentially mess with the geometry update
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        // call phyloTree to zoom out, this rerenders the geometry
        this.state.tree.zoomToParent(mediumTransitionDuration);
        // wait and reset visibility
        this.timeout = setTimeout(makeCallBack(), mediumTransitionDuration);
      }
    }
    resetGrid.bind(this)();
  };
};


/* functions to do with tip / branch labels */

/**
 * @param  {node} d tree node object
 * @return {string} displayed as label on the branch corresponding to the node
 */
export const branchLabel = function (d) {
  if (d.n.muts) {
    if (d.n.muts.length > 5) {
      return d.n.muts.slice(0, 5).join(", ") + "...";
    }
    return d.n.muts.join(", ");
  }
  return "";
};

/**
 * @param  {node} d tree node object
 * @param  {int} n total number of nodes in current view
 * @return {int} font size of the branch label
 */
export const branchLabelSize = (d, n) =>
  d.leafCount > n / 10.0 ? 12 : 0;

/**
 * @param  {node} d tree node object
 * @param  {int} n total number of nodes in current view
 * @return {int} font size of the tip label
 */
export const tipLabelSize = function (d, n) {
  if (n > 70) {
    return 0;
  } else if (n < 20) {
    return 14;
  }
  const fs = 6 + 8 * (70 - n) / (70 - 20);
  return fs;
};

/**
 * calculate array of HEXs to actually be displayed.
 * (colorBy) confidences manifest as opacity ramps
 * @param {obj} tree phyloTree object
 * @param {bool} confidence enabled?
 * @return {array} array of hex's. 1-1 with nodes.
 */
const calcStrokeCols = (tree, confidence, colorBy) => {
  if (confidence === true) {
    return tree.nodeColors.map((col, idx) => {
      const entropy = tree.nodes[idx].attr[colorBy + "_entropy"];
      return d3.rgb(d3.interpolateRgb(col, branchInterpolateColour)(branchOpacityFunction(entropy))).toString();
    });
  }
  return tree.nodeColors.map((col) => {
    return d3.rgb(d3.interpolateRgb(col, branchInterpolateColour)(branchOpacityConstant)).toString();
  });
};

/**
 * function to help determine what parts of phylotree should update
 * @param {obj} props redux props
 * @param {obj} nextProps next redux props
 * @param {obj} tree phyloTree object
 * @return {obj} values are mostly bools, but not always
 */
export const salientPropChanges = (props, nextProps, tree) => {
  const dataInFlux = !nextProps.tree.datasetGuid && tree;
  const datasetChanged = nextProps.tree.nodes && nextProps.tree.datasetGuid && nextProps.tree.datasetGuid !== props.tree.datasetGuid;
  const firstDataReady = tree === null && nextProps.tree.datasetGuid && nextProps.tree.nodes !== null;

  const visibility = !!nextProps.tree.visibilityVersion && props.tree.visibilityVersion !== nextProps.tree.visibilityVersion
  const tipRadii = !!nextProps.tree.tipRadiiVersion && props.tree.tipRadiiVersion !== nextProps.tree.tipRadiiVersion;
  const colorBy = !!nextProps.tree.nodeColorsVersion &&
      (props.tree.nodeColorsVersion !== nextProps.tree.nodeColorsVersion ||
      nextProps.tree.nodeColorsVersion === 1 ||
      nextProps.colorByConfidence !== props.colorByConfidence);
  const branchThickness = props.tree.branchThicknessVersion !== nextProps.tree.branchThicknessVersion;
  const layout = props.layout !== nextProps.layout;
  const distanceMeasure = props.distanceMeasure !== nextProps.distanceMeasure;

  /* branch labels & confidence use 0: no change, 1: turn off, 2: turn on */
  const branchLabels = props.showBranchLabels === nextProps.showBranchLabels ? 0 : nextProps.showBranchLabels ? 2 : 1;
  const confidence = props.temporalConfidence.on === nextProps.temporalConfidence.on ? 0 : nextProps.temporalConfidence.on ? 2 : 1;

  /* sometimes we may want smooth transitions */
  let branchTransitionTime = false; /* false = no transition. Use when speed is critical */
  let tipTransitionTime = false;
  if (nextProps.colorByConfidence !== props.colorByConfidence) {
    branchTransitionTime = mediumTransitionDuration;
  }

  return {
    dataInFlux,
    datasetChanged,
    firstDataReady,
    visibility,
    tipRadii,
    colorBy,
    layout,
    distanceMeasure,
    branchThickness,
    branchTransitionTime,
    tipTransitionTime,
    branchLabels,
    confidence
  };
};

/**
 * effect (in phyloTree) the necessary style + attr updates
 * @param {obj} changes see salientPropChanges above
 * @param {obj} nextProps next redux props
 * @param {obj} tree phyloTree object
 * @return {null} causes side-effects via phyloTree object
 */
export const updateStylesAndAttrs = (changes, nextProps, tree) => {
  /* the objects storing the changes to make to the tree */
  const tipAttrToUpdate = {};
  const tipStyleToUpdate = {};
  const branchAttrToUpdate = {};
  const branchStyleToUpdate = {};
  let updateConfidenceFlag = false;

  if (changes.visibility) {
    tipStyleToUpdate["visibility"] = nextProps.tree.visibility;
  }
  if (changes.tipRadii) {
    tipAttrToUpdate["r"] = nextProps.tree.tipRadii;
  }
  if (changes.colorBy) {
    tipStyleToUpdate["fill"] = nextProps.tree.nodeColors.map((col) => {
      return d3.rgb(col).brighter([0.65]).toString();
    });
    const branchStrokes = calcStrokeCols(nextProps.tree, nextProps.colorByConfidence, nextProps.colorBy);
    branchStyleToUpdate["stroke"] = branchStrokes;
    tipStyleToUpdate["stroke"] = branchStrokes;
    if (nextProps.temporalConfidence) {
      updateConfidenceFlag = true;
    }
  }
  if (changes.branchThickness) {
    console.log("branch width change detected - update branch stroke-widths")
    branchStyleToUpdate["stroke-width"] = nextProps.tree.branchThickness;
    if (nextProps.temporalConfidence) {
      updateConfidenceFlag = true;
    }
  }

  /* implement style * attr changes */
  if (Object.keys(branchAttrToUpdate).length || Object.keys(branchStyleToUpdate).length) {
    // console.log("applying branch attr", Object.keys(branchAttrToUpdate), "branch style changes", Object.keys(branchStyleToUpdate))
    tree.updateMultipleArray(".branch", branchAttrToUpdate, branchStyleToUpdate, changes.branchTransitionTime);
  }
  if (Object.keys(tipAttrToUpdate).length || Object.keys(tipStyleToUpdate).length) {
    // console.log("applying tip attr", Object.keys(tipAttrToUpdate), "tip style changes", Object.keys(tipStyleToUpdate))
    tree.updateMultipleArray(".tip", tipAttrToUpdate, tipStyleToUpdate, changes.tipTransitionTime);
  }

  if (changes.layout) { /* swap layouts */
    tree.updateLayout(nextProps.layout, mediumTransitionDuration);
  }
  if (changes.distanceMeasure) { /* change distance metrics */
    tree.updateDistance(nextProps.distanceMeasure, mediumTransitionDuration);
  }
  if (changes.branchLabels === 2) {
    tree.showBranchLabels();
  } else if (changes.branchLabels === 1) {
    tree.hideBranchLabels();
  }
  if (changes.confidence === 1) {
    tree.removeConfidence(mediumTransitionDuration);
  } else if (changes.confidence === 2) {
    tree.drawConfidence(mediumTransitionDuration);
  } else if (updateConfidenceFlag) {
    tree.updateConfidence(changes.tipTransitionTime);
  }
};
