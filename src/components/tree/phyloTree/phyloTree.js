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

const contains = function(array, elem){
  return array.some(function (d){return d===elem;});
}

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


///****************************************************************

// MAPPING TO SCREEN

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

PhyloTree.prototype.hideGrid = grid.hideGrid;
PhyloTree.prototype.removeGrid = grid.removeGrid;
PhyloTree.prototype.addGrid = grid.addGrid;

/**
 * hide branchLabels
 */
PhyloTree.prototype.hideBranchLabels = function() {
  this.params.showBranchLabels=false;
  this.svg.selectAll(".branchLabel").style('visibility', 'hidden');
};

/**
 * show branchLabels
 */
PhyloTree.prototype.showBranchLabels = function() {
  this.params.showBranchLabels=true;
  this.svg.selectAll(".branchLabel").style('visibility', 'visible');
};

/* these functions are never called! */
// /**
//  * hide tipLabels
//  */
// PhyloTree.prototype.hideTipLabels = function() {
//   this.params.showTipLabels=false;
//   this.svg.selectAll(".tipLabel").style('visibility', 'hidden');
// };
//
// /**
//  * show tipLabels
//  */
// PhyloTree.prototype.showTipLabels = function() {
//   this.params.showTipLabels=true;
//   this.svg.selectAll(".tipLabel").style('visibility', 'visible');
// };


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


// PhyloTree.prototype.drawBranchLabels = function() {
//   var params = this.params;
//   const bLFunc = this.callbacks.branchLabel;
//   this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
//     .data(this.nodes) //.filter(function (d){return bLFunc(d)!=="";}))
//     .enter()
//     .append("text")
//     .text(function (d){return bLFunc(d);})
//     .attr("class", "branchLabel")
//     .style("text-anchor","end");
// }


PhyloTree.prototype.drawCladeLabels = function() {
  this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes.filter(function (d) { return typeof d.n.attr.clade_name !== 'undefined'; }))
    .enter()
    .append("text")
    .style("visibility", "visible")
    .text(function (d) { return d.n.attr.clade_name; })
    .attr("class", "branchLabel")
    .style("text-anchor", "end");
}

// PhyloTree.prototype.drawTipLabels = function() {
//   var params = this.params;
//   const tLFunc = this.callbacks.tipLabel;
//   const inViewTerminalNodes = this.nodes
//                   .filter(function(d){return d.terminal;})
//                   .filter(function(d){return d.inView;});
//   console.log(`there are ${inViewTerminalNodes.length} nodes in view`)
//   this.tipLabels = this.svg.append("g").selectAll('.tipLabel')
//     .data(inViewTerminalNodes)
//     .enter()
//     .append("text")
//     .text(function (d){return tLFunc(d);})
//     .attr("class", "tipLabel");
// }

/* C O N F I D E N C E    I N T E R V A L S */

PhyloTree.prototype.removeConfidence = confidence.removeConfidence;
PhyloTree.prototype.drawConfidence = confidence.drawConfidence;
PhyloTree.prototype.drawSingleCI = confidence.drawSingleCI;
PhyloTree.prototype.updateConfidence = confidence.updateConfidence;

/************************************************/

/**
 * call to change the distance measure
 * @param  attr -- attribute to be used as a distance measure, e.g. div or num_date
 * @param  dt -- time of transition in milliseconds
 * @return null
 */
PhyloTree.prototype.updateDistance = function(attr,dt){
  this.setDistance(attr);
  this.setLayout(this.layout);
  this.mapToScreen();
  this.updateGeometry(dt);
  if (this.grid && this.layout!=="unrooted") {this.addGrid(this.layout);}
  else this.hideGrid()
  this.svg.selectAll(".regression").remove();
  if (this.layout==="clock" && this.distance === "num_date") this.drawRegression();
};


/**
 * call to change the layout
 * @param  layout -- needs to be one of "rect", "radial", "unrooted", "clock"
 * @param  dt -- time of transition in milliseconds
 * @return null
 */
PhyloTree.prototype.updateLayout = function(layout,dt){
    this.setLayout(layout);
    this.mapToScreen();
    this.updateGeometryFade(dt);
    if (this.grid && this.layout!=="unrooted") this.addGrid(layout);
    else this.hideGrid()
    this.svg.selectAll(".regression").remove();
    if (this.layout==="clock" && this.distance === "num_date") this.drawRegression();
};


/*
 * redraw the tree based on the current xTip, yTip, branch attributes
 * this function will remove branches, move the tips continuously
 * and add the new branches again after the tips arrived at their destination
 *  @params dt -- time of transition in milliseconds
 */
PhyloTree.prototype.updateGeometryFade = function(dt) {
  this.removeConfidence(dt)
  // fade out branches
  this.svg.selectAll('.branch').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);
  this.svg.selectAll('.branchLabels').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);
  this.svg.selectAll('.tipLabels').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);

  // closure to move the tips, called via the time out below
  const tipTrans = function(tmp_svg, tmp_dt) {
    const svg = tmp_svg;
    return function() {
      svg.selectAll('.tip').filter(function(d) {
          return d.update;
        })
        .transition().duration(tmp_dt)
        .attr("cx", function(d) {
          return d.xTip;
        })
        .attr("cy", function(d) {
          return d.yTip;
        });
      svg.selectAll(".vaccine")
        .filter((d) => d.update)
        .transition()
          .duration(dt)
          .attr("x", (d) => d.xTip)
          .attr("y", (d) => d.yTip);
    };
  };
  setTimeout(tipTrans(this.svg, dt), 0.5 * dt);

  // closure to change the branches, called via time out after the tipTrans is done
  const flipBranches = function(tmp_svg) {
    const svg = tmp_svg;
    return function() {
      svg.selectAll('.branch').filter('.S').filter(function(d) {
          return d.update;
        })
        .attr("d", function(d) {
          return d.branch[0];
        });
      svg.selectAll('.branch').filter('.T').filter(function(d) {
          return d.update;
        })
        .attr("d", function(d) {
          return d.branch[1];
        });
    };
  };
  setTimeout(flipBranches(this.svg), 0.5 * dt);

  // closure to add the new branches after the tipTrans
  const fadeBack = function(tmp_svg, tmp_dt) {
    const svg = tmp_svg;
    return function(d) {
      svg.selectAll('.branch').filter(function(d) {
          return d.update;
        })
        .transition().duration(0.5 * tmp_dt)
        .style("opacity", 1.0)
    };
  };
  setTimeout(fadeBack(this.svg, 0.2 * dt), 1.5 * dt);
  this.updateBranchLabels(dt);
  this.updateTipLabels(dt);
};

/**
 * transition of branches and tips at the same time. only useful within a layout
 * @param  dt -- time of transition in milliseconds
 * @return {[type]}
 */
PhyloTree.prototype.updateGeometry = function (dt) {
  this.svg.selectAll(".tip")
    .filter((d) => d.update)
    .transition()
      .duration(dt)
      .attr("cx", (d) => d.xTip)
      .attr("cy", (d) => d.yTip);

  this.svg.selectAll(".vaccine")
    .filter((d) => d.update)
    .transition()
      .duration(dt)
      .attr("x", (d) => d.xTip)
      .attr("y", (d) => d.yTip);

  const branchEls = [".S", ".T"];
  for (let i = 0; i < 2; i++) {
    this.svg.selectAll(".branch")
      .filter(branchEls[i])
      .filter((d) => d.update)
      .transition()
        .duration(dt)
        .attr("d", (d) => d.branch[i]);
  }

  this.svg.selectAll(".conf")
    .filter((d) => d.update)
    .transition()
      .duration(dt)
      .attr("d", (dd) => dd.confLine);

  this.updateBranchLabels(dt);
  this.updateTipLabels(dt);
};


PhyloTree.prototype.updateBranchLabels = function(dt){
  const xPad = this.params.branchLabelPadX, yPad = this.params.branchLabelPadY;
  const nNIV = this.nNodesInView;
  const bLSFunc = this.callbacks.branchLabelSize;
  const showBL = (this.layout==="rect") && this.params.showBranchLabels;
  const visBL = showBL ? "visible" : "hidden";
  this.svg.selectAll('.branchLabel')
    .transition().duration(dt)
    .attr("x", function(d) {
      return d.xTip - xPad;
    })
    .attr("y", function(d) {
      return d.yTip - yPad;
    })
    .attr("visibility",visBL)
    .style("fill", this.params.branchLabelFill)
    .style("font-family", this.params.branchLabelFont)
    .style("font-size", function(d) {return bLSFunc(d, nNIV).toString()+"px";});
}


/* this was the *old* updateTipLabels */
// PhyloTree.prototype.updateTipLabels = function(dt){
//   const xPad = this.params.tipLabelPadX, yPad = this.params.tipLabelPadY;
//   const nNIV = this.nNodesInView;
//   const tLSFunc = this.callbacks.tipLabelSize;
//   const showTL = (this.layout==="rect") && this.params.showTipLabels;
//   const visTL = showTL ? "visible" : "hidden";
//   this.svg.selectAll('.tipLabel')
//     .transition().duration(dt)
//     .attr("x", function(d) {
//       return d.xTip + xPad;
//     })
//     .attr("y", function(d) {
//       return d.yTip + yPad;
//     })
//     .attr("visibility",visTL)
//     .style("fill", this.params.tipLabelFill)
//     .style("font-family", this.params.tipLabelFont)
//     .style("font-size", function(d) {return tLSFunc(d, nNIV).toString()+"px";});
// }
/* the new updateTipLabels is here: */
PhyloTree.prototype.updateTipLabels = function(dt) {
  this.svg.selectAll('.tipLabel').remove()
  var params = this.params;
  const tLFunc = this.callbacks.tipLabel;
  const xPad = this.params.tipLabelPadX;
  const yPad = this.params.tipLabelPadY;
  const inViewTerminalNodes = this.nodes
                  .filter(function(d){return d.terminal;})
                  .filter(function(d){return d.inView;});
  // console.log(`there are ${inViewTerminalNodes.length} nodes in view`)
  if (inViewTerminalNodes.length < 50) {
    // console.log("DRAWING!", inViewTerminalNodes)
    window.setTimeout( () =>
      this.tipLabels = this.svg.append("g").selectAll('.tipLabel')
        .data(inViewTerminalNodes)
        .enter()
        .append("text")
        .attr("x", function(d) {
          return d.xTip + xPad;
        })
        .attr("y", function(d) {
          return d.yTip + yPad;
        })
        .text(function (d){return tLFunc(d);})
        .attr("class", "tipLabel")
        .style('visibility', 'visible')
      , dt
    )
  }
}

PhyloTree.prototype.updateTimeBar = function(d){
  return;
}

/**
 * Update multiple style or attributes of  tree elements at once
 * @param {string} treeElem one of .tip or .branch
 * @param {object} attr object containing the attributes to change as keys, array with values as value
 * @param {object} styles object containing the styles to change
 * @param {int} dt time in milliseconds
 */
PhyloTree.prototype.updateMultipleArray = function(treeElem, attrs, styles, dt, quickdraw) {
  // assign new values and decide whether to update
  this.nodes.forEach(function(d, i) {
    d.update = false;
    /* note that this is not node.attr, but element attr such as <g width="100" vs style="" */
    let newAttr;
    for (var attr in attrs) {
      newAttr = attrs[attr][i];
      if (newAttr !== d[attr]) {
        d[attr] = newAttr;
        d.update = true;
      }
    }
    let newStyle;
    for (var prop in styles) {
      newStyle = styles[prop][i];
      if (newStyle !== d[prop]) {
        d[prop] = newStyle;
        d.update = true;
      }
    }
  });
  let updatePath = false;
  if (styles["stroke-width"]) {
    if (quickdraw) {
      this.debouncedMapToScreen();
    } else {
      this.mapToScreen();
    }
    updatePath = true;
  }

  // function that return the closure object for updating the svg
  function update(attrToSet, stylesToSet) {
    return function(selection) {
      for (var i=0; i<stylesToSet.length; i++) {
        var prop = stylesToSet[i];
        selection.style(prop, function(d) {
          return d[prop];
        });
      }
      for (var i = 0; i < attrToSet.length; i++) {
        var prop = attrToSet[i];
        selection.attr(prop, function(d) {
          return d[prop];
        });
      }
      if (updatePath){
	selection.filter('.S').attr("d", function(d){return d.branch[0];})
      }
    };
  };
  // update the svg
  if (dt) {
    this.svg.selectAll(treeElem).filter(function(d) {
        return d.update;
      })
      .transition().duration(dt)
      .call(update(Object.keys(attrs), Object.keys(styles)));
  } else {
    this.svg.selectAll(treeElem).filter(function(d) {
        return d.update;
      })
      .call(update(Object.keys(attrs), Object.keys(styles)));
  }
};

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


/**
 * as updateAttributeArray, but accepts a callback function rather than an array
 * with the values. will create array and call updateAttributeArray
 * @param  treeElem  --- the part of the tree to update (.tip, .branch)
 * @param  attr  --- the attribute to update (e.g. r for tipRadius)
 * @param  callback -- function that assigns the attribute
 * @param  dt  --- time of transition in milliseconds
 * @return {[type]}
 */
PhyloTree.prototype.updateStyleOrAttribute = function(treeElem, attr, callback, dt, styleOrAttribute) {
  this.updateStyleOrAttributeArray(treeElem, attr,
    this.nodes.map(function(d) {
      return callback(d);
    }), dt, styleOrAttribute);
};

/**
 * update an attribute of the tree for all nodes
 * @param  treeElem  --- the part of the tree to update (.tip, .branch)
 * @param  attr  --- the attribute to update (e.g. r for tipRadius)
 * @param  attr_array  --- an array with values for every node in the tree
 * @param  dt  --- time of transition in milliseconds
 * @return {[type]}
 */
PhyloTree.prototype.updateStyleOrAttributeArray = function(treeElem, attr, attr_array, dt, styleOrAttribute) {
  this.nodes.forEach(function(d, i) {
    const newAttr = attr_array[i];
    if (newAttr === d[attr]) {
      d.update = false;
    } else {
      d[attr] = newAttr;
      d.update = true;
    }
  });
  if (typeof styleOrAttribute==="undefined"){
    var all_attr = this.attributes;
    if (contains(all_attr, attr)){
      styleOrAttribute="attr";
    }else{
      styleOrAttribute="style";
    }
  }
  if (styleOrAttribute==="style"){
    this.redrawStyle(treeElem, attr, dt);
  }else{
    this.redrawAttribute(treeElem, attr, dt);
  }
};

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
