import d3 from "d3";
import { dataFont, darkGray } from "../globalStyles";

/*
 * adds the total number of descendant leaves to each node in the tree
 * the functions works recursively.
 * @params:
 *   node -- root node of the tree.
 */
const addLeafCount = function (node) {
    if (node.terminal) {
        node.leafCount=1;
    }else{
        node.leafCount=0;
        for (var i=0; i<node.children.length; i++){
            addLeafCount(node.children[i]);
            node.leafCount += node.children[i].leafCount;
        }
    }
};


const contains = function(array, elem){
  return array.some(function (d){return d===elem;});
}

/*
 * Utility function for the unrooted tree layout.
 * assigns x,y coordinates to the subtree starting in node
 * @params:
 *   node -- root of the subtree.
 *   nTips -- total number of tips in the tree.
 */
const unrootedPlaceSubtree = function(node, nTips){
  node.x = node.px+node.branchLength*Math.cos(node.tau + node.w*0.5);
  node.y = node.py+node.branchLength*Math.sin(node.tau + node.w*0.5);
  var eta = node.tau; //eta is the cumulative angle for the wedges in the layout
  if (!node.terminal){
      for (var i=0; i<node.children.length; i++){
          var ch = node.children[i];
          ch.w = 2*Math.PI*ch.leafCount/nTips;
          ch.tau = eta;
          eta += ch.w;
          ch.px = node.x;
          ch.py = node.y;
          unrootedPlaceSubtree(ch, nTips);
      }
  }
};


/*
 * this function takes a call back and applies it recursively
 * to all child nodes, including internal nodes
 * @params:
 *   node -- node to whose children the function is to be applied
 *   func -- call back function to apply
 */
const applyToChildren = function(node,func){
  func(node);
  if (node.terminal){ return;}
  else{
    for (let i=0; i<node.children.length; i++){
      applyToChildren(node.children[i], func);
    }
  }
};

/*
 * phylogenetic tree drawing class
 * it is instantiated with a nested tree json.
 * the actual tree is rendered by the render method
 * @params:
 *   treeJson -- tree object as exported by nextstrain.
 */
var PhyloTree = function(treeJson) {
  this.grid = false;
  this.setDefaults();
  // use d3 tree layout to convert the tree json into a flat list of nodes
  this.tree = d3.layout.tree();
  // wrap each node in a shell structure to avoid mutating the input data
  this.nodes = this.tree.nodes(treeJson).map(function(d) {
    return {
      n: d, // .n is the original node
      x: 0, // x,y coordinates
      y: 0
    };
  });
  // assign the root as its own parent to avoid exception handling
  this.nodes[0].n.parent = this.nodes[0].n;
  // pull out the total number of tips -- the is the maximal yvalue
  this.numberOfTips = d3.max(this.nodes.map(function(d) {
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

  this.xScale = d3.scale.linear();
  this.yScale = d3.scale.linear();
  addLeafCount(this.nodes[0]);
};

/*
 * set default values.
 */
PhyloTree.prototype.setDefaults = function () {
    this.grid = false;
    this.attributes = ['r', 'cx', 'cy', 'id', 'class', 'd'];
    this.params = {
        regressionStroke: "#CCC",
        regressionWidth: 3,
        majorGridStroke: "#CCC",
        majorGridWidth: 2,
        minorGridStroke: "#DDD",
        minorGridWidth: 1,
        tickLabelSize: 12,
        tickLabelFill: darkGray,
        minorTicksTimeTree: 3,
        minorTicks: 4,
        orientation: [1,1],
        margins: {left:25, right:15, top:5, bottom:25},
        showGrid: true,
        fillSelected:"#A73",
        radiusSelected:5,
        branchStroke: "#AAA",
        branchStrokeWidth: 2,
        tipStroke: "#AAA",
        tipFill: "#CCC",
        tipStrokeWidth: 1,
        tipRadius: 4,
        fontFamily: dataFont,
        branchLabels:true,
        branchLabelFont: dataFont,
        branchLabelPadX: 8,
        branchLabelPadY:5,
    };
};


/**
 * @param  svg    -- the svg into which the tree is drawn
 * @param  layout -- the layout to be used, e.g. "rect"
 * @param  distance   -- the property used as branch length, e.g. div or num_date
 * @param  options    -- an object that contains options that will be added to this.params
 * @param  callbacks  -- an object with call back function defining mouse behavior
 * @return {null}
 */
PhyloTree.prototype.render = function(svg, layout, distance, options, callbacks) {
  this.svg = svg;
  this.params = Object.assign(this.params, options);
  this.callbacks = callbacks;

  this.clearSVG();
  this.setDistance(distance);
  this.setLayout(layout);
  this.mapToScreen();
  if (this.params.showGrid){
      this.addGrid();
  }
  if (this.params.confidence){
    this.drawConfidence();
  }
  this.drawBranches();
  this.drawTips();
  this.drawBranchLabels();
  this.updateGeometry(10);
  this.svg.selectAll(".regression").remove();
  if (layout==="clock") this.drawRegression();
};


/*
 * set the property that is used as distance along branches
 * this is set to "depth" of each node. depth is later used to
 * calculate coordinates. Parent depth is assigned as well.
 */
PhyloTree.prototype.setDistance = function(distanceAttribute) {
  this.nodes.forEach(function(d) {
    d.update = true
  });
  if (typeof distanceAttribute === "undefined") {
    this.distance = "div"; // default is "div" for divergence
  } else {
    this.distance = distanceAttribute;
  }
  // assign node and parent depth
  var tmp_dist = this.distance;
  this.nodes.forEach(function(d) {
    d.depth = d.n.attr[tmp_dist];
    d.pDepth = d.n.parent.attr[tmp_dist];
    if (d.n.attr[tmp_dist+"_confidence"]){
      d.conf = d.n.attr[tmp_dist+"_confidence"];
    }else{
      d.conf = [d.depth, d.depth];
    }
  });
};



/**
 * assigns the attribute this.layout and calls the function that
 * calculates the x,y coordinates for the respective layouts
 * @param layout -- the layout to be used, has to be one of
 *                  ["rect", "radial", "unrooted", "clock"]
 */
PhyloTree.prototype.setLayout = function(layout){
    if (typeof layout==="undefined" || layout!==this.layout){
        this.nodes.forEach(function(d){d.update=true});
    }
    if (typeof layout==="undefined"){
        this.layout = "rect";
    }else {
        this.layout = layout;
    }
    if (this.layout==="rect"){
        this.rectangularLayout();
    } else if (this.layout==="clock"){
        this.timeVsRootToTip();
    } else if (this.layout==="radial"){
        this.radialLayout();
    } else if (this.layout==="unrooted"){
        this.unrootedLayout();
    }
};



/// ASSIGN XY COORDINATES FOR DIFFERENCE LAYOUTS

/**
 * assignes x,y coordinates for a rectancular layout
 * @return {null}
 */
PhyloTree.prototype.rectangularLayout = function() {
  this.nodes.forEach(function(d) {
    d.y = d.n.yvalue; // precomputed y-values
    d.x = d.depth;    // depth according to current distance
    d.px = d.pDepth;  // parent positions
    d.py = d.y;
    d.x_conf = d.conf; // assign confidence intervals
  });
};

/**
 * assign x,y coordinates fro the root-to-tip regression layout
 * this requires a time tree with attr["num_date"] set
 * in addition, this function calculates a regression between
 * num_date and div which is saved as this.regression
 * @return {null}
 */
PhyloTree.prototype.timeVsRootToTip = function(){
  this.nodes.forEach(function (d) {
    d.y = d.n.attr["div"];
    d.x = d.n.attr["num_date"];
    d.px = d.n.parent.attr["num_date"];
    d.py = d.n.parent.attr["div"];
  });
  const nTips = this.numberOfTips;
  // REGRESSION WITH FREE INTERCEPT
  // const meanDiv = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>d.y))/nTips;
  // const meanTime = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>d.depth))/nTips;
  // const covarTimeDiv = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.y-meanDiv)*(d.depth-meanTime)))/nTips;
  // const varTime = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.depth-meanTime)*(d.depth-meanTime)))/nTips;
  //const slope = covarTimeDiv/varTime;
  //const intercept = meanDiv-meanTime*slope;
  // REGRESSION THROUGH ROOT
  const offset = this.nodes[0].depth;
  const XY = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.y)*(d.depth-offset)))/nTips;
  const secondMomentTime = d3.sum(this.nodes.filter((d)=>d.terminal).map((d)=>(d.depth-offset)*(d.depth-offset)))/nTips;
  const slope = XY/secondMomentTime;
  const intercept = -offset*slope;
  this.regression = {slope:slope, intercept: intercept};
};

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
        .text("rate estimate: "+this.regression.slope.toFixed(4)+'/year')
        .attr("class", "regression")
        .attr("x", this.xScale.range()[1]-200)
        .attr("y", leftY)
        .style("fill", this.params.regressionStroke)
        .style("font-size",this.params.tickLabelSize)
        .style("font-family",this.params.fontFamily);
};

/**
 * calculates and assigns x,y coordinates for the radial layout.
 * in addition to x,y, this calculates the end-points of the radial
 * arcs and whether that arc is more than pi or not
 * @return {null}
 */
PhyloTree.prototype.radialLayout = function() {
  const nTips = this.numberOfTips;
  const offset = this.nodes[0].depth;
  this.nodes.forEach(function(d) {
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
};

/**
 * calculates x,y coordinates for the unrooted layout. this is
 * done recursively via a the function unrootedPlaceSubtree
 * @return {null}
 */
PhyloTree.prototype.unrootedLayout = function(){
  const nTips=this.numberOfTips;
  //postorder iteration to determine leaf count of every node
  addLeafCount(this.nodes[0]);
  //calculate branch length from depth
  this.nodes.forEach(function(d){d.branchLength = d.depth - d.pDepth;});
  //preorder iteration to layout nodes
  this.nodes[0].x = 0;
  this.nodes[0].y = 0;
  this.nodes[0].px = 0;
  this.nodes[0].py = 0;
  this.nodes[0].w = 2*Math.PI;
  this.nodes[0].tau = 0;
  var eta = 1.5*Math.PI;
  for (var i=0; i<this.nodes[0].children.length; i++){
    this.nodes[0].children[i].px=0;
    this.nodes[0].children[i].py=0;
    this.nodes[0].children[i].w = 2.0*Math.PI*this.nodes[0].children[i].leafCount/nTips;
    this.nodes[0].children[i].tau = eta;
    eta += this.nodes[0].children[i].w;
    unrootedPlaceSubtree(this.nodes[0].children[i], nTips);
  }
};

///****************************************************************

// MAPPING TO SCREEN

/**
 * zoom such that a particular clade fills the svg
 * @param  clade -- branch/node at the root of the clade to zoom into
 * @param  dt -- time of the transition in milliseconds
 * @return {null}
 */
PhyloTree.prototype.zoomIntoClade = function(clade, dt) {
  // assign all nodes to inView false and force update
  this.nodes.forEach(function(d){d.inView=false; d.update=true;});
  // assign all child nodes of the chosen clade to inView=true
  // if clade is terminal, apply to parent
  if (clade.terminal){
    applyToChildren(clade.parent, function(d){d.inView=true;});
  }else{
    applyToChildren(clade, function(d){d.inView=true;});
  }
  // redraw
  this.mapToScreen();
  this.updateGeometry(dt);
  if (this.grid) this.addGrid(this.layout);
  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock") this.drawRegression();
};

/**
 * this function sets the xScale, yScale domains and maps precalculated x,y
 * coordinates to their places on the screen
 * @return {null}
 */
PhyloTree.prototype.mapToScreen = function(){
    this.setScales(this.params.margins);
    // determine x,y values of visibile nodes
    const tmp_xValues = this.nodes.filter(function(d){return d.inView;}).map(function(d){return d.x});
    const tmp_yValues = this.nodes.filter(function(d){return d.inView;}).map(function(d){return d.y});
    this.nNodesInView = tmp_yValues.length;

    if (this.layout==="radial" || this.layout==="unrooted") {
        // handle "radial and unrooted differently since they need to be square
        // since branch length move in x and y direction
        // TODO: should be tied to svg dimensions
        const minX = d3.min(tmp_xValues);
        const minY = d3.min(tmp_yValues);
        const spanX = d3.max(tmp_xValues)-minX;
        const spanY = d3.max(tmp_yValues)-minY;
        const maxSpan = d3.max([spanY, spanX]);
        const ySlack = (spanX>spanY) ? (spanX-spanY)*0.5 : 0.0;
        const xSlack = (spanX<spanY) ? (spanY-spanX)*0.5 : 0.0;
        this.xScale.domain([minX-xSlack, minX+maxSpan-xSlack]);
        this.yScale.domain([minY-ySlack, minY+maxSpan-ySlack]);
    }else if (this.layout==="clock"){
        // same as rectangular, but flipped yscale
        this.xScale.domain([d3.min(tmp_xValues), d3.max(tmp_xValues)]);
        this.yScale.domain([d3.max(tmp_yValues), d3.min(tmp_yValues)]);
    }else{ //rectangular
        this.xScale.domain([d3.min(tmp_xValues), d3.max(tmp_xValues)]);
        this.yScale.domain([d3.min(tmp_yValues), d3.max(tmp_yValues)]);
    }

    // pass all x,y through scales and assign to xTip, xBase
    const tmp_xScale=this.xScale;
    const tmp_yScale=this.yScale;
    this.nodes.forEach(function(d){d.xTip = tmp_xScale(d.x)});
    this.nodes.forEach(function(d){d.yTip = tmp_yScale(d.y)});
    this.nodes.forEach(function(d){d.xBase = tmp_xScale(d.px)});
    this.nodes.forEach(function(d){d.yBase = tmp_yScale(d.py)});
    if (this.params.confidence && this.layout==="rect"){
      this.nodes.forEach(function(d){d.xConf = [tmp_xScale(d.conf[0]), tmp_xScale(d.conf[1])];});
    }

    // assign the branches as path to each node for the different layouts
    if (this.layout==="clock" || this.layout==="unrooted"){
        this.nodes.forEach(function(d){d.branch =[" M "+d.xBase.toString()+","+d.yBase.toString()+
                                                 " L "+d.xTip.toString()+","+d.yTip.toString(),""];});
    } else if (this.layout==="rect"){
        const tmpStrokeWidth = this.params.branchStrokeWidth;
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])})
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])  });
        //this.nodes.forEach(function(d){d.branch =[" M "+d.xBase.toString()+","+d.yBase.toString()+
        const stem_offset = this.nodes.map(function(d){return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
        this.nodes.forEach(function(d,i){
          d.branch =[" M "+(d.xBase - stem_offset[i]).toString()
                       +","+d.yBase.toString()+
                       " L "+d.xTip.toString()+","+d.yTip.toString(),
                       " M "+d.xTip.toString()+","+d.cBarStart.toString()+
                       " L "+d.xTip.toString()+","+d.cBarEnd.toString()];});
        if (this.params.confidence){
          this.nodes.forEach(function(d){d.confLine =" M "+d.xConf[0].toString()+","+d.yBase.toString()+
                                                   " L "+d.xConf[1].toString()+","+d.yTip.toString();});
        }
    } else if (this.layout==="radial"){
        const offset = this.nodes[0].depth;
        const stem_offset_radial = this.nodes.map(function(d){return (0.5*(d.parent["stroke-width"] - d["stroke-width"]) || 0.0);});
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])});
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])});
        this.nodes.forEach(function(d,i){
            d.branch =[" M "+(d.xBase-stem_offset_radial[i]*Math.sin(d.angle)).toString()
                        +" "+(d.yBase-stem_offset_radial[i]*Math.cos(d.angle)).toString()+
                       " L "+d.xTip.toString()+" "+d.yTip.toString(),""];
            if (!d.terminal){
                d.branch[1] =[" M "+tmp_xScale(d.xCBarStart).toString()+" "+tmp_yScale(d.yCBarStart).toString()+
                           " A "+(tmp_xScale(d.depth)-tmp_xScale(offset)).toString()+" "
                             +(tmp_yScale(d.depth)-tmp_yScale(offset)).toString()
                             +" 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
                           " "+tmp_xScale(d.xCBarEnd).toString()+","+tmp_yScale(d.yCBarEnd).toString()];
            }
        });
    }
};


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
    const minExtend = d3.min([xExtend, yExtend]);
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

/**
 * remove the grid
 */
PhyloTree.prototype.removeGrid = function() {
  this.svg.selectAll(".majorGrid").remove();
  this.svg.selectAll(".minorGrid").remove();
  this.svg.selectAll(".gridTick").remove();
  this.grid = false;
};

/**
 * hide the grid
 */
PhyloTree.prototype.hideGrid = function() {
  this.svg.selectAll(".majorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".minorGrid").style('visibility', 'hidden');
  this.svg.selectAll(".gridTick").style('visibility', 'hidden');
};


/**
 * add a grid to the svg
 * @param {layout}
 */
PhyloTree.prototype.addGrid = function(layout) {
  if (typeof layout==="undefined"){ layout=this.layout;}

  const xmin = (this.xScale.domain()[0]>0)?this.xScale.domain()[0]:0.0;
  const ymin = this.yScale.domain()[1];
  const ymax = this.yScale.domain()[0];
  const xmax = layout=="radial"
                ? d3.max([this.xScale.domain()[1], this.yScale.domain()[1],
                          -this.xScale.domain()[0], -this.yScale.domain()[0]])
                : this.xScale.domain()[1];
  const offset = layout==="radial"?this.nodes[0].depth:0.0;

  const gridline = function(xScale, yScale, layout){
      return function(x){
          const xPos = xScale(x[0]-offset);
          let tmp_d="";
          if (layout==="rect" || layout==="clock"){
            tmp_d = 'M'+xPos.toString() +
              " " +
              yScale.range()[0].toString() +
              " L " +
              xPos.toString() +
              " " +
              yScale.range()[1].toString();
          }else if (layout==="radial"){
            tmp_d = 'M '+xPos.toString() +
              "  " +
              yScale(0).toString() +
              " A " +
              (xPos - xScale(0)).toString() +
              " " +
              (yScale(x[0]) - yScale(offset)).toString() +
              " 0 1 0 " +
              xPos.toString() +
              " " +
              (yScale(0)+0.001).toString();
          }
          return tmp_d;
      };
  };

  const logRange = Math.floor(Math.log10(xmax - xmin));
  const roundingLevel = Math.pow(10, logRange);
  const gridMin = Math.floor((xmin+offset)/roundingLevel)*roundingLevel;
  const gridPoints = [];
  for (let ii = 0; ii <= (xmax + offset - gridMin)/roundingLevel+10; ii++) {
    const pos = gridMin + roundingLevel*ii;
    if (pos>offset){
        gridPoints.push([pos, pos-offset>xmax?"hidden":"visible", "x"]);
    }
  }

  const majorGrid = this.svg.selectAll('.majorGrid').data(gridPoints);
  majorGrid.exit().remove();
  majorGrid.enter().append("path");
  majorGrid
      .attr("d", gridline(this.xScale, this.yScale, layout))
      .attr("class", "majorGrid")
      .style("fill", "none")
      .style("visibility", function (d){return d[1];})
      .style("stroke",this.params.majorGridStroke)
      .style("stroke-width",this.params.majorGridWidth);

  const xTextPos = function(xScale, layout){
      return function(x){
          if (x[2]==="x"){
              return layout==="radial" ? xScale(0) :  xScale(x[0]);
          }else{
              return xScale.range()[1];
          }
      }
  };
  const yTextPos = function(yScale, layout){
      return function(x){
          if (x[2]==="x"){
              return layout==="radial" ? yScale(x[0]-offset) :  yScale.range()[1]+18;
          }else{
              return yScale(x[0]);
          }
      }
  };

  if (this.layout==="clock"){
      const logRangeY = Math.floor(Math.log10(ymax - ymin));
      const roundingLevelY = Math.pow(10, logRangeY);
      const offsetY=0;
      const gridMinY = Math.floor((ymin+offsetY)/roundingLevelY)*roundingLevelY;
      for (let ii = 0; ii <= (ymax + offsetY - gridMinY)/roundingLevelY+10; ii++) {
        const pos = gridMinY + roundingLevelY*ii;
        if (pos>offsetY){
            gridPoints.push([pos, pos-offsetY>ymax?"hidden":"visible","y"]);
        }
      }
  }

  const minorRoundingLevel = roundingLevel / (this.distanceMeasure === "num_date"
                                              ? this.params.minorTicksTimeTree
                                              : this.params.minorTicks);
  const minorGridPoints = [];
  for (let ii = 0; ii <= (xmax + offset - gridMin)/minorRoundingLevel+50; ii++) {
    const pos = gridMin + minorRoundingLevel*ii;
    if (pos>offset){
        minorGridPoints.push([pos, pos-offset>xmax+minorRoundingLevel?"hidden":"visible"]);
    }
  }
  const minorGrid = this.svg.selectAll('.minorGrid').data(minorGridPoints);
  minorGrid.exit().remove();
  minorGrid.enter().append("path");
  minorGrid
      .attr("d", gridline(this.xScale, this.yScale, layout))
      .attr("class", "minorGrid")
      .style("fill", "none")
      .style("visibility", function (d){return d[1];})
      .style("stroke",this.params.minorGridStroke)
      .style("stroke-width",this.params.minorGridWidth);

  const gridLabels = this.svg.selectAll('.gridTick').data(gridPoints);
  gridLabels.exit().remove();
  gridLabels.enter().append("text");
  gridLabels
      .text(function(d){return d[0].toString();})
      .attr("class", "gridTick")
      .style("font-size",this.params.tickLabelSize)
      .style("font-family",this.params.fontFamily)
      .style("fill",this.params.tickLabelFill)
      .style("text-anchor", this.layout==="radial" ? "end" : "middle")
      .style("visibility", function (d){return d[1];})
      .attr("x", xTextPos(this.xScale, layout))
      .attr("y", yTextPos(this.yScale, layout));

  this.grid=true;
};


/*
 * add and remove elements from tree, initial render
 */
PhyloTree.prototype.clearSVG = function() {
  this.svg.selectAll('.tip').remove();
  this.svg.selectAll('.branch').remove();
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
      return d.r || params.tipRadius;
    })
    .on("mouseover", (d) => {
      this.callbacks.onTipHover(d)
    })
    .on("mouseout", (d) => {
      this.callbacks.onBranchOrTipLeave()
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
      return d['stroke-width'] || params.tipStrokeWidth;
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
      return "branch_" + d.n.clade;
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
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => {
      this.callbacks.onBranchHover(d)
    })
    .on("mouseout", (d) => {
      this.callbacks.onBranchOrTipLeave()
    })
    .on("click", (d) => {
      this.callbacks.onBranchClick(d)
    });
  this.branches = this.svg.append("g").selectAll('.branch')
    .data(this.nodes)
    .enter()
    .append("path")
    .attr("class", "branch S")
    .attr("id", function(d) {
      return "branch_" + d.n.clade;
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
      this.callbacks.onBranchHover(d)
    })
    .on("mouseout", (d) => {
      this.callbacks.onBranchOrTipLeave()
    })
    .on("click", (d) => {
      this.callbacks.onBranchClick(d)
    });
};


PhyloTree.prototype.drawBranchLabels = function() {
  var params = this.params;
  console.log("drawBranchLabels");
  const bLFunc = this.callbacks.branchLabel;
  //this.nodes.forEach(function(d){console.log(bLFunc(d));})
  this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes) //.filter(function (d){return bLFunc(d)!=="";}))
    .enter()
    .append("text")
    .text(function (d){return bLFunc(d);})
    .attr("class", "branchLabel")
    .style("text-anchor","end");
}

PhyloTree.prototype.drawConfidence = function() {
  this.confidence = this.svg.append("g").selectAll('.conf')
    .data(this.nodes)
    .enter()
    .append("path")
    .attr("class", "conf")
    .attr("id", function(d) {
      return "conf_" + d.n.clade;
    })
    .attr("d", function(d) {
      return d.confLine;
    })
    .style("stroke", function(d) {
      return d.stroke || "#888";
    })
    .style("opacity", 0.5)
    .style("fill", "none")
    .style("stroke-width", function(d) {
      return d['stroke-width']*2 || 4;
    });
};



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
  if (this.layout==="clock") this.drawRegression();
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
    if (layout==="clock") this.drawRegression();
};


/*
 * redraw the tree based on the current xTip, yTip, branch attributes
 * this function will remove branches, move the tips continuously
 * and add the new branches again after the tips arrived at their destination
 *  @params dt -- time of transition in milliseconds
 */
PhyloTree.prototype.updateGeometryFade = function(dt) {
  // fade out branches
  this.svg.selectAll('.branch').filter(function(d) {
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

  this.svg.selectAll('.conf')
    .transition().duration(dt)
    .attr("visibility", this.layout==="rect"?"visible":"hidden")
    .attr("d", function(d) {
      return d.confLine;
    });
};


/**
 * transition of branches and tips at the same time. only useful within a layout
 * @param  dt -- time of transition in milliseconds
 * @return {[type]}
 */
PhyloTree.prototype.updateGeometry = function(dt) {
  this.svg.selectAll('.tip').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .attr("cx", function(d) {
      return d.xTip;
    })
    .attr("cy", function(d) {
      return d.yTip;
    });

  this.svg.selectAll('.branch').filter('.T').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .attr("d", function(d) {
      return d.branch[1];
    });
  this.svg.selectAll('.branch').filter('.S').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .attr("d", function(d) {
      return d.branch[0];
    });


  const xPad = this.params.branchLabelPadX, yPad = this.params.branchLabelPadY;
  const nNIV = this.nNodesInView;
  const bLSFunc = this.callbacks.branchLabelSize;
  const fontFamily = this.params.branchLabelFont;
  const branchLabels = this.params.branchLabels;
  this.svg.selectAll('.branchLabel').filter(function(d) {
      return d.update;
    })
    .transition().duration(dt)
    .attr("x", function(d) {
      return d.xTip - xPad;
    })
    .attr("y", function(d) {
      return d.yTip - yPad;
    })
    .attr("visibility", (this.layout==="rect" && branchLabels)?"visible":"hidden")
    .style("font-family", fontFamily)
    .style("font-size", function(d) {return bLSFunc(d, nNIV);});



  this.svg.selectAll('.conf')
    .transition().duration(dt)
    .attr("visibility", this.layout==="rect"?"visible":"hidden")
    .attr("d", function(d) {
      return d.confLine;
    });

};

/*********************************************/
/* TO BE REDONE */

PhyloTree.prototype.selectBranch = function(node) {
  this.svg.select("#branch_"+node.n.clade)
    .style("stroke-width", function(d) {
      return "4";
    });
};

PhyloTree.prototype.deSelectBranch = function(node) {
  this.svg.select("#branch_"+node.n.clade)
    .style("stroke-width", function(d) {
      console.log(d['stroke-width']);
      return d['stroke-width'] || "2";
    });
};

PhyloTree.prototype.selectTip = function(node) {
  var fill = this.params.fillSelected, r=this.params.radiusSelected;
  this.svg.select("#tip_"+node.n.clade)
    .style("stroke", function(d) {return fill;})
    .style("stroke-dasharray", function(d) {return "2, 2";})
    .style("fill", function(d) { return fill;})
    .attr("cr", function(d) { return r;});
};

PhyloTree.prototype.deSelectTip = function(node) {
  this.svg.select("#tip_"+node.n.clade)
    .style("stroke", function(d) {return "none";})
    .style("stroke-dasharray", function(d) {return "none";})
    .style("fill", function(d) { return d.fill;});
};


PhyloTree.prototype.updateSelectedBranchOrTip = function (oldSelected, newSelected) {
  // console.log("updating something", oldSelected.d.n.clade, newSelected.d.n.clade)
  if (!newSelected || !newSelected || oldSelected.d.n.clade !== newSelected.d.n.clade){
    if (oldSelected) this.deSelectBranch(oldSelected.d);
    if (newSelected && newSelected.type===".branch") this.selectBranch(newSelected.d);

    if (oldSelected) this.deSelectTip(oldSelected.d);
    if (newSelected && newSelected.type===".tip") this.selectTip(newSelected.d);
  }
};

/**
 * Update multiple style or attributes of  tree elements at once
 * @param {string} treeElem one of .tip or .branch
 * @param {object} attr object containing the attributes to change as keys, array with values as value
 * @param {object} styles object containing the styles to change
 * @param {int} dt time in milliseconds
 */
PhyloTree.prototype.updateMultipleArray = function(treeElem, attrs, styles, dt) {
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
