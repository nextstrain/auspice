/* eslint-disable no-multi-spaces */
/* eslint-disable space-infix-ops */
import { min, max } from "d3-array";
import scaleLinear from "d3-scale/src/linear";
import {point as scalePoint} from "d3-scale/src/band";
import { addLeafCount} from "./helpers";
import { calculateRegressionThroughRoot, calculateRegressionWithFreeIntercept } from "./regression";
import { timerStart, timerEnd } from "../../../util/perf";
import { getTraitFromNode, getDivFromNode } from "../../../util/treeMiscHelpers";

/**
 * assigns the attribute this.layout and calls the function that
 * calculates the x,y coordinates for the respective layouts
 * @param layout -- the layout to be used, has to be one of
 *                  ["rect", "radial", "unrooted", "clock", "scatter"]
 */
export const setLayout = function setLayout(layout, scatterVariables) {
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
    this.scatterVariables.x="num_date";
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
 * assign x,y coordinates for nodes based upon user-selected variables
 * TODO: timeVsRootToTip is a specific instance of this
 */
export const scatterplotLayout = function scatterplotLayout() {
  if (!this.scatterVariables) {
    console.error("Scatterplot called without variables");
    return;
  }

  this.nodes.forEach((d) => {
    // set x and parent X values
    if (this.scatterVariables.x==="div") {
      d.x = getDivFromNode(d.n);
      d.px = getDivFromNode(d.n.parent);
    } else if (this.scatterVariables.x==="gt") {
      d.x = d.n.currentGt;
      d.px = d.n.parent.currentGt;
    } else {
      d.x = getTraitFromNode(d.n, this.scatterVariables.x);
      d.px = getTraitFromNode(d.n.parent, this.scatterVariables.x);
    }
    // set y and parent  values
    if (this.scatterVariables.y==="div") {
      d.y = getDivFromNode(d.n);
      d.py = getDivFromNode(d.n.parent);
    } else if (this.scatterVariables.y==="gt") {
      d.y = d.n.currentGt;
      d.py = d.n.parent.currentGt;
    } else {
      d.y = getTraitFromNode(d.n, this.scatterVariables.y);
      d.py = getTraitFromNode(d.n.parent, this.scatterVariables.y);
    }
  });

  if (this.vaccines) { /* overlay vaccine cross on tip */
    this.vaccines.forEach((d) => {
      d.xCross = d.x;
      d.yCross = d.y;
    });
  }

  if (this.scatterVariables.showRegression) {
    if (this.layout==="clock") {
      this.regression = calculateRegressionThroughRoot(this.nodes);
    } else {
      this.regression = calculateRegressionWithFreeIntercept(this.nodes);
    }
  }

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
 * Initializes and sets the range of the scales (this.xScale, this.yScale)
 * which are used to map the x,y coordinates to the screen
 * @param {margins} -- object with "right, left, top, bottom" margins
 */
export const setScales = function setScales() {

  if (this.layout==="scatter" && !this.scatterVariables.xContinuous) {
    this.xScale = scalePoint().round(false).align(0.5).padding(0.5);
  } else {
    this.xScale = scaleLinear();
  }
  if (this.layout==="scatter" && !this.scatterVariables.yContinuous) {
    this.yScale = scalePoint().round(false).align(0.5).padding(0.5);
  } else {
    this.yScale = scaleLinear();
  }

  const width = parseInt(this.svg.attr("width"), 10);
  const height = parseInt(this.svg.attr("height"), 10);
  if (this.layout === "radial" || this.layout === "unrooted") {
    // Force Square: TODO, harmonize with the map to screen
    const xExtend = width - this.margins.left - this.margins.right;
    const yExtend = height - this.margins.bottom - this.margins.top;
    const minExtend = min([xExtend, yExtend]);
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
* @return {null}
*/
export const mapToScreen = function mapToScreen() {
  timerStart("mapToScreen");

  const inViewTerminalNodes = this.nodes.filter((d) => d.terminal).filter((d) => d.inView);

  /* set up space (padding) for axes etc, as we don't want the branches & tips to occupy the entire SVG! */
  this.margins = {
    left: (this.layout==="scatter" || this.layout==="clock") ? 40 : 5, // space for y-axis label
    right: 5 + getTipLabelPadding(this.params, inViewTerminalNodes),
    top: this.layout==="radial" ? 10 : 15, // avoid tips rendering behind legend
    bottom: 35 // space for x-axis labels
  };

  /* construct & set the range of the x & y scales */
  this.setScales();

  let nodesInDomain = this.nodes.filter((d) => d.inView && d.y!==undefined && d.x!==undefined);
  // scatterplots further restrict nodes used for domain calcs - if not rendering branches,
  // then we don't consider internal nodes for the domain calc
  if (this.layout==="scatter" && this.scatterVariables.showBranches===false) {
    nodesInDomain = nodesInDomain.filter((d) => d.terminal);
  }

  /* Compute the domains to pass to the d3 scales for the x & y axes */
  let xDomain, yDomain, spanX, spanY;
  if (this.layout!=="scatter" || this.scatterVariables.xContinuous) {
    let [minX, maxX] = [1000000, -100000];
    nodesInDomain.forEach((d) => {
      if (d.x < minX) minX = d.x;
      if (d.x > maxX) maxX = d.x;
    });
    /* fixes state of 0 length domain */
    if (minX === maxX) {
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
    const seenValues = new Set(nodesInDomain.map((d) => d.x));
    xDomain = this.scatterVariables.xDomain.filter((v) => seenValues.has(v));
    padCategoricalScales(xDomain, this.xScale);
  }

  if (this.layout!=="scatter" || this.scatterVariables.yContinuous) {
    let [minY, maxY] = [1000000, -100000];
    nodesInDomain.forEach((d) => {
      if (d.y < minY) minY = d.y;
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
    const seenValues = new Set(nodesInDomain.map((d) => d.y));
    yDomain = this.scatterVariables.yDomain.filter((v) => seenValues.has(v));
    padCategoricalScales(yDomain, this.yScale);
  }

  /* Radial / Unrooted layouts need to be square since branch lengths
  depend on this */
  if (this.layout === "radial" || this.layout === "unrooted") {
    const maxSpan = max([spanY, spanX]);
    const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
    const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
    xDomain = [xDomain[0]-xSlack, xDomain[0]+maxSpan-xSlack];
    yDomain = [yDomain[0]-ySlack, yDomain[0]+maxSpan-ySlack];
  }
  /* Clock & Scatter plots flip the yDomain */
  if (this.layout === "clock" || this.layout === "scatter") {
    yDomain.reverse();
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
    d.rot = Math.atan2(d.yTip-d.yBase, d.xTip-d.xBase) * 180/Math.PI;
  });
  // for scatterplots we do an additional iteration as some values may be missing
  // & we want to avoid rendering these
  if (this.layout==="scatter") {
    if (!this.scatterVariables.yContinuous) jitter("y", this.yScale, this.nodes);
    if (!this.scatterVariables.xContinuous) jitter("x", this.xScale, this.nodes);
    this.nodes.forEach((d) => {
      if (isNaN(d.xTip)) d.xTip = hiddenXPosition;
      if (isNaN(d.yTip)) d.yTip=hiddenYPosition;
      if (isNaN(d.xBase)) d.xBase=hiddenXPosition;
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
      d.branch = [" M "+ Math.round(d.xBase).toString()+","+Math.round(d.yBase).toString()+" L "+Math.round(d.xTip).toString()+","+Math.round(d.yTip).toString(), ""];
    });
  } else if (this.layout==="clock" || this.layout==="scatter") {
    // if nodes are deliberately obscured (as traits may not be set for some nodes), we don't want to render branches joining that node
    if (this.scatterVariables.showBranches) {
      this.nodes.forEach((d) => {
        d.branch = d.xBase===hiddenXPosition || d.xTip===hiddenXPosition || d.yBase===hiddenYPosition || d.yTip===hiddenYPosition ?
          [""] :
          [" M "+d.xBase.toString()+","+d.yBase.toString()+" L "+d.xTip.toString()+","+d.yTip.toString(), ""];
      });
    } else {
      this.nodes.forEach((d) => {d.branch=[];});
    }
  } else if (this.layout==="rect") {
    this.nodes.forEach((d) => {
      const stem_offset = 0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0;
      const childrenY = [this.yScale(d.yRange[0]), this.yScale(d.yRange[1])];
      // Note that a branch cannot be perfectly horizontal and also have a (linear) gradient applied to it
      // So we add a tiny amount of jitter (e.g 1/1000px) to the horizontal line (d.branch[0])
      // see https://stackoverflow.com/questions/13223636/svg-gradient-for-perfectly-horizontal-path
      d.branch =[
        [` M ${Math.round(d.xBase - stem_offset)},${Math.round(d.yBase)} L ${Math.round(d.xTip)},${Math.round(d.yTip+0.01)}`],
        [` M ${Math.round(d.xTip)},${Math.round(childrenY[0])} L ${Math.round(d.xTip)},${Math.round(childrenY[1])}`]
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
        " M "+Math.round((d.xBase-stem_offset_radial[i]*Math.sin(d.angle))).toString() +
        " "+Math.round((d.yBase-stem_offset_radial[i]*Math.cos(d.angle))).toString() +
        " L "+Math.round(d.xTip.toString())+" "+Math.round(d.yTip.toString()), ""
      ];
      if (!d.terminal) {
        d.branch[1] =[" M "+Math.round(this.xScale(d.xCBarStart)).toString()+" "+Math.round(this.yScale(d.yCBarStart)).toString()+
        " A "+Math.round((this.xScale(d.depth)-this.xScale(offset))).toString()+" "+
        Math.round((this.yScale(d.depth)-this.yScale(offset))).toString()+
        " 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
        " "+this.xScale(d.xCBarEnd).toString()+","+this.yScale(d.yCBarEnd).toString()];
      }
    });
  }
  timerEnd("mapToScreen");
};

const JITTER_MIN_STEP_SIZE = 50; // pixels

function padCategoricalScales(domain, scale) {
  if (scale.step() > JITTER_MIN_STEP_SIZE) return scale.padding(0.5); // balanced padding when we can jitter
  if (domain.length<=4) return scale.padding(0.4);
  if (domain.length<=6) return scale.padding(0.3);
  if (domain.length<=10) return scale.padding(0.2);
  return scale.padding(0.1);
}

/**
 * Add jitter to the already-computed node positions.
 */
function jitter(axis, scale, nodes) {
  const step = scale.step();
  if (scale.step() <= JITTER_MIN_STEP_SIZE) return;
  const rand = []; // pre-compute a small set of pseudo random numbers for speed
  for (let i=1e2; i--;) {
    rand.push((Math.random()-0.5)*step*0.5); // occupy 50%
  }
  const [base, tip, randLen] = [`${axis}Base`, `${axis}Tip`, rand.length];
  let j = 0;
  function recurse(n) {
    n[base] = n.parent[tip];
    n[tip] += rand[j++];
    if (j>=randLen) j=0;
    if (!n.children) return;
    for (const child of n.children) recurse(child);
  }
  recurse(nodes[0]);
}


function getTipLabelPadding(params, inViewTerminalNodes) {
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
      if (padBy < d.n.name.length) {
        padBy = 0.65 * d.n.name.length * fontSize;
      }
    });
  }
  return padBy;
}
