/* eslint-disable no-multi-spaces */
/* eslint-disable space-infix-ops */
import { min, max, sum } from "d3-array";
import { addLeafCount } from "./helpers";
import { timerStart, timerEnd } from "../../../util/perf";
import { getTraitFromNode, getDivFromNode } from "../../../util/treeMiscHelpers";

/**
 * assigns the attribute this.layout and calls the function that
 * calculates the x,y coordinates for the respective layouts
 * @param layout -- the layout to be used, has to be one of
 *                  ["rect", "radial", "unrooted", "clock"]
 */
export const setLayout = function setLayout(layout) {
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
 * assign x,y coordinates fro the root-to-tip regression layout
 * this requires a time tree with `num_date` info set
 * in addition, this function calculates a regression between
 * num_date and div which is saved as this.regression
 * @return {null}
 */
export const timeVsRootToTip = function timeVsRootToTip() {
  this.nodes.forEach((d) => {
    d.y = getDivFromNode(d.n);
    d.x = getTraitFromNode(d.n, "num_date");
    d.px = getTraitFromNode(d.n.parent, "num_date");
    d.py = getDivFromNode(d.n.parent);
  });
  if (this.vaccines) { /* overlay vaccine cross on tip */
    this.vaccines.forEach((d) => {
      d.xCross = d.x;
      d.yCross = d.y;
    });
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

  // postorder iteration to determine leaf count of every node
  addLeafCount(this.nodes[0]);
  const nTips = this.nodes[0].leafCount;

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
      const bL = d.crossDepth - d.depth;
      d.xCross = d.px + bL * Math.cos(d.tau + d.w * 0.5);
      d.yCross = d.py + bL * Math.sin(d.tau + d.w * 0.5);
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
      if (this.distance === "div") {
        d.xCross = d.x;
        d.yCross = d.y;
      } else {
        d.xCross = (d.crossDepth - offset) * Math.sin(d.angle);
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
export const setDistance = function setDistance(distanceAttribute) {
  timerStart("setDistance");
  this.nodes.forEach((d) => {d.update = true;});
  this.distance = distanceAttribute || "div"; // div is default

  // assign node and parent depth
  if (this.distance === "div") {
    this.nodes.forEach((d) => {
      d.depth = getDivFromNode(d.n);
      d.pDepth = getDivFromNode(d.n.parent);
      d.conf = [d.depth, d.depth]; // TO DO - shouldn't be needed, never have div confidence...
    });
  } else {
    this.nodes.forEach((d) => {
      d.depth = getTraitFromNode(d.n, "num_date");
      d.pDepth = getTraitFromNode(d.n.parent, "num_date");
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

/**
* this function sets the xScale, yScale domains and maps precalculated x,y
* coordinates to their places on the screen
* @return {null}
*/
export const mapToScreen = function mapToScreen() {
  timerStart("mapToScreen");

  /* pad margins if tip labels are visible */
  /* padding width based on character count */
  const tmpMargins = {
    left: this.params.margins.left,
    right: this.params.margins.right,
    top: this.params.margins.top,
    bottom: this.params.margins.bottom};
  const inViewTerminalNodes = this.nodes.filter((d) => d.terminal).filter((d) => d.inView);
  if (inViewTerminalNodes.length < this.params.tipLabelBreakL1) {

    let fontSize = this.params.tipLabelFontSizeL1;
    if (inViewTerminalNodes.length < this.params.tipLabelBreakL2) {
      fontSize = this.params.tipLabelFontSizeL2;
    }
    if (inViewTerminalNodes.length < this.params.tipLabelBreakL3) {
      fontSize = this.params.tipLabelFontSizeL3;
    }

    let padBy = 0;
    inViewTerminalNodes.forEach((d) => {
      if (padBy < d.n.name.length) {
        padBy = 0.65 * d.n.name.length * fontSize;
      }
    });
    tmpMargins.right += padBy;
  }

  /* set the range of the x & y scales */
  this.setScales(tmpMargins);

  /* find minimum & maximum x & y values */
  let [minY, maxY, minX, maxX] = [1000000, 0, 1000000, 0];
  this.nodes.filter((d) => d.inView).forEach((d) => {
    if (d.x > maxX) maxX = d.x;
    if (d.y > maxY) maxY = d.y;
    if (d.x < minX) minX = d.x;
    if (d.y < minY) minY = d.y;
  });

  /* fixes state of 0 length domain */
  if (minX === maxX) {
    minX -= 0.005;
    maxX += 0.005;
  }

  /* slightly pad min and max y to account for small clades */
  if (inViewTerminalNodes.length < 30) {
    const delta = 0.05 * (maxY - minY);
    minY -= delta;
    maxY += delta;
  }

  /* Don't allow tiny x-axis domains -- e.g. if zoomed into a polytomy where the
  divergence values are all tiny, then we don't want to display the tree topology */
  const minimumXAxisSpan = 1E-8;
  let spanX = maxX-minX;
  if (spanX < minimumXAxisSpan) {
    maxX = minimumXAxisSpan - minX;
    spanX = minimumXAxisSpan;
  }

  /* set the domain of the x & y scales */
  if (this.layout === "radial" || this.layout === "unrooted") {
    // handle "radial and unrooted differently since they need to be square
    // since branch length move in x and y direction
    // TODO: should be tied to svg dimensions
    const spanY = maxY-minY;
    const maxSpan = max([spanY, spanX]);
    const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
    const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
    this.xScale.domain([minX-xSlack, minX+maxSpan-xSlack]);
    this.yScale.domain([minY-ySlack, minY+maxSpan-ySlack]);
  } else if (this.layout==="clock") {
    // same as rectangular, but flipped yscale
    this.xScale.domain([minX, maxX]);
    this.yScale.domain([maxY, minY]);
  } else { // rectangular
    this.xScale.domain([minX, maxX]);
    this.yScale.domain([minY, maxY]);
  }

  // pass all x,y through scales and assign to xTip, xBase
  this.nodes.forEach((d) => {
    d.xTip = this.xScale(d.x);
    d.yTip = this.yScale(d.y);
    d.xBase = this.xScale(d.px);
    d.yBase = this.yScale(d.py);

    d.rot = Math.atan2(d.yTip-d.yBase, d.xTip-d.xBase) * 180/Math.PI;

  });
  if (this.vaccines) {
    this.vaccines.forEach((d) => {
      const n = 6; /* half the number of pixels that the cross will take up */
      const xTipCross = this.xScale(d.xCross); /* x position of the center of the cross */
      const yTipCross = this.yScale(d.yCross); /* x position of the center of the cross */
      d.vaccineCross = ` M ${xTipCross-n},${yTipCross-n} L ${xTipCross+n},${yTipCross+n} M ${xTipCross-n},${yTipCross+n} L ${xTipCross+n},${yTipCross-n}`;
    });
  }

  // assign the branches as path to each node for the different layouts
  if (this.layout==="clock" || this.layout==="unrooted") {
    this.nodes.forEach((d) => {
      d.branch = [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
    });
  } else if (this.layout==="rect") {
    this.nodes.forEach((d) => {
      const stem_offset = 0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0;
      const childrenY = [this.yScale(d.yRange[0]), this.yScale(d.yRange[1])];
      // Note that a branch cannot be perfectly horizontal and also have a (linear) gradient applied to it
      // So we add a tiny amount of jitter (e.g 1/1000px) to the horizontal line (d.branch[0])
      // see https://stackoverflow.com/questions/13223636/svg-gradient-for-perfectly-horizontal-path
      d.branch =[
        [` M ${d.xBase - stem_offset},${d.yBase} L ${d.xTip},${d.yTip+0.01}`],
        [` M ${d.xTip},${childrenY[0]} L ${d.xTip},${childrenY[1]}`]
      ];
      if (this.params.confidence) {
        d.confLine =` M ${this.xScale(d.conf[0])},${d.yBase} L ${this.xScale(d.conf[1])},${d.yTip}`;
      }
    });
  } else if (this.layout==="radial") {
    const offset = this.nodes[0].depth;
    const stem_offset_radial = this.nodes.map((d) => {return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
    this.nodes.forEach((d) => {d.cBarStart = this.yScale(d.yRange[0]);});
    this.nodes.forEach((d) => {d.cBarEnd = this.yScale(d.yRange[1]);});
    this.nodes.forEach((d, i) => {
      d.branch =[
        " M "+(d.xBase-stem_offset_radial[i]*Math.sin(d.angle)).toString() +
        " "+(d.yBase-stem_offset_radial[i]*Math.cos(d.angle)).toString() +
        " L "+d.xTip.toString()+" "+d.yTip.toString(), ""
      ];
      if (!d.terminal) {
        d.branch[1] =[" M "+this.xScale(d.xCBarStart).toString()+" "+this.yScale(d.yCBarStart).toString()+
        " A "+(this.xScale(d.depth)-this.xScale(offset)).toString()+" "+
        (this.yScale(d.depth)-this.yScale(offset)).toString()+
        " 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
        " "+this.xScale(d.xCBarEnd).toString()+","+this.yScale(d.yCBarEnd).toString()];
      }
    });
  }
  timerEnd("mapToScreen");
};
