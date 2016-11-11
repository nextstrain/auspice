import d3 from "d3";

var PhyloTree = function (treeJson) {
    console.log("PhyloTree: instantiating");
    this.grid=false;
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
 * calculate tree layout, scales, and updating of those
 */
PhyloTree.prototype.setDistance = function(attr){
    console.log("PhyloTree.setDistance", attr);
    if (typeof attr!=="undefined" && attr===this.distance){
        this.nodes.forEach(function(d){d.update=false});
        return;
    }else{
        this.nodes.forEach(function(d){d.update=true});
    }
    if (typeof attr === "undefined"){
        this.distance = "div";
    } else {
        this.distance = attr;
    }
    const tmp_dist = this.distance;
    this.nodes.forEach(function(d) {d.depth = d.n.attr[tmp_dist];})
    this.nodes.forEach(function(d) {d.pDepth = d.n.parent.attr[tmp_dist];})
};

PhyloTree.prototype.rectangularLayout = function(){
    this.nodes.forEach(function (d) {
        d.y = d.n.yvalue;
        d.x = d.depth;
        d.px = d.pDepth;
        d.py = d.y;
    });
};

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
    const tmp_xScale=this.xScale;
    const tmp_yScale=this.yScale;
    const tmp_xValues = this.nodes.map(function(d){return d.x});
    const tmp_yValues = this.nodes.map(function(d){return d.y});

    this.xScale.domain([d3.min(tmp_xValues), d3.max(tmp_xValues)]);
    this.yScale.domain([d3.min(tmp_yValues), d3.max(tmp_yValues)]);
    this.nodes.forEach(function(d){d.xTip = tmp_xScale(d.x)});
    this.nodes.forEach(function(d){d.yTip = tmp_yScale(d.y)});
    this.nodes.forEach(function(d){d.xBase = tmp_xScale(d.px)});
    this.nodes.forEach(function(d){d.yBase = tmp_yScale(d.py)});
    console.log("PhyloTree.mapToScreen", this.layout,
                "xScale domain", this.xScale.domain());
    if (this.layout==="rectangular"){
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])});
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])});
        this.nodes.forEach(function(d){d.branch =" M "+d.xBase.toString()+","+d.yBase.toString()+
                                                 " L "+d.xTip.toString()+","+d.yTip.toString()+
                                                 " M "+d.xTip.toString()+","+d.cBarStart.toString()+
                                                 " L "+d.xTip.toString()+","+d.cBarEnd.toString();})
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
    } else if (this.layout==="radial"){
        this.radialLayout();
    }
};

PhyloTree.prototype.setScales = function(margins){
    const width = parseInt(this.svg.attr("width"), 10);
    const height = parseInt(this.svg.attr("height"), 10);
    this.xScale.range([margins["left"]||0, width - (margins["right"]||0)]);
    this.yScale.range([margins["top"]||0, height - (margins["bottom"]||0)]);
};

PhyloTree.prototype.updateDistance = function(attr,dt){
    this.setDistance(attr);
    this.setLayout(this.layout);
    this.mapToScreen();
    this.updateGeometry(dt);
    if (this.grid) this.addGrid(this.layout);
};

PhyloTree.prototype.updateLayout = function(layout,dt){
    this.setLayout(layout);
    this.mapToScreen();
    this.updateGeometryFade(dt);
    if (this.grid) this.addGrid(layout);
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
    console.log("adding grid");
    this.removeGrid();
    if (typeof layout==="undefined"){ layout=this.layout;}

    this.majorGridWidth = 2;
    this.minorGridWidth = 1;
    this.gridColor="#AAA";

    const xmin = (this.xScale.domain()[0]>0)?this.xScale.domain()[0]:0.0;
    const xmax = this.xScale.domain()[1];
    const offset = layout==="radial"?this.nodes[0].depth:0.0;

    const gridline = function(xScale, yScale, layout){
        return function(x){
            const xPos = xScale(x-offset);
            let tmp_d="";
            if (layout==="rectangular"){
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
                (yScale(x) - yScale(offset)).toString() +
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
    for (let ii = 0; ii <= (xmax + offset - gridMin)/roundingLevel+0.4; ii++) {
      if (gridMin + roundingLevel*ii>offset){
          gridPoints.push(gridMin + roundingLevel*ii);
      }
    }

    this.svg.selectAll('.majorGrid').data(gridPoints).enter()
        .append("path")
        .attr("d", gridline(this.xScale, this.yScale, layout))
        .attr("class", "majorGrid")
        .attr("z-index", 0)
        .style("fill", "none")
        .style("stroke",this.gridColor)
        .style("stroke-width",this.majorGridWidth);

    const xTextPos = function(xScale, layout){
        return function(x){return layout==="rectangular" ? xScale(x) : xScale(0);};};
    const yTextPos = function(yScale, layout){
        return function(x){ return layout==="rectangular" ? yScale.range()[1]+18 : yScale(x-offset);};};
    this.svg.selectAll('.gridTick').data(gridPoints).enter()
        .append("text")
        .text(function(d){return d.toString();})
        .attr("class", "gridTick")
        .style("font-size",12)
        .style("fill",this.gridColor)
        .style("text-anchor", this.layout==="rectangular" ? "start" : "end")
        .attr("x", xTextPos(this.xScale, layout))
        .attr("y", yTextPos(this.yScale, layout));

    const minorRoundingLevel = roundingLevel / (this.distanceMeasure === "div" ? 5 : 6);
    const minorGridPoints = [];
    for (let ii = 0; ii <= (xmax + offset - gridMin)/minorRoundingLevel+3; ii++) {
      if (gridMin + minorRoundingLevel*ii>offset){
          minorGridPoints.push(gridMin + minorRoundingLevel*ii);
      }
    }
    this.svg.selectAll('.minorGrid').data(minorGridPoints).enter()
        .append("path")
        .attr("d", gridline(this.xScale, this.yScale, layout))
        .attr("class", "minorGrid")
        .attr("z-index", 0)
        .style("fill", "none")
        .style("stroke",this.gridColor)
        .style("stroke-width",this.minorGridWidth);
    this.grid=true;
};

/*
 * basic update of positions of elements in tree
 */
PhyloTree.prototype.updateGeometryFade = function(dt){
    this.svg.selectAll('.branch').filter(function (d) {return d.update;})
        .transition().duration(dt*0.5)
        .style("stroke", "#FFF");

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
                .style("stroke",function (d) {return d.stroke||"#AAA";})};
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
    console.log("redraw",this.nodes.filter(function (d) {return d.update;}).length);
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
    console.log("PhyloTree.render", this.svg);
    this.clearSVG();
    this.setScales(options.margins||{left:200, right:50, top:50, bottom:50});
    this.setDistance(distance);
    this.setLayout(layout);
    this.mapToScreen();
    this.branches();
    this.tips();
    if (options && options.grid){
        this.addGrid();
    }
    this.updateGeometry(10);
};

export default PhyloTree;
