/* eslint-disable */
import _debounce from "lodash/debounce";
import { event } from "d3-selection";
import { min, max, sum } from "d3-array";
import { scaleLinear } from "d3-scale";
import { flattenTree, appendParentsToTree } from "../treeHelpers";
import { dataFont, darkGrey } from "../../../globalStyles";
import { defaultParams } from "./defaultParams";
import { addLeafCount } from "./helpers";

/* PROTOTYPES */
import { render } from "./renderers";
import * as layouts from "./layouts";
import * as zoom from "./zoom";
import * as grid from "./grid";
import * as confidence from "./confidence";
import * as labels from "./labels";
import * as generalUpdates from "./generalUpdates";

/*
 * phylogenetic tree drawing class
 * it is instantiated with a nested tree json.
 * the actual tree is rendered by the render method
 * @params:
 *   treeJson -- tree object as exported by nextstrain.
 */
var PhyloTree = function(treeJson) {
  this.grid = false;
  this.attributes = ['r', 'cx', 'cy', 'id', 'class', 'd'];
  this.params = defaultParams;
  appendParentsToTree(treeJson); // add reference to .parent to each node in tree
  const nodesArray = flattenTree(treeJson); // convert the tree json into a flat list of nodes
  // wrap each node in a shell structure to avoid mutating the input data
  this.nodes = nodesArray.map((d) => ({
    n: d, // .n is the original node
    x: 0, // x,y coordinates
    y: 0,
    r: this.params.tipRadius // set defaults
  }));
  // pull out the total number of tips -- the is the maximal yvalue
  this.numberOfTips = max(this.nodes.map(function(d) {
    return d.n.yvalue;
  }));
  this.nodes.forEach(function(d) {
    d.inView=true; // each node is visible
    d.n.shell = d; // a back link from the original node object to the wrapper
    d.terminal = (typeof d.n.children === "undefined");
  });

  // remember the range of children subtending a node (i.e. the range of yvalues)
  // this is useful for drawing
  // and create children structure for the shell.
  this.nodes.forEach(function(d) {
    d.parent = d.n.parent.shell;
    if (d.terminal) {
      d.yRange = [d.n.yvalue, d.n.yvalue];
      d.children=null;
    } else {
      d.yRange = [d.n.children[0].yvalue, d.n.children[d.n.children.length - 1].yvalue];
      d.children = [];
      for (var i=0; i < d.n.children.length; i++){
        d.children.push(d.n.children[i].shell);
      }
    }
  });

  this.xScale = scaleLinear();
  this.yScale = scaleLinear();
  this.zoomNode = this.nodes[0];
  addLeafCount(this.nodes[0]);

  /* debounced functions (AFAIK you can't define these as normal prototypes as they need "this") */
  this.debouncedMapToScreen = _debounce(this.mapToScreen, this.params.mapToScreenDebounceTime,
    {leading: false, trailing: true, maxWait: this.params.mapToScreenDebounceTime});
};

/* DEFINE THE PROTOTYPES */
PhyloTree.prototype.render = render;

/* LAYOUT PROTOTYPES */
PhyloTree.prototype.setDistance = layouts.setDistance;
PhyloTree.prototype.setLayout = layouts.setLayout;
PhyloTree.prototype.rectangularLayout = layouts.rectangularLayout;
PhyloTree.prototype.timeVsRootToTip = layouts.timeVsRootToTip;
PhyloTree.prototype.unrootedLayout = layouts.unrootedLayout;
PhyloTree.prototype.radialLayout = layouts.radialLayout;

/**
 * draws the regression line in the svg and adds a text with the rate estimate
 * @return {null}
 */
PhyloTree.prototype.drawRegression = function(){
    const leftY = this.yScale(this.regression.intercept+this.xScale.domain()[0]*this.regression.slope);
    const rightY = this.yScale(this.regression.intercept+this.xScale.domain()[1]*this.regression.slope);

    const path = "M "+this.xScale.range()[0].toString()+" "+leftY.toString()
                +" L " + this.xScale.range()[1].toString()+" "+rightY.toString();
    this.svg
        .append("path")
        .attr("d", path)
        .attr("class", "regression")
        .style("fill", "none")
        .style("visibility", "visible")
        .style("stroke",this.params.regressionStroke)
        .style("stroke-width",this.params.regressionWidth);
    this.svg
        .append("text")
        .text("rate estimate: "+this.regression.slope.toFixed(4)+' / year')
        .attr("class", "regression")
        .attr("x", this.xScale.range()[1] / 2 - 75)
        .attr("y", this.yScale.range()[0] + 50)
        .style("fill", this.params.regressionStroke)
        .style("font-size", this.params.tickLabelSize + 8)
        .style("font-weight", 400)
        .style("font-family",this.params.fontFamily);
};


/* Z O O M ,    F I T     TO     S C R E E N ,     E T C */
PhyloTree.prototype.zoomIntoClade = zoom.zoomIntoClade;
PhyloTree.prototype.zoomToParent = zoom.zoomToParent;
PhyloTree.prototype.mapToScreen = zoom.mapToScreen;








/**
 * sets the range of the scales used to map the x,y coordinates to the screen
 * @param {margins} -- object with "right, left, top, bottom" margins
 */
PhyloTree.prototype.setScales = function(margins) {
  const width = parseInt(this.svg.attr("width"), 10);
  const height = parseInt(this.svg.attr("height"), 10);
  if (this.layout === "radial" || this.layout === "unrooted") {
    //Force Square: TODO, harmonize with the map to screen
    const xExtend = width - (margins["left"] || 0) - (margins["right"] || 0);
    const yExtend = height - (margins["top"] || 0) - (margins["top"] || 0);
    const minExtend = min([xExtend, yExtend]);
    const xSlack = xExtend - minExtend;
    const ySlack = yExtend - minExtend;
    this.xScale.range([0.5 * xSlack + margins["left"] || 0, width - 0.5 * xSlack - (margins["right"] || 0)]);
    this.yScale.range([0.5 * ySlack + margins["top"] || 0, height - 0.5 * ySlack - (margins["bottom"] || 0)]);

  } else {
    // for rectancular layout, allow flipping orientation of left right and top/botton
    if (this.params.orientation[0]>0){
      this.xScale.range([margins["left"] || 0, width - (margins["right"] || 0)]);
    }else{
      this.xScale.range([width - (margins["right"] || 0), margins["left"] || 0]);
    }
    if (this.params.orientation[1]>0){
      this.yScale.range([margins["top"] || 0, height - (margins["bottom"] || 0)]);
    } else {
      this.yScale.range([height - (margins["bottom"] || 0), margins["top"] || 0]);
    }
  }
};



/*
 * add and remove elements from tree, initial render
 */
PhyloTree.prototype.clearSVG = function() {
  this.svg.selectAll('.tip').remove();
  this.svg.selectAll('.branch').remove();
  this.svg.selectAll('.branchLabel').remove();
  this.svg.selectAll(".vaccine").remove();
};

/**
 * adds crosses to the vaccines
 * @return {null}
 */
PhyloTree.prototype.drawVaccines = function() {
  this.tipElements = this.svg.append("g").selectAll(".vaccine")
    .data(this.vaccines)
    .enter()
    .append("text")
      .attr("class", "vaccine")
      .attr("x", (d) => d.xTip)
      .attr("y", (d) => d.yTip)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style("font-family", this.params.fontFamily)
      .style("font-size", "20px")
      .style("stroke", "#fff")
      .style("fill", darkGrey)
      .text('\u2716')
      // .style("cursor", "pointer")
      .on("mouseover", (d) => console.log("vaccine", d))
};

/**
 * adds all the tip circles to the svg, they have class tip
 * @return {null}
 */
PhyloTree.prototype.drawTips = function() {
  var params=this.params;
  this.tipElements = this.svg.append("g").selectAll(".tip")
    .data(this.nodes.filter(function(d) {
      return d.terminal;
    }))
    .enter()
    .append("circle")
    .attr("class", "tip")
    .attr("id", function(d) {
      return "tip_" + d.n.clade;
    })
    .attr("cx", function(d) {
      return d.xTip;
    })
    .attr("cy", function(d) {
      return d.yTip;
    })
    .attr("r", function(d) {
      return d.r;
    })
    .on("mouseover", (d) => {
      this.callbacks.onTipHover(d, event.pageX, event.pageY)
    })
    .on("mouseout", (d) => {
      this.callbacks.onTipLeave(d)
    })
    .on("click", (d) => {
      this.callbacks.onTipClick(d)
    })
    .style("pointer-events", "auto")
    .style("fill", function(d) {
      return d.fill || params.tipFill;
    })
    .style("stroke", function(d) {
      return d.stroke || params.tipStroke;
    })
    .style("stroke-width", function(d) {
      // return d['stroke-width'] || params.tipStrokeWidth;
      return params.tipStrokeWidth; /* don't want branch thicknesses applied */
    })
    .style("cursor", "pointer");
};

/**
 * adds all branches to the svg, these are paths with class branch
 * @return {null}
 */
PhyloTree.prototype.drawBranches = function() {
  var params = this.params;
  this.Tbranches = this.svg.append("g").selectAll('.branch')
    .data(this.nodes.filter(function(d){return !d.terminal;}))
    .enter()
    .append("path")
    .attr("class", "branch T")
    .attr("id", function(d) {
      return "branch_T_" + d.n.clade;
    })
    .attr("d", function(d) {
      return d.branch[1];
    })
    .style("stroke", function(d) {
      return d.stroke || params.branchStroke;
    })
    .style("stroke-width", function(d) {
      return d['stroke-width'] || params.branchStrokeWidth;
    })
    .style("fill", "none")
    // .style("cursor", "pointer")
    .style("pointer-events", "auto")
    // .on("mouseover", (d) => {
    //   this.callbacks.onBranchHover(d, d3.event.pageX, d3.event.pageY)
    // })
    // .on("mouseout", (d) => {
    //   this.callbacks.onBranchLeave(d)
    // })
    // .on("click", (d) => {
    //   this.callbacks.onBranchClick(d)
    // });
  this.branches = this.svg.append("g").selectAll('.branch')
    .data(this.nodes)
    .enter()
    .append("path")
    .attr("class", "branch S")
    .attr("id", function(d) {
      return "branch_S_" + d.n.clade;
    })
    .attr("d", function(d) {
      return d.branch[0];
    })
    .style("stroke", function(d) {
      return d.stroke || params.branchStroke;
    })
		.style("stroke-linecap", "round")
    .style("stroke-width", function(d) {
      return d['stroke-width'] || params.branchStrokeWidth;
    })
    .style("fill", "none")
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => {
      this.callbacks.onBranchHover(d, event.pageX, event.pageY)
    })
    .on("mouseout", (d) => {
      this.callbacks.onBranchLeave(d)
    })
    .on("click", (d) => {
      this.callbacks.onBranchClick(d)
    });
};





/* C O N F I D E N C E    I N T E R V A L S */

PhyloTree.prototype.removeConfidence = confidence.removeConfidence;
PhyloTree.prototype.drawConfidence = confidence.drawConfidence;
PhyloTree.prototype.drawSingleCI = confidence.drawSingleCI;
PhyloTree.prototype.updateConfidence = confidence.updateConfidence;

/* G E N E R A L    U P D A T E S */
PhyloTree.prototype.updateDistance = generalUpdates.updateDistance;
PhyloTree.prototype.updateLayout = generalUpdates.updateLayout;
PhyloTree.prototype.updateGeometry = generalUpdates.updateGeometry;
PhyloTree.prototype.updateGeometryFade = generalUpdates.updateGeometryFade;
PhyloTree.prototype.updateTimeBar = (d) => {};
PhyloTree.prototype.updateMultipleArray = generalUpdates.updateMultipleArray;


/* L A B E L S    ( T I P ,    B R A N C H ,   C O N F I D E N C E ) */
PhyloTree.prototype.drawCladeLabels = labels.drawCladeLabels;
PhyloTree.prototype.updateBranchLabels = labels.updateBranchLabels;
PhyloTree.prototype.updateTipLabels = labels.updateTipLabels;
PhyloTree.prototype.hideBranchLabels = labels.hideBranchLabels;
PhyloTree.prototype.showBranchLabels = labels.showBranchLabels;


/* G R I D */
PhyloTree.prototype.hideGrid = grid.hideGrid;
PhyloTree.prototype.removeGrid = grid.removeGrid;
PhyloTree.prototype.addGrid = grid.addGrid;



/* this need a bit more work as the quickdraw functionality improves */
PhyloTree.prototype.rerenderAllElements = function () {
  // console.log("rerenderAllElements")
  this.mapToScreen();
  this.svg.selectAll(".branch")
    .transition().duration(0)
    .style("stroke-width", (d) => d["stroke-width"]);
  this.svg.selectAll(".branch")
    .transition().duration(0)
    .filter(".S")
    .attr("d", (d) => d.branch[0]);
};


PhyloTree.prototype.updateStyleOrAttribute = generalUpdates.updateStyleOrAttribute;
PhyloTree.prototype.updateStyleOrAttributeArray = generalUpdates.updateStyleOrAttributeArray;


/**
 * update the svg after all new values have been assigned
 * @param  treeElem -- one of .tip, .branch
 * @param  attr  -- attribute of the tree element to update
 * @param  dt -- transition time
 */
PhyloTree.prototype.redrawAttribute = function(treeElem, attr, dt) {
  this.svg.selectAll(treeElem).filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .attr(attr, function(d) {
      return d[attr];
    });
};

/**
 * update the svg after all new values have been assigned
 * @param  treeElem -- one of .tip, .branch
 * @param  styleElem  -- style element of the tree element to update
 * @param  dt -- transition time
 */
PhyloTree.prototype.redrawStyle = function(treeElem, styleElem, dt) {
  this.svg.selectAll(treeElem).filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .style(styleElem, function(d) {
      return d[styleElem];
    });
};

export default PhyloTree;
