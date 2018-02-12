/* eslint-disable no-multi-spaces */
import { min, sum } from "d3-array";
import { addLeafCount } from "./helpers";
import { timerStart, timerEnd } from "../../../util/perf";

/**
 * assigns the attribute this.layout and calls the function that
 * calculates the x,y coordinates for the respective layouts
 * @param layout -- the layout to be used, has to be one of
 *                  ["rect", "radial", "unrooted", "clock"]
 */
export const setLayout = function setLayout(layout) {
  timerStart("setLayout");
  if (typeof layout === "undefined" || layout !== this.layout) {
    this.nodes.forEach((d) => {d.update = true;});
  }
  if (typeof layout === "undefined") {
    this.layout = "rect";
  } else {
    this.layout = layout;
  }
  if (this.layout === "rect") {
    this.rectangularLayout();
  } else if (this.layout === "clock") {
    this.timeVsRootToTip();
  } else if (this.layout === "radial") {
    this.radialLayout();
  } else if (this.layout === "unrooted") {
    this.unrootedLayout();
  }
  timerEnd("setLayout");
};


/**
 * assignes x,y coordinates for a rectancular layout
 * @return {null}
 */
export const rectangularLayout = function rectangularLayout() {
  this.nodes.forEach((d) => {
    d.y = d.n.yvalue; // precomputed y-values
    d.x = d.depth;    // depth according to current distance
    d.px = d.pDepth;  // parent positions
    d.py = d.y;
    d.x_conf = d.conf; // assign confidence intervals
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.xCross = d.crossDepth;
    });
  }
};

/**
 * assign x,y coordinates fro the root-to-tip regression layout
 * this requires a time tree with attr["num_date"] set
 * in addition, this function calculates a regression between
 * num_date and div which is saved as this.regression
 * @return {null}
 */
export const timeVsRootToTip = function timeVsRootToTip() {
  this.nodes.forEach((d) => {
    d.y = d.n.attr["div"];
    d.x = d.n.attr["num_date"];
    d.px = d.n.parent.attr["num_date"];
    d.py = d.n.parent.attr["div"];
  });
  if (this.vaccines) { /* where the tips should be */
    this.vaccines.forEach((d) => {d.xCross = d.x;});
  }
  const nTips = this.numberOfTips;
  // REGRESSION WITH FREE INTERCEPT
  // const meanDiv = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>d.y))/nTips;
  // const meanTime = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>d.depth))/nTips;
  // const covarTimeDiv = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.y-meanDiv)*(d.depth-meanTime)))/nTips;
  // const varTime = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.depth-meanTime)*(d.depth-meanTime)))/nTips;
  // const slope = covarTimeDiv/varTime;
  // const intercept = meanDiv-meanTime*slope;
  // REGRESSION THROUGH ROOT
  const offset = this.nodes[0].depth;
  const XY = sum(
    this.nodes.filter((d) => d.terminal)
      .map((d) => (d.y) * (d.depth - offset))
  ) / nTips;
  const secondMomentTime = sum(
    this.nodes.filter((d) => d.terminal)
      .map((d) => (d.depth - offset) * (d.depth - offset))
  ) / nTips;
  const slope = XY / secondMomentTime;
  const intercept = -offset * slope;
  this.regression = {slope: slope, intercept: intercept};
};

/*
 * Utility function for the unrooted tree layout.
 * assigns x,y coordinates to the subtree starting in node
 * @params:
 *   node -- root of the subtree.
 *   nTips -- total number of tips in the tree.
 */
const unrootedPlaceSubtree = (node, nTips) => {
  node.x = node.px + node.branchLength * Math.cos(node.tau + node.w * 0.5);
  node.y = node.py + node.branchLength * Math.sin(node.tau + node.w * 0.5);
  let eta = node.tau; // eta is the cumulative angle for the wedges in the layout
  if (!node.terminal) {
    for (let i = 0; i < node.children.length; i++) {
      const ch = node.children[i];
      ch.w = 2 * Math.PI * ch.leafCount / nTips;
      ch.tau = eta;
      eta += ch.w;
      ch.px = node.x;
      ch.py = node.y;
      unrootedPlaceSubtree(ch, nTips);
    }
  }
};


/**
 * calculates x,y coordinates for the unrooted layout. this is
 * done recursively via a the function unrootedPlaceSubtree
 * @return {null}
 */
export const unrootedLayout = function unrootedLayout() {
  const nTips = this.numberOfTips;
  // postorder iteration to determine leaf count of every node
  addLeafCount(this.nodes[0]);
  // calculate branch length from depth
  this.nodes.forEach((d) => {d.branchLength = d.depth - d.pDepth;});
  // preorder iteration to layout nodes
  this.nodes[0].x = 0;
  this.nodes[0].y = 0;
  this.nodes[0].px = 0;
  this.nodes[0].py = 0;
  this.nodes[0].w = 2 * Math.PI;
  this.nodes[0].tau = 0;
  let eta = 1.5 * Math.PI;
  for (let i = 0; i < this.nodes[0].children.length; i++) {
    this.nodes[0].children[i].px = 0;
    this.nodes[0].children[i].py = 0;
    this.nodes[0].children[i].w = 2.0 * Math.PI * this.nodes[0].children[i].leafCount / nTips;
    this.nodes[0].children[i].tau = eta;
    eta += this.nodes[0].children[i].w;
    unrootedPlaceSubtree(this.nodes[0].children[i], nTips);
  }
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.xCross = d.x;
    });
  }
};

/**
 * calculates and assigns x,y coordinates for the radial layout.
 * in addition to x,y, this calculates the end-points of the radial
 * arcs and whether that arc is more than pi or not
 * @return {null}
 */
export const radialLayout = function radialLayout() {
  const nTips = this.numberOfTips;
  const offset = this.nodes[0].depth;
  this.nodes.forEach((d) => {
    const angleCBar1 = 2.0 * 0.95 * Math.PI * d.yRange[0] / nTips;
    const angleCBar2 = 2.0 * 0.95 * Math.PI * d.yRange[1] / nTips;
    d.angle = 2.0 * 0.95 * Math.PI * d.n.yvalue / nTips;
    d.y = (d.depth - offset) * Math.cos(d.angle);
    d.x = (d.depth - offset) * Math.sin(d.angle);
    d.py = d.y * (d.pDepth - offset) / (d.depth - offset + 1e-15);
    d.px = d.x * (d.pDepth - offset) / (d.depth - offset + 1e-15);
    d.yCBarStart = (d.depth - offset) * Math.cos(angleCBar1);
    d.xCBarStart = (d.depth - offset) * Math.sin(angleCBar1);
    d.yCBarEnd = (d.depth - offset) * Math.cos(angleCBar2);
    d.xCBarEnd = (d.depth - offset) * Math.sin(angleCBar2);
    d.smallBigArc = Math.abs(angleCBar2 - angleCBar1) > Math.PI * 1.0;
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.xCross = (d.crossDepth - offset) * Math.sin(d.angle);
    });
  }
};

/*
 * set the property that is used as distance along branches
 * this is set to "depth" of each node. depth is later used to
 * calculate coordinates. Parent depth is assigned as well.
 */
export const setDistance = function setDistance(distanceAttribute) {
  timerStart("setDistance");
  this.nodes.forEach((d) => {d.update = true;});
  if (typeof distanceAttribute === "undefined") {
    this.distance = "div"; // default is "div" for divergence
  } else {
    this.distance = distanceAttribute;
  }
  // assign node and parent depth
  const tmp_dist = this.distance;
  this.nodes.forEach((d) => {
    d.depth = d.n.attr[tmp_dist];
    d.pDepth = d.n.parent.attr[tmp_dist];
    if (d.n.attr[tmp_dist + "_confidence"]) {
      d.conf = d.n.attr[tmp_dist + "_confidence"];
    } else {
      d.conf = [d.depth, d.depth];
    }
  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      d.crossDepth = tmp_dist === "div" ? d.depth : d.n.vaccineDateNumeric;
    });
  }
  timerEnd("setDistance");
};


/**
 * sets the range of the scales used to map the x,y coordinates to the screen
 * @param {margins} -- object with "right, left, top, bottom" margins
 */
export const setScales = function setScales(margins) {
  const width = parseInt(this.svg.attr("width"), 10);
  const height = parseInt(this.svg.attr("height"), 10);
  if (this.layout === "radial" || this.layout === "unrooted") {
    // Force Square: TODO, harmonize with the map to screen
    const xExtend = width - (margins["left"] || 0) - (margins["right"] || 0);
    const yExtend = height - (margins["top"] || 0) - (margins["top"] || 0);
    const minExtend = min([xExtend, yExtend]);
    const xSlack = xExtend - minExtend;
    const ySlack = yExtend - minExtend;
    this.xScale.range([0.5 * xSlack + margins["left"] || 0, width - 0.5 * xSlack - (margins["right"] || 0)]);
    this.yScale.range([0.5 * ySlack + margins["top"] || 0, height - 0.5 * ySlack - (margins["bottom"] || 0)]);

  } else {
    // for rectancular layout, allow flipping orientation of left right and top/botton
    if (this.params.orientation[0] > 0) {
      this.xScale.range([margins["left"] || 0, width - (margins["right"] || 0)]);
    } else {
      this.xScale.range([width - (margins["right"] || 0), margins["left"] || 0]);
    }
    if (this.params.orientation[1] > 0) {
      this.yScale.range([margins["top"] || 0, height - (margins["bottom"] || 0)]);
    } else {
      this.yScale.range([height - (margins["bottom"] || 0), margins["top"] || 0]);
    }
  }
};
