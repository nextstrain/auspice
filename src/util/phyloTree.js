import d3 from "d3";

var PhyloTree = function (treeJson) {
    console.log("instantiating tree");
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

PhyloTree.prototype.setDistance = function(attr){
    console.log("distance", attr);
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
    if (this.layout==="rectangular"){
        console.log("setLayout", "rectangular", this.xScale.domain());
        this.nodes.forEach(function(d){d.cBarStart = tmp_yScale(d.yRange[0])});
        this.nodes.forEach(function(d){d.cBarEnd = tmp_yScale(d.yRange[1])});
        this.nodes.forEach(function(d){d.branch =" M "+d.xBase.toString()+","+d.yBase.toString()+
                                                 " L "+d.xTip.toString()+","+d.yTip.toString()+
                                                 " M "+d.xTip.toString()+","+d.cBarStart.toString()+
                                                 " L "+d.xTip.toString()+","+d.cBarEnd.toString();})
    } else if (this.layout==="radial"){
        const offset = this.nodes[0].depth;
        console.log("setLayout", "rectangular", this.xScale.domain());
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

PhyloTree.prototype.tips = function(){
    this.tipElements = this.svg.selectAll('.tip')
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
    this.branches = this.svg.selectAll('.branch')
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


PhyloTree.prototype.updateDistance = function(attr,dt){
    this.setDistance(attr);
    this.setLayout(this.layout);
    this.mapToScreen();
    this.updateGeometry(dt);
};

PhyloTree.prototype.updateLayout = function(layout,dt){
    this.setLayout(layout);
    this.mapToScreen();
    this.updateGeometryFade(dt);
};

PhyloTree.prototype.updateAttribute= function(treeElem, attr, callback, dt){
    this.nodes.forEach(function(d){
        const newAttr = callback(d);
        if (newAttr===d[attr]){
            d.update=false;
        }else{
            d[attr]=newAttr;
            d.update=true;
        }
    });
    this.redrawAttribute(treeElem, attr, dt);
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
    this.nodes.forEach(function(d){
        const newStyle = callback(d);
        if (newStyle===d[styleElem]){
            d.update=false;
        }else{
            d[styleElem]=newStyle;
            d.update=true;
        }
    });
    this.redrawStyle(treeElem, styleElem, dt);
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

PhyloTree.prototype.clearSVG = function (){
    this.svg.selectAll('.tip').remove();
    this.svg.selectAll('.branch').remove();
};

PhyloTree.prototype.render = function(svg, layout, distance) {
    this.svg = svg;
    this.clearSVG();
    this.setScales({left:10, right:100, top:10, bottom:10});
    this.setDistance(distance);
    this.setLayout(layout);
    this.mapToScreen();
    this.branches();
    this.tips();
    this.updateGeometry(10);
    console.log("render done");
};

export default PhyloTree;
