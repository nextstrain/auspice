/* eslint-disable no-multi-spaces */
/* eslint-disable space-infix-ops */
import { scaleLinear, ScalePoint, scalePoint } from "d3-scale";
import { timerStart, timerEnd } from "../../../util/perf";
import { getTraitFromNode, getDivFromNode } from "../../../util/treeMiscHelpers";
import { stemParent, nodeOrdering } from "./helpers";
import { numDate } from "../../../util/colorHelpers";
import { Layout, ScatterVariables } from "../../../reducers/controls";
import { ReduxNode, colorBySymbol } from "../../../reducers/tree/types";
import { Distance, Params, PhyloNode, PhyloTreeType, Ripple } from "./types";

/**
 * assigns the attribute this.layout and calls the function that
 * calculates the x,y coordinates for the respective layouts
 */
export const setLayout = function setLayout(
  this: PhyloTreeType,
  layout?: Layout,
  scatterVariables?: ScatterVariables,
): void {
  // console.log("set layout");
  timerStart("setLayout");
  if (typeof layout === "undefined" || layout !== this.layout) {
    this.nodes.forEach((d) => {d.update = true;});
  }
  if (typeof layout === "undefined") {
    this.layout = "rect";
  } else {
    this.layout = layout;
  }

  // remove any regression. This will be recalculated if required.
  this.regression = undefined;

  // assign scatterVariables, needed for clock / scatter layouts.
  // P.S. we overwrite the x & y axis for clock views _only_ within PhyloTree. This allows
  // the scatterplot variables to be remembered while viewing other layouts
  if (scatterVariables) this.scatterVariables = {...scatterVariables};
  if (this.layout === "clock") {
    // @ts-expect-error
    this.scatterVariables.x="num_date";
    // @ts-expect-error
    this.scatterVariables.y="div";
  }

  if (this.layout === "rect") {
    this.rectangularLayout();
  } else if (this.layout === "clock" || this.layout === "scatter") {
    this.scatterplotLayout();
  } else if (this.layout === "radial") {
    this.radialLayout();
  } else if (this.layout === "unrooted") {
    this.unrootedLayout();
  }
  timerEnd("setLayout");
};

/**
 * assignes x,y coordinates for a rectangular layout
 */
export const rectangularLayout = function rectangularLayout(this: PhyloTreeType): void {
  this.nodes.forEach((d) => {
    d.y = d.displayOrder; // precomputed y-values
    d.x = d.depth;    // depth according to current distance
    d.px = d.pDepth;  // parent positions
    d.py = d.y;
    // d.x_conf = d.conf; // assign confidence intervals
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.xCross = d.crossDepth;
      d.yCross = d.y;
    });
  }
};

/**
 * assign x,y coordinates for nodes based upon user-selected variables
 * TODO: timeVsRootToTip is a specific instance of this
 */
export const scatterplotLayout = function scatterplotLayout(this: PhyloTreeType): void {
  if (!this.scatterVariables) {
    console.error("Scatterplot called without variables");
    return;
  }

  const getDisplayOrderPair = (this.scatterVariables.x==="displayOrder" || this.scatterVariables.y==="displayOrder") ?
    nodeOrdering(this.nodes) :
    undefined;

  for (const d of this.nodes) {
    // set x and parent X values
    if (this.scatterVariables.x==="div") {
      d.x = getDivFromNode(d.n);
      d.px = getDivFromNode(stemParent(d.n));
    } else if (this.scatterVariables.x==="gt") {
      d.x = d.n.currentGt;
      d.px = stemParent(d.n).currentGt;
    } else if (this.scatterVariables.x==="displayOrder") {
      // @ts-expect-error
      [d.x, d.px] = getDisplayOrderPair(d);
    } else {
      d.x = getTraitFromNode(d.n, this.scatterVariables.x);
      d.px = getTraitFromNode(stemParent(d.n), this.scatterVariables.x);
      if (this.scatterVariables.xTemporal) {
        [d.x, d.px] = [numDate(d.x), numDate(d.px)]
      }
    }
    // set y and parent  values
    if (this.scatterVariables.y==="div") {
      d.y = getDivFromNode(d.n);
      d.py = getDivFromNode(stemParent(d.n));
    } else if (this.scatterVariables.y==="gt") {
      d.y = d.n.currentGt;
      d.py = stemParent(d.n).currentGt;
    } else if (this.scatterVariables.y==="displayOrder") {
      // @ts-expect-error
      [d.y, d.py] = getDisplayOrderPair(d);
    } else {
      d.y = getTraitFromNode(d.n, this.scatterVariables.y);
      d.py = getTraitFromNode(stemParent(d.n), this.scatterVariables.y);
      if (this.scatterVariables.yTemporal) {
        [d.y, d.py] = [numDate(d.y), numDate(d.py)]
      }
    }
  }

  if (this.vaccines) { /* overlay vaccine cross on tip */
    this.vaccines.forEach((d) => {
      d.xCross = d.x;
      d.yCross = d.y;
    });
  }

  if (this.scatterVariables.showRegression) {
    this.calculateRegression(); // sets this.regression
  }

};


/**
 * Utility function for the unrooted tree layout. See `unrootedLayout` for details.
 */
const unrootedPlaceSubtree = (
  node: PhyloNode,
  totalLeafWeight: number,
): void => {
  // @ts-expect-error
  const branchLength = node.depth - node.pDepth;
  // @ts-expect-error
  node.x = node.px + branchLength * Math.cos(node.tau + node.w * 0.5);
  // @ts-expect-error
  node.y = node.py + branchLength * Math.sin(node.tau + node.w * 0.5);
  let eta = node.tau; // eta is the cumulative angle for the wedges in the layout
  if (node.n.hasChildren) {
    // @ts-expect-error
    for (let i = 0; i < node.n.children.length; i++) {
      // @ts-expect-error
      const ch = node.n.children[i].shell;
      // @ts-expect-error
      ch.w = 2 * Math.PI * leafWeight(ch.n) / totalLeafWeight;
      // @ts-expect-error
      ch.tau = eta;
      // @ts-expect-error
      eta += ch.w;
      // @ts-expect-error
      ch.px = node.x;
      // @ts-expect-error
      ch.py = node.y;
      // @ts-expect-error
      unrootedPlaceSubtree(ch, totalLeafWeight);
    }
  }
};


// TODO
// can't use the .child approach, must use parent stem function
// check internal nodes with 1 child don't increase .w

/**
 * calculates x,y coordinates for the unrooted layout. this is
 * done recursively via a the function unrootedPlaceSubtree
 */
export const unrootedLayout = function unrootedLayout(this: PhyloTreeType): void {
  /* the angle of a branch (i.e. the line leading to the node) is `tau + 0.5*w`
    `tau` stores the previous angle which has been used
    `w` is a measurement of the angle occupied by the clade defined by this node
    `eta` is a temporary variable of `tau` + the `w` of each child visited thus far
  Note 1: we don't consider this.nodes[0] as that's the (unrendered)
          root which holds the subtrees. We instead start by defining the values
          for each subtree's root, which will be used by the children of that root
  Note 2: Angles will start from `eta` as defined below, and then cover ~2*Pi radians
  */
  // @ts-expect-error
  const totalLeafWeight = leafWeight(this.nodes[0].n);
  let eta = 1.5 * Math.PI;
  // @ts-expect-error
  const children = this.nodes[0].n.children; // <Node>
  this.nodes.forEach((d) => { // this shouldn't be necessary
    d.x = undefined;
    d.y = undefined;
    d.px = undefined;
    d.py = undefined;
  });
  // @ts-expect-error
  for (let i = 0; i < children.length; i++) {
    // @ts-expect-error
    const d = children[i].shell; // <PhyloNode>
    // @ts-expect-error
    d.w = 2.0 * Math.PI * leafWeight(d.n) / totalLeafWeight; // angle occupied by entire subtree
    // @ts-expect-error
    if (d.w>0) { // i.e. subtree has tips which should be drawn
      // @ts-expect-error
      const distFromOrigin = d.depth - this.nodes[0].depth;
      // @ts-expect-error
      d.px = distFromOrigin * Math.cos(eta + d.w * 0.5);
      // @ts-expect-error
      d.py = distFromOrigin * Math.sin(eta + d.w * 0.5);
      // @ts-expect-error
      d.tau = eta;
      // @ts-expect-error
      unrootedPlaceSubtree(d, totalLeafWeight);
      // @ts-expect-error
      eta += d.w;
    }
  }
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      // @ts-expect-error
      const bL = d.crossDepth - d.depth;
      // @ts-expect-error
      d.xCross = d.px + bL * Math.cos(d.tau + d.w * 0.5);
      // @ts-expect-error
      d.yCross = d.py + bL * Math.sin(d.tau + d.w * 0.5);
    });
  }
  this.nodes.forEach((d) => { // remove properties which otherwise build up over time
    delete d.tau;
    delete d.w;
  });
};

/**
 * calculates and assigns x,y coordinates for the radial layout.
 * in addition to x,y, this calculates the end-points of the radial
 * arcs and whether that arc is more than pi or not
 */
export const radialLayout = function radialLayout(this: PhyloTreeType): void {
  // @ts-expect-error
  const maxDisplayOrder = Math.max(...this.nodes.map((d) => d.displayOrder).filter((val) => val));
  // @ts-expect-error
  const offset = this.nodes[0].depth;
  this.nodes.forEach((d) => {
    // @ts-expect-error
    const angleCBar1 = 2.0 * 0.95 * Math.PI * d.displayOrderRange[0] / maxDisplayOrder;
    // @ts-expect-error
    const angleCBar2 = 2.0 * 0.95 * Math.PI * d.displayOrderRange[1] / maxDisplayOrder;
    // @ts-expect-error
    d.angle = 2.0 * 0.95 * Math.PI * d.displayOrder / maxDisplayOrder;
    // @ts-expect-error
    d.y = (d.depth - offset) * Math.cos(d.angle);
    // @ts-expect-error
    d.x = (d.depth - offset) * Math.sin(d.angle);
    // @ts-expect-error
    d.py = d.y * (d.pDepth - offset) / (d.depth - offset + 1e-15);
    // @ts-expect-error
    d.px = d.x * (d.pDepth - offset) / (d.depth - offset + 1e-15);
    // @ts-expect-error
    d.yCBarStart = (d.depth - offset) * Math.cos(angleCBar1);
    // @ts-expect-error
    d.xCBarStart = (d.depth - offset) * Math.sin(angleCBar1);
    // @ts-expect-error
    d.yCBarEnd = (d.depth - offset) * Math.cos(angleCBar2);
    // @ts-expect-error
    d.xCBarEnd = (d.depth - offset) * Math.sin(angleCBar2);
    d.smallBigArc = Math.abs(angleCBar2 - angleCBar1) > Math.PI * 1.0;
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      if (this.distance === "div") {
        d.xCross = d.x;
        d.yCross = d.y;
      } else {
        // @ts-expect-error
        d.xCross = (d.crossDepth - offset) * Math.sin(d.angle);
        // @ts-expect-error
        d.yCross = (d.crossDepth - offset) * Math.cos(d.angle);
      }
    });
  }
};

/**
 * set the property that is used as distance along branches
 * this is set to "depth" of each node. depth is later used to
 * calculate coordinates. Parent depth is assigned as well.
 * @sideEffect sets this.distance -> "div" or "num_date"
 */
export const setDistance = function setDistance(
  this: PhyloTreeType,
  distanceAttribute?: Distance,
): void {
  timerStart("setDistance");
  this.nodes.forEach((d) => {d.update = true;});
  if (distanceAttribute) {
    this.distance = distanceAttribute;
  }
  if (!["div", "num_date"].includes(this.distance)) {
    console.error("Tree distance measure not set or invalid. Using `div`.");
    this.distance = "div"; // fallback to div
  }

  // todo - can the following loops be skipped for scatterplots?

  // assign node and parent depth
  if (this.distance === "div") {
    this.nodes.forEach((d) => {
      d.depth = getDivFromNode(d.n);
      d.pDepth = getDivFromNode(stemParent(d.n));
      // @ts-expect-error
      d.conf = [d.depth, d.depth]; // TO DO - shouldn't be needed, never have div confidence...
    });
  } else {
    this.nodes.forEach((d) => {
      d.depth = getTraitFromNode(d.n, "num_date");
      d.pDepth = getTraitFromNode(stemParent(d.n), "num_date");
      d.conf = getTraitFromNode(d.n, "num_date", {confidence: true}) || [d.depth, d.depth];
    });
  }

  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.crossDepth = d.depth;
    });
  }
  timerEnd("setDistance");
};


/**
 * Initializes and sets the range of the scales (this.xScale, this.yScale)
 * which are used to map the x,y coordinates to the screen
 */
export const setScales = function setScales(this: PhyloTreeType): void {

  // @ts-expect-error
  if (this.layout==="scatter" && !this.scatterVariables.xContinuous) {
    this.xScale = scalePoint().round(false).align(0.5).padding(0.5);
  } else {
    this.xScale = scaleLinear();
  }
  // @ts-expect-error
  if (this.layout==="scatter" && !this.scatterVariables.yContinuous) {
    this.yScale = scalePoint().round(false).align(0.5).padding(0.5);
  } else {
    this.yScale = scaleLinear();
  }

  // TODO: access these from d3treeParent so they don't have to be set twice
  const width = parseInt(this.svg.attr("width"), 10);
  const height = parseInt(this.svg.attr("height"), 10);
  if (this.layout === "radial" || this.layout === "unrooted") {
    // Force Square: TODO, harmonize with the map to screen
    const xExtend = width - this.margins.left - this.margins.right;
    const yExtend = height - this.margins.bottom - this.margins.top;
    const minExtend = Math.min(xExtend, yExtend);
    const xSlack = xExtend - minExtend;
    const ySlack = yExtend - minExtend;
    this.xScale.range([0.5 * xSlack + this.margins.left, width - 0.5 * xSlack - this.margins.right]);
    this.yScale.range([0.5 * ySlack + this.margins.top, height - 0.5 * ySlack - this.margins.bottom]);

  } else {
    // for rectangular layout, allow flipping orientation of left/right and top/bottom
    if (this.params.orientation[0] > 0) {
      this.xScale.range([this.margins.left, width - this.margins.right]);
    } else {
      this.xScale.range([width - this.margins.right, this.margins.left]);
    }
    if (this.params.orientation[1] > 0) {
      this.yScale.range([this.margins.top, height - this.margins.bottom]);
    } else {
      this.yScale.range([height - this.margins.bottom, this.margins.top]);
    }
  }
};

/**
* this function sets the xScale, yScale domains and maps precalculated x,y
* coordinates to their places on the screen
*/
export const mapToScreen = function mapToScreen(this: PhyloTreeType): void {
  timerStart("mapToScreen");
  const inViewTerminalNodes = this.nodes.filter((d) => !d.n.hasChildren).filter((d) => d.inView);

  /* set up space (padding) for axes etc, as we don't want the branches & tips to occupy the entire SVG! */
  this.margins = {
    left: (this.layout==="scatter" || this.layout==="clock") ? 40 : 5, // space for y-axis label
    right: 5 + getTipLabelPadding(this.params, inViewTerminalNodes),
    top: this.layout==="radial" ? 10 : 15, // avoid tips rendering behind legend
    bottom: 35 // space for x-axis labels
  };

  /* construct & set the range of the x & y scales */
  this.setScales();
  /* update the clip mask accordingly */
  this.setClipMask();

  /**
   * Select the nodes that we'll use to define the domain of the scales - essentially
   * select which nodes we want to use to define the viewport.
   */
  let nodesInDomain;
  const focusOn = this.focus==='selected' && (this.layout==='rect' || this.layout==='radial');
  const focusNodes = this.focusNodes; // these are calculated by redux thunks / reducers
  /**
   * "focus on selected" limits the axis domains to nodes Auspice will actually render
   * Note: nodes marked as `inView` may be off-screen in this mode
   */
  if (focusOn && focusNodes) {
    nodesInDomain = focusNodes.nodes.map((idx) => this.nodes[idx])
      // @ts-expect-error
      .filter((d) => d.y !== undefined && d.x !== undefined);
  } else {
    /**
     * `inView` nodes are every node which descends from the inViewRootNode - so they include
     * nodes which are filtered out, e.g. because they're beyond the selected date range
     * This is the "normal" auspice viewport behaviour, or maybe the "old fashioned" behaviour...
     */
    nodesInDomain = this.nodes.filter((d) => d.inView && d.y!==undefined && d.x!==undefined);
  }
  
  // @ts-expect-error
  if (this.layout === "scatter" && this.scatterVariables.showBranches === false) {
    // @ts-expect-error
    nodesInDomain = nodesInDomain.filter((d) => !d.n.hasChildren);
  }

  /* Compute the domains to pass to the d3 scales for the x & y axes */
  let xDomain, yDomain, spanX, spanY;
  // @ts-expect-error
  if (this.layout!=="scatter" || this.scatterVariables.xContinuous) {
    let [minX, maxX] = [1000000, -100000];
    nodesInDomain.forEach((d) => {
      // @ts-expect-error
      if (d.x < minX) minX = d.x;
      // @ts-expect-error
      if (d.x > maxX) maxX = d.x;
    });
    /* fixes state of 0 length domain */
    // @ts-expect-error
    if (minX === maxX && !(this.params.showStreamTrees && nodesInDomain[0].n.streamName)) {
      minX -= 0.005;
      maxX += 0.005;
    }
    /* Don't allow tiny x-axis domains -- e.g. if zoomed into a polytomy where the
    divergence values are all tiny, then we don't want to display the tree topology */
    const minimumXAxisSpan = 1E-8;
    spanX = maxX-minX;
    if (spanX < minimumXAxisSpan) {
      maxX = minimumXAxisSpan - minX;
      spanX = minimumXAxisSpan;
    }
    /* In rectangular mode, if the tree has been zoomed, leave some room to display the (clade's) root branch */
    if (this.layout==="rect" && this.zoomNode.n.arrayIdx!==0) {
      minX -= (maxX-minX)/20; // 5%
    }
    xDomain = [minX, maxX];
  } else {
    // @ts-expect-error
    const seenValues = new Set(nodesInDomain.map((d) => d.x));
    // @ts-expect-error
    xDomain = this.scatterVariables.xDomain.filter((v) => seenValues.has(v));
    // @ts-expect-error
    padCategoricalScales(xDomain, this.xScale);
  }

  // @ts-expect-error
  if (this.layout!=="scatter" || this.scatterVariables.yContinuous) {
    let [minY, maxY] = [1000000, -100000];
    nodesInDomain.forEach((d) => {
      // @ts-expect-error
      if (d.y < minY) minY = d.y;
      // @ts-expect-error
      if (d.y > maxY) maxY = d.y;
    });
    /* slightly pad min and max y to account for small clades */
    if (inViewTerminalNodes.length < 30) {
      const delta = 0.05 * (maxY - minY);
      minY -= delta;
      maxY += delta;
    }
    spanY = maxY-minY;
    yDomain = [minY, maxY];
  } else {
    // @ts-expect-error
    const seenValues = new Set(nodesInDomain.map((d) => d.y));
    // @ts-expect-error
    yDomain = this.scatterVariables.yDomain.filter((v) => seenValues.has(v));
    // @ts-expect-error
    padCategoricalScales(yDomain, this.yScale);
  }

  /* Radial / Unrooted layouts need to be square since branch lengths
  depend on this */
  if (this.layout === "radial" || this.layout === "unrooted") {
    // @ts-expect-error
    const maxSpan = Math.max(spanY, spanX);
    // @ts-expect-error
    const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
    // @ts-expect-error
    const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
    // @ts-expect-error
    xDomain = [xDomain[0]-xSlack, xDomain[0]+maxSpan-xSlack];
    // @ts-expect-error
    yDomain = [yDomain[0]-ySlack, yDomain[0]+maxSpan-ySlack];
  }
  /* Clock & Scatter plots flip the yDomain */
  if (this.layout === "clock" || this.layout === "scatter") {
    yDomain.reverse();
  }

  /**
   * The above approach doesn't include nodes which are in streams and so
   * streams may currently be outside the x/y domains
   */
  if (this.params.showStreamTrees) {
    // @ts-expect-error
    for (const stream of Object.values(this.streams)) {
      const node = this.nodes[stream.startNode];
      // @ts-expect-error
      if (!node.inView) continue;

      // @ts-expect-error
      const pivots = node.n.streamPivots;
      // @ts-expect-error
      if (pivots.at(0) < xDomain[0]) xDomain[0] = pivots.at(0);
      // @ts-expect-error
      if (pivots.at(-1) > xDomain[1]) xDomain[1] = pivots.at(-1);

      // @ts-expect-error
      if (node.displayOrderRange[0] < yDomain[0]) yDomain[0] = node.displayOrderRange[0];
      // @ts-expect-error
      if (node.displayOrderRange[1] > yDomain[1]) yDomain[1] = node.displayOrderRange[1];
    }
  }

  this.xScale.domain(xDomain);
  this.yScale.domain(yDomain);

  const hiddenYPosition = this.yScale.range()[1] + 100;
  const hiddenXPosition = this.xScale.range()[0] - 100;

  // pass all x,y through scales and assign to xTip, xBase
  this.nodes.forEach((d) => {
    d.xTip = this.xScale(d.x);
    d.yTip = this.yScale(d.y);
    d.xBase = this.xScale(d.px);
    d.yBase = this.yScale(d.py);
    // @ts-expect-error
    d.rot = Math.atan2(d.yTip-d.yBase, d.xTip-d.xBase) * 180/Math.PI;
  });
  // for scatterplots we do an additional iteration as some values may be missing
  // & we want to avoid rendering these
  if (this.layout==="scatter") {
    // @ts-expect-error
    if (!this.scatterVariables.yContinuous) jitter("y", this.yScale, this.nodes);
    // @ts-expect-error
    if (!this.scatterVariables.xContinuous) jitter("x", this.xScale, this.nodes);
    this.nodes.forEach((d) => {
      // @ts-expect-error
      if (isNaN(d.xTip)) d.xTip = hiddenXPosition;
      // @ts-expect-error
      if (isNaN(d.yTip)) d.yTip=hiddenYPosition;
      // @ts-expect-error
      if (isNaN(d.xBase)) d.xBase=hiddenXPosition;
      // @ts-expect-error
      if (isNaN(d.yBase)) d.yBase=hiddenYPosition;
    });
  }
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      const n = 6; /* half the number of pixels that the cross will take up */
      const xTipCross = this.xScale(d.xCross); /* x position of the center of the cross */
      const yTipCross = this.yScale(d.yCross); /* x position of the center of the cross */
      d.vaccineCross = ` M ${xTipCross-n},${yTipCross-n} L ${xTipCross+n},${yTipCross+n} M ${xTipCross-n},${yTipCross+n} L ${xTipCross+n},${yTipCross-n}`;
    });
  }

  // assign the branches as path to each node for the different layouts
  if (this.layout==="unrooted") {
    this.nodes.forEach((d) => {
      // @ts-expect-error
      d.branch = [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
    });
  } else if (this.layout==="clock" || this.layout==="scatter") {
    // if nodes are deliberately obscured (as traits may not be set for some nodes), we don't want to render branches joining that node
    // @ts-expect-error
    if (this.scatterVariables.showBranches) {
      this.nodes.forEach((d) => {
        d.branch = d.xBase===hiddenXPosition || d.xTip===hiddenXPosition || d.yBase===hiddenYPosition || d.yTip===hiddenYPosition ?
          ["", ""] :
          // @ts-expect-error
          [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
      });
    } else {
      this.nodes.forEach((d) => {d.branch=["", ""];});
    }
  } else if (this.layout==="rect") {
    this.nodes.forEach((d) => { // d is a <PhyloNode>
      // @ts-expect-error
      const stem_offset = 0.5*(stemParent(d.n).shell["stroke-width"] - d["stroke-width"]) || 0.0;
      // @ts-expect-error
      const stemRange = [this.yScale(d.displayOrderRange[0]), this.yScale(d.displayOrderRange[1])];
      // Note that a branch cannot be perfectly horizontal and also have a (linear) gradient applied to it
      // So we add a tiny amount of jitter (e.g 1/1000px) to the horizontal line (d.branch[0])
      // see https://stackoverflow.com/questions/13223636/svg-gradient-for-perfectly-horizontal-path
      d.branch =[
        // @ts-expect-error
        ` M ${d.xBase - stem_offset},${d.yBase} L ${d.xTip},${d.yTip+0.01}`,
        ` M ${d.xTip},${stemRange[0]} L ${d.xTip},${stemRange[1]}`
      ];
      if (this.params.confidence) {
        // @ts-expect-error
        d.confLine =` M ${this.xScale(d.conf[0])},${d.yBase} L ${this.xScale(d.conf[1])},${d.yTip}`;
      }
    });
  } else if (this.layout==="radial") {
    // @ts-expect-error
    const offset = this.nodes[0].depth;
    // @ts-expect-error
    const stem_offset_radial = this.nodes.map((d) => {return (0.5*(stemParent(d.n).shell["stroke-width"] - d["stroke-width"]) || 0.0);});
    this.nodes.forEach((d, i) => {
      d.branch =[
        // @ts-expect-error
        " M "+(d.xBase-stem_offset_radial[i]*Math.sin(d.angle)).toString() +
        // @ts-expect-error
        " "+(d.yBase-stem_offset_radial[i]*Math.cos(d.angle)).toString() +
        // @ts-expect-error
        " L "+d.xTip.toString()+" "+d.yTip.toString(), ""
      ];
      if (d.n.hasChildren) {
        d.branch[1] = " M "+this.xScale(d.xCBarStart).toString()+" "+this.yScale(d.yCBarStart).toString()+
        " A "+(this.xScale(d.depth)-this.xScale(offset)).toString()+" "+
        (this.yScale(d.depth)-this.yScale(offset)).toString()+
        " 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
        " "+this.xScale(d.xCBarEnd).toString()+","+this.yScale(d.yCBarEnd).toString();
      }
    });
  }
  /* map any streams to pixel space */
  if (this.params.showStreamTrees) {
    this.mapStreamsToScreen()
  }
};

/**
 * Maps the pivot space (x) and displayOrderSpace (y) into pixel space for each stream.
 * 
 * Creates `node.streamRipples` on the start node of each stream by transforming the node's `rippleDisplayOrders`
 * and `streamPivots` by the d3 scales.
 */
export function mapStreamsToScreen(this: PhyloTreeType): void {
  // @ts-expect-error
  for (const stream of Object.values(this.streams)) {
    const node = this.nodes[stream.startNode];
    // @ts-expect-error
    node.streamRipples = node.rippleDisplayOrders.map((displayOrderByPivot, categoryIdx) => {
      const datum: Ripple = Object.assign(
        [], 
        displayOrderByPivot.map(([min,max], pivotIdx) => {
          return {
            // @ts-expect-error
            x: this.xScale(node.n.streamPivots[pivotIdx]),
            y0: this.yScale(min),
            y1: this.yScale(max),
          }
        }),
        /* we define a key for d3 to use which allows ribbons to morph as needed and be created/destroyed as needed */
        // @ts-expect-error
        {key: node.n.streamCategories[categoryIdx].name+"_"+this.streams[colorBySymbol]}  // aka the name of the ripple
      );
      return datum;
    });
  }
}

const JITTER_MIN_STEP_SIZE = 50; // pixels

function padCategoricalScales(
  domain: string[],
  scale: ScalePoint<string>,
): ScalePoint<string> {
  if (scale.step() > JITTER_MIN_STEP_SIZE) return scale.padding(0.5); // balanced padding when we can jitter
  if (domain.length<=4) return scale.padding(0.4);
  if (domain.length<=6) return scale.padding(0.3);
  if (domain.length<=10) return scale.padding(0.2);
  return scale.padding(0.1);
}

/**
 * Add jitter to the already-computed node positions.
 */
function jitter(
  axis: "x" | "y",
  scale: ScalePoint<string>,
  nodes: PhyloNode[],
): void {
  const step = scale.step();
  if (scale.step() <= JITTER_MIN_STEP_SIZE) return;
  const rand: number[] = []; // pre-compute a small set of pseudo random numbers for speed
  for (let i=1e2; i--;) {
    rand.push((Math.random()-0.5)*step*0.5); // occupy 50%
  }
  const [base, tip, randLen] = [`${axis}Base`, `${axis}Tip`, rand.length];
  let j = 0;
  function recurse(phyloNode: PhyloNode): void {
    // @ts-expect-error
    phyloNode[base] = stemParent(phyloNode.n).shell[tip];
    // @ts-expect-error
    phyloNode[tip] += rand[j++];
    if (j>=randLen) j=0;
    if (!phyloNode.n.hasChildren) return;
    // @ts-expect-error
    for (const child of phyloNode.n.children) recurse(child.shell);
  }
  // @ts-expect-error
  recurse(nodes[0]);
}


function getTipLabelPadding(
  params: Params,
  inViewTerminalNodes: PhyloNode[],
): number {
  let padBy = 0;
  if (inViewTerminalNodes.length < params.tipLabelBreakL1) {

    let fontSize = params.tipLabelFontSizeL1;
    if (inViewTerminalNodes.length < params.tipLabelBreakL2) {
      fontSize = params.tipLabelFontSizeL2;
    }
    if (inViewTerminalNodes.length < params.tipLabelBreakL3) {
      fontSize = params.tipLabelFontSizeL3;
    }

    inViewTerminalNodes.forEach((d) => {
      // @ts-expect-error
      if (padBy < d.n.name.length) {
        // @ts-expect-error
        padBy = 0.65 * d.n.name.length * fontSize;
      }
    });
  }
  return padBy;
}

function leafWeight(node: ReduxNode): number {
  // @ts-expect-error
  return node.tipCount + 0.15*(node.fullTipCount-node.tipCount);
}
