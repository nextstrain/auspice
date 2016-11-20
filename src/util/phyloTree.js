import d3 from "d3";

var PhyloTree = function (treeJson) {
    this.grid=false;
    this.setDefaults();
    this.tree = d3.layout.tree();
    this.nodes = this.tree.nodes(treeJson).map(function(d){return {n:d, x:0, y:0};});
    this.nodes[0].n.parent = this.nodes[0].n;
    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();
    this.numberOfTips = d3.max(this.nodes.map(function(d){return d.n.yvalue;}));
    this.nodes.forEach(function(d){d.terminal = (typeof d.n.children === "undefined");});
    this.nodes.forEach(function(d)
        {
            if (typeof d.n.children==="undefined"){
                d.yRange = [d.n.yvalue, d.n.yvalue];
            }else{
                d.yRange = [d.n.children[0].yvalue, d.n.children[d.n.children.length-1].yvalue];
            }
        });
};


/*
 * set default values.
 */
PhyloTree.prototype.setDefaults = function () {
    this.params = {
        regressionStroke: "#CCC",
        regressionWidth: 3,
        majorGridStroke: "#CCC",
        majorGridWidth: 2,
        minorGridStroke: "#DDD",
        minorGridWidth: 1,
        tickLabelSize: 10,
        tickLabelFill: "#BBB",
        minorTicksTimeTree: 3,
        minorTicks: 4,
        margins: {left:50, right:50, top:50, bottom:50},
        showGrid: true,
    };
};


/*
 * calculate tree layout, scales, and updating of those
 */
PhyloTree.prototype.setDistance = function(attr){
    this.nodes.forEach(function(d){d.update=true});
    if (typeof attr === "undefined"){
        this.distance = "div";
    } else {
        this.distance = attr;
    }
    const tmp_dist = this.distance;
    this.nodes.forEach(function(d) {d.depth = d.n.attr[tmp_dist];});
    this.nodes.forEach(function(d) {d.pDepth = d.n.parent.attr[tmp_dist];});
};

PhyloTree.prototype.rectangularLayout = function(){
    this.nodes.forEach(function (d) {
        d.y = d.n.yvalue;
        d.x = d.depth;
        d.px = d.pDepth;
        d.py = d.y;
    });
};

PhyloTree.prototype.timeVsRootToTip = function(){
    this.setDistance("num_date");
    this.nodes.forEach(function (d) {
        d.y = d.n.attr["div"];
        d.x = d.depth;
        d.px = d.pDepth;
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
        .style("font-size",this.params.tickLabelSize);
}

PhyloTree.prototype.radialLayout = function(){
    const nTips=this.numberOfTips;
    const offset = this.nodes[0].depth;
    this.nodes.forEach(function (d) {
        const angle = 2.0*0.95*Math.PI*d.n.yvalue/nTips;
        const angleCBar1 = 2.0*0.95*Math.PI*d.yRange[0]/nTips;
        const angleCBar2 = 2.0*0.95*Math.PI*d.yRange[1]/nTips;
        d.y = (d.depth-offset)*Math.cos(angle);
        d.x = (d.depth-offset)*Math.sin(angle);
        d.py = d.y*(d.pDepth-offset)/(d.depth-offset);
        d.px = d.x*(d.pDepth-offset)/(d.depth-offset);
        d.yCBarStart = (d.depth-offset)*Math.cos(angleCBar1);
        d.xCBarStart = (d.depth-offset)*Math.sin(angleCBar1);
        d.yCBarEnd = (d.depth-offset)*Math.cos(angleCBar2);
        d.xCBarEnd = (d.depth-offset)*Math.sin(angleCBar2);
        d.smallBigArc = Math.abs(angleCBar2 - angleCBar1)>Math.Pi*0.5;
    });
};

PhyloTree.prototype.mapToScreen = function(){
    this.setScales(this.params.margins);
    const tmp_xValues = this.nodes.map(function(d){return d.x});
    const tmp_yValues = this.nodes.map(function(d){return d.y});
    if (this.layout==="radial"){
        const maxSpan = d3.max([-d3.min(tmp_xValues), d3.max(tmp_xValues),
                                -d3.min(tmp_yValues), d3.max(tmp_yValues)]);
        this.xScale.domain([-maxSpan, maxSpan]);
        this.yScale.domain([-maxSpan, maxSpan]);
    }else if (this.layout==="rootToTip"){
        this.xScale.domain([d3.min(tmp_xValues), d3.max(tmp_xValues)]);
        this.yScale.domain([d3.max(tmp_yValues), d3.min(tmp_yValues)]);
    }else{
        this.xScale.domain([d3.min(tmp_xValues), d3.max(tmp_xValues)]);
        this.yScale.domain([d3.min(tmp_yValues), d3.max(tmp_yValues)]);
    }

    const tmp_xScale=this.xScale;
    const tmp_yScale=this.yScale;
    this.nodes.forEach(function(d){d.xTip = tmp_xScale(d.x)});
    this.nodes.forEach(function(d){d.yTip = tmp_yScale(d.y)});
    this.nodes.forEach(function(d){d.xBase = tmp_xScale(d.px)});
    this.nodes.forEach(function(d){d.yBase = tmp_yScale(d.py)});

    if (this.layout==="rootToTip"){
        this.nodes.forEach(function(d){d.branch =" M "+d.xBase.toString()+","+d.yBase.toString()+
                                                 " L "+d.xTip.toString()+","+d.yTip.toString();});
    } else if (this.layout==="rectangular"){
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])});
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])});
        this.nodes.forEach(function(d){d.branch =" M "+d.xBase.toString()+","+d.yBase.toString()+
                                                 " L "+d.xTip.toString()+","+d.yTip.toString()+
                                                 " M "+d.xTip.toString()+","+d.cBarStart.toString()+
                                                 " L "+d.xTip.toString()+","+d.cBarEnd.toString();});
    } else if (this.layout==="radial"){
        const offset = this.nodes[0].depth;
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])});
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])});
        this.nodes.forEach(function(d){
            if (d.terminal){
                d.branch =" M "+d.xBase.toString()+" "+d.yBase.toString()+
                          " L "+d.xTip.toString()+" "+d.yTip.toString();
            }else{
                d.branch =" M "+d.xBase.toString()+" "+d.yBase.toString()+
                          " L "+d.xTip.toString()+" "+d.yTip.toString() +
                         " M "+tmp_xScale(d.xCBarStart).toString()+" "+tmp_yScale(d.yCBarStart).toString()+
                         " A "+(tmp_xScale(d.depth)-tmp_xScale(offset)).toString()+" "+(tmp_yScale(d.depth)-tmp_yScale(offset)).toString()
                         +" 0 "+(d.smallBigArc?"1 ":"0 ") +" 1 "+
                         " "+tmp_xScale(d.xCBarEnd).toString()+","+tmp_yScale(d.yCBarEnd).toString();
            }
        });
    }
};

PhyloTree.prototype.setLayout = function(layout){
    if (typeof layout==="undefined" || layout!==this.layout){
        this.nodes.forEach(function(d){d.update=true});
    }
    if (typeof layout==="undefined"){
        this.layout = "rectangular";
    }else {
        this.layout = layout;
    }
    if (this.layout==="rectangular"){
        this.rectangularLayout();
    } else if (this.layout==="rootToTip"){
        this.timeVsRootToTip();
    } else if (this.layout==="radial"){
        this.radialLayout();
    }
};

PhyloTree.prototype.setScales = function(margins){
    const width = parseInt(this.svg.attr("width"), 10);
    const height = parseInt(this.svg.attr("height"), 10);
    if (this.layout==="radial"){
        //Force Square
        const xExtend = width-(margins["left"]||0)-(margins["right"]||0);
        const yExtend = height-(margins["top"]||0)-(margins["top"]||0);
        const minExtend = d3.min([xExtend, yExtend]);
        const xSlack = xExtend - minExtend;
        const ySlack = yExtend - minExtend;
        this.xScale.range([0.5*xSlack + margins["left"]||0, width  - 0.5*xSlack - (margins["right"]||0)]);
        this.yScale.range([0.5*ySlack + margins["top"]||0,  height - 0.5*ySlack - (margins["bottom"]||0)]);

    }else{
        this.xScale.range([margins["left"]||0, width - (margins["right"]||0)]);
        this.yScale.range([margins["top"]||0, height - (margins["bottom"]||0)]);
    }
};

PhyloTree.prototype.updateDistance = function(attr,dt){
    this.setDistance(attr);
    this.setLayout(this.layout);
    this.mapToScreen();
    this.updateGeometry(dt);
    if (this.grid) this.addGrid(this.layout);
    this.svg.selectAll(".regression").remove();
    if (this.layout==="rootToTip") this.drawRegression();
};

PhyloTree.prototype.updateLayout = function(layout,dt){
    this.setLayout(layout);
    this.mapToScreen();
    this.updateGeometryFade(dt);
    if (this.grid) this.addGrid(layout);
    this.svg.selectAll(".regression").remove();
    if (layout==="rootToTip") this.drawRegression();
};

/*
 * make grid
 */
PhyloTree.prototype.removeGrid = function () {
    this.svg.selectAll(".majorGrid").remove();
    this.svg.selectAll(".minorGrid").remove();
    this.svg.selectAll(".gridTick").remove();
    this.grid=false;
}

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
            if (layout==="rectangular" || layout==="rootToTip"){
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

    if (this.layout==="rootToTip"){
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

    const gridLabels = this.svg.selectAll('.gridTick').data(gridPoints);
    gridLabels.exit().remove();
    gridLabels.enter().append("text");
    gridLabels
        .text(function(d){return d[0].toString();})
        .attr("class", "gridTick")
        .style("font-size",this.params.tickLabelSize)
        .style("fill",this.params.tickLabelFill)
        .style("text-anchor", this.layout==="radial" ? "end" : "start")
        .style("visibility", function (d){return d[1];})
        .attr("x", xTextPos(this.xScale, layout))
        .attr("y", yTextPos(this.yScale, layout));

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


    this.grid=true;
};

/*
 * basic update of positions of elements in tree
 */
PhyloTree.prototype.updateGeometryFade = function(dt){
    this.svg.selectAll('.branch').filter(function (d) {return d.update;})
        .transition().duration(dt*0.5)
        .style("opacity", 0.0);

    const tipTrans = function(tmp_svg, tmp_dt){
        const svg = tmp_svg;
        return function(){
            svg.selectAll('.tip').filter(function (d) {return d.update;})
                .transition().duration(tmp_dt)
                .attr("cx", function(d){return d.xTip;})
                .attr("cy", function(d){return d.yTip;});
        };
    };
    setTimeout(tipTrans(this.svg, dt), 0.5*dt);


    const flipBranches = function(tmp_svg){
        const svg = tmp_svg;
        return  function(){svg.selectAll('.branch').filter(function (d) {return d.update;})
                              .attr("d", function(d){return d.branch;});};
    };
    setTimeout(flipBranches(this.svg), 0.5*dt);

    const fadeBack = function(tmp_svg, tmp_dt){
        const svg = tmp_svg;
        return  function(d){svg.selectAll('.branch').filter(function (d) {return d.update;})
                .transition().duration(0.5*tmp_dt)
                .style("opacity",1.0)};
    };
    setTimeout(fadeBack(this.svg, 0.2*dt),1.5*dt);
};

PhyloTree.prototype.updateGeometry = function(dt){
    this.svg.selectAll('.tip').filter(function (d) {return d.update;})
        .transition().duration(dt)
        .attr("cx", function(d){return d.xTip;})
        .attr("cy", function(d){return d.yTip;});

    this.svg.selectAll('.branch').filter(function (d) {return d.update;})
        .transition().duration(dt)
        .attr("d", function(d){return d.branch;});
};

/*
 * update tree element style of attributes
 */
PhyloTree.prototype.updateMultipleArray = function(treeElem, attrs, styles, dt) {
    this.nodes.forEach(function (d,i){
        d.update=false;
        let newAttr;
        for (var attr in attrs){
            newAttr = attrs[attr][i];
            if (newAttr!==d[attr]){
                d[attr]=newAttr;
                d.update = true;
            }
        }
        let newStyle;
        for (var prop in styles){
            newStyle = styles[prop][i];
            if (newStyle!==d[prop]){
                d[prop]=newStyle;
                d.update = true;
            }
        }
    });
    function update(attrToSet, stylesToSet){
        return function(selection){
            for (var i=0; i<stylesToSet.length; i+=1){
                var prop = stylesToSet[i];
                selection.style(prop, function(d){return d[prop];});
            }
            for (var i=0; i<attrToSet.length; i+=1){
                var prop = attrToSet[i];
                selection.attr(prop, function(d){return d[prop];});
            }
        };
    };
    this.svg.selectAll(treeElem).filter(function (d) {return d.update;})
        .transition().duration(dt)
        .call(update(Object.keys(attrs), Object.keys(styles)));

};

PhyloTree.prototype.updateAttribute = function(treeElem, attr, callback, dt){
    this.updateAttributeArray(treeElem, attr,
        this.nodes.map(function(d){return callback(d);}), dt);
};

PhyloTree.prototype.updateAttributeArray= function(treeElem, attr, attr_array, dt){
    this.nodes.forEach(function(d,i){
        const newAttr = attr_array[i];
        if (newAttr===d[attr]){
            d.update=false;
        }else{
            d[attr]=newAttr;
            d.update=true;
        }
    });
    this.redrawAttribute(treeElem, attr, dt);
};

PhyloTree.prototype.redrawAttribute = function(treeElem, attr, dt){
    this.svg.selectAll(treeElem).filter(function (d) {return d.update;})
        .transition().duration(dt)
        .attr(attr, function(d){return d[attr];});
};

PhyloTree.prototype.updateStyle= function(treeElem, styleElem, callback, dt){
    this.updateStyleArray(treeElem, attr,
        this.nodes.map(function(d){return callback(d);}), dt);
};

PhyloTree.prototype.updateStyleArray= function(treeElem, styleElem, style_array, dt){
    this.nodes.forEach(function(d,i){
        const newStyle = style_array[i];
        if (newStyle===d[styleElem]){
            d.update=false;
        }else{
            d[styleElem]=newStyle;
            d.update=true;
        }
    });
    this.redrawStyle(treeElem, styleElem, dt);
};

PhyloTree.prototype.redrawStyle = function(treeElem, styleElem, dt){
    this.svg.selectAll(treeElem).filter(function (d) {return d.update;})
        .transition().duration(dt)
        .style(styleElem, function(d){return d[styleElem];});
};

/*
 * add and remove elements from tree, initial render
 */
PhyloTree.prototype.clearSVG = function (){
    this.svg.selectAll('.tip').remove();
    this.svg.selectAll('.branch').remove();
};

PhyloTree.prototype.tips = function(){
    this.tipElements = this.svg.append("g").selectAll('.tip')
        .data(this.nodes.filter(function (d){return d.terminal;}))
        .enter()
        .append("circle")
        .attr("class", "tip")
        .attr("id", function(d){return d.n.clade;})
        .attr("cx", function(d){return d.xTip;})
        .attr("cy", function(d){return d.yTip;})
        .attr("r", function(d){return d.r||5;})
        .style("fill",function (d) {return d.fill||"#CCC";})
        .style("stroke",function (d) {return d.stroke||"#AAA";})
        .style("stroke-width", function(d){return d.strokeWidth||2;});
};

PhyloTree.prototype.branches = function(){
    this.branches = this.svg.append("g").selectAll('.branch')
        .data(this.nodes)
        .enter()
        .append("path")
        .attr("class", "branch")
        .attr("id", function(d){return d.n.clade;})
        .attr("d", function(d){return d.branch;})
        .style("stroke",function (d) {return d.stroke||"#AAA";})
        .style("fill","none")
        .style("stroke-width", function(d){return d.strokeWidth||2;});
};

PhyloTree.prototype.render = function(svg, layout, distance, options) {
    this.svg = svg;
    this.params = Object.assign(this.params, options);

    this.clearSVG();
    this.setDistance(distance);
    this.setLayout(layout);
    this.mapToScreen();
    if (this.params.showGrid){
        this.addGrid();
    }
    this.branches();
    this.tips();
    this.updateGeometry(10);
    this.svg.selectAll(".regression").remove();
    if (layout==="rootToTip") this.drawRegression();
};

export default PhyloTree;
