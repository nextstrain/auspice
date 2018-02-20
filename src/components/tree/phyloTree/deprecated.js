/* eslint-disable */
/* these functions are either deprecated or were in the code base but never called! */

/**
 * hide branchLabels
 */
export const hideBranchLabels = function hideBranchLabels() {
  this.params.showBranchLabels = false;
  this.svg.selectAll(".branchLabel").style('visibility', 'hidden');
};

/**
 * show branchLabels
 */
export const showBranchLabels = function showBranchLabels() {
  this.params.showBranchLabels = true;
  this.svg.selectAll(".branchLabel").style('visibility', 'visible');
};


/**
 * hide tipLabels - this function is never called!
 */
PhyloTree.prototype.hideTipLabels = function() {
  this.params.showTipLabels=false;
  this.svg.selectAll(".tipLabel").style('visibility', 'hidden');
};

/**
 * show tipLabels - this function is never called!
 */
PhyloTree.prototype.showTipLabels = function() {
  this.params.showTipLabels=true;
  this.svg.selectAll(".tipLabel").style('visibility', 'visible');
};

// CALLBACK
/**
 * @param  {node} d tree node object
 * @return {string} displayed as label on the branch corresponding to the node
 */
export const branchLabel = function branchLabel(d) {
  if (d.n.muts) {
    if (d.n.muts.length > 5) {
      return d.n.muts.slice(0, 5).join(", ") + "...";
    }
    return d.n.muts.join(", ");
  }
  return "";
};


PhyloTree.prototype.drawTipLabels = function() {
  var params = this.params;
  const tLFunc = this.callbacks.tipLabel;
  const inViewTerminalNodes = this.nodes
                  .filter(function(d){return d.terminal;})
                  .filter(function(d){return d.inView;});
  console.log(`there are ${inViewTerminalNodes.length} nodes in view`)
  this.tipLabels = this.svg.append("g").selectAll('.tipLabel')
    .data(inViewTerminalNodes)
    .enter()
    .append("text")
    .text(function (d){return tLFunc(d);})
    .attr("class", "tipLabel");
}

PhyloTree.prototype.drawBranchLabels = function() {
  var params = this.params;
  const bLFunc = this.callbacks.branchLabel;
  this.branchLabels = this.svg.append("g").selectAll('.branchLabel')
    .data(this.nodes) //.filter(function (d){return bLFunc(d)!=="";}))
    .enter()
    .append("text")
    .text(function (d){return bLFunc(d);})
    .attr("class", "branchLabel")
    .style("text-anchor","end");
}


export const updateConfidence = function updateConfidence(dt) {
  console.warn("updateConfidence is deprecated.");
  if (dt) {
    this.svg.selectAll(".conf")
      .transition().duration(dt)
      .style("stroke", (el) => el.stroke)
      .style("stroke-width", calcConfidenceWidth);
  } else {
    this.svg.selectAll(".conf")
      .style("stroke", (el) => el.stroke)
      .style("stroke-width", calcConfidenceWidth);
  }
};

export const viewEntireTree = function viewEntireTree() {
  console.warn("viewEntireTree is deprecated.")
  /* reset the SVGPanZoom */
  this.Viewer.fitToViewer();
  /* imperitively manipulate SVG tree elements */
  this.state.tree.zoomIntoClade(this.state.tree.nodes[0], mediumTransitionDuration);
  /* update branch thicknesses / tip vis after SVG tree elemtents have moved */
  window.setTimeout(
    () => this.props.dispatch(updateVisibleTipsAndBranchThicknesses({idxOfInViewRootNode: 0})),
    mediumTransitionDuration
  );
  this.setState({selectedBranch: null, selectedTip: null});
};

/**
 * zoom out a little by using the parent of the current clade
 * as a zoom focus.
 * @param  {int} dt [transition time]
 */
export const zoomToParent = function zoomToParent(dt) {
  console.warn("TODO: zoomToParent functionality needs to be built into phylotree.change()");
  if (this.zoomNode) {
    this.zoomIntoClade(this.zoomNode.parent, dt);
  }
};

/**
 * zoom such that a particular clade fills the svg
 * @param  clade -- branch/node at the root of the clade to zoom into
 * @param  dt -- time of the transition in milliseconds
 * @return {null}
 */
export const zoomIntoClade = function zoomIntoClade(clade, dt) {
  console.warn("zoomIntoClade is deprecated. Please use phylotree.change()");
  // assign all nodes to inView false and force update
  this.zoomNode = clade;
  this.nodes.forEach((d) => {
    d.inView = false;
    d.update = true;
  });
  // assign all child nodes of the chosen clade to inView=true
  // if clade is terminal, apply to parent
  if (clade.terminal) {
    applyToChildren(clade.parent, (d) => {d.inView = true;});
  } else {
    applyToChildren(clade, (d) => {d.inView = true;});
  }
  // redraw
  this.mapToScreen();
  this.updateGeometry(dt);
  if (this.grid) this.addGrid(this.layout);
  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
  if (this.params.branchLabels) {
    this.updateBranchLabels(dt);
  }
  this.updateTipLabels(dt);
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
export const updateStyleOrAttribute = function updateStyleOrAttribute(treeElem, attr, callback, dt, styleOrAttribute) {
  console.warn("updateStyleOrAttribute is deprecated. use phylotree.change instead.")
  const attr_array = this.nodes.map((d) => callback(d));
  this.updateStyleOrAttributeArray(treeElem, attr, attr_array, dt, styleOrAttribute);
};

const contains = (array, elem) => array.some((d) => d === elem);

/**
 * update an attribute of the tree for all nodes
 * @param  treeElem  --- the part of the tree to update (.tip, .branch)
 * @param  attr  --- the attribute to update (e.g. r for tipRadius)
 * @param  attr_array  --- an array with values for every node in the tree
 * @param  dt  --- time of transition in milliseconds
 * @return {[type]}
 */
export const updateStyleOrAttributeArray = function updateStyleOrAttributeArray(treeElem, attr, attr_array, dt, styleOrAttribute) {
  console.warn("updateStyleOrAttributeArray is deprecated. use phylotree.change instead.")
  timerStart("updateStyleOrAttributeArray");
  this.nodes.forEach((d, i) => {
    const newAttr = attr_array[i];
    if (newAttr === d[attr]) {
      d.update = false;
    } else {
      d[attr] = newAttr;
      d.update = true;
    }
  });
  if (typeof styleOrAttribute === "undefined") {
    styleOrAttribute = contains(this.attributes, attr) ? "attr" : "style"; // eslint-disable-line no-param-reassign
  }
  if (styleOrAttribute === "style") {
    this.redrawStyle(treeElem, attr, dt);
  } else {
    this.redrawAttribute(treeElem, attr, dt);
  }
  timerEnd("updateStyleOrAttributeArray");
};


/**
 * call to change the distance measure
 * @param  attr -- attribute to be used as a distance measure, e.g. div or num_date
 * @param  dt -- time of transition in milliseconds
 * @return null
 */
export const updateDistance = function updateDistance(attr, dt) {
  console.warn("updateDistance is deprecated. use phylotree.change instead.")
  this.setDistance(attr);
  this.setLayout(this.layout);
  this.mapToScreen();
  this.updateGeometry(dt);
  if (this.grid && this.layout !== "unrooted") this.addGrid(this.layout);
  else this.hideGrid();
  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
};


/**
 * call to change the layout
 * @param  layout -- needs to be one of "rect", "radial", "unrooted", "clock"
 * @param  dt -- time of transition in milliseconds
 * @return null
 */
export const updateLayout = function updateLayout(layout, dt) {
  console.warn("updateLayout is deprecated");
  this.setLayout(layout);
  this.mapToScreen();
  this.updateGeometryFade(dt);
  if (this.grid && this.layout !== "unrooted") this.addGrid(layout);
  else this.hideGrid();
  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
};


/**
 * transition of branches and tips at the same time. only useful within a layout
 * @param  dt -- time of transition in milliseconds
 * @return {[type]}
 */
export const updateGeometry = function updateGeometry(dt) {
  console.warn("updateGeometry is deprecated. use phylotree.change instead.")
  timerStart("updateGeometry");
  this.svg.selectAll(".tip")
    .filter((d) => d.update)
    .transition()
    .duration(dt)
    .attr("cx", (d) => d.xTip)
    .attr("cy", (d) => d.yTip);

  if (this.vaccines) {
    this.svg.selectAll(".vaccineCross")
      .transition().duration(dt)
      .attr("d", (dd) => dd.vaccineCross);
    this.svg.selectAll(".vaccineDottedLine")
      .transition().duration(dt)
      .style("opacity", () => this.distance === "num_date" ? 1 : 0)
      .attr("d", (dd) => dd.vaccineLine);
  }

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
    .transition().duration(dt)
    .attr("d", (dd) => dd.confLine);

  this.updateBranchLabels(dt);
  this.updateTipLabels(dt);
  timerEnd("updateGeometry");
};


/*
 * redraw the tree based on the current xTip, yTip, branch attributes
 * step 1: fade out everything except tips.
 * step 2: when step 1 has finished, move tips across the screen.
 * step 3: when step 2 has finished, move everything else (whilst hidden) and fasde back in.
 *  @params dt -- time of tip move (ms). Note that this function will take a lot longer than this time!
 */
export const updateGeometryFade = function updateGeometryFade(dt) {
  const fadeDt = dt * 0.5;
  const moveDt = dt;

  let inProgress = 0; /* counter of transitions currently in progress */
  const moveElementsAndFadeBackIn = () => {
    if (!--inProgress) { /* decrement counter. When hits 0 run block */
      this.svg.selectAll('.branch').filter('.S')
        .filter((d) => d.update)
        .attr("d", (d) => d.branch[0])
        .transition()
        .duration(fadeDt)
        .style("opacity", 1.0);
      this.svg.selectAll('.branch').filter('.T')
        .filter((d) => d.update)
        .attr("d", (d) => d.branch[1])
        .transition()
        .duration(fadeDt)
        .style("opacity", 1.0);
      if (this.vaccines) {
        this.svg.selectAll('.vaccineCross')
          .attr("d", (dd) => dd.vaccineCross)
          .transition()
          .duration(fadeDt)
          .style("opacity", 1.0);
        if (this.distance === "num_date") {
          this.svg.selectAll('.vaccineDottedLine')
            .attr("d", (dd) => dd.vaccineLine)
            .transition()
            .duration(fadeDt)
            .style("opacity", 1.0);
        } else {
          this.svg.selectAll('.vaccineDottedLine')
            .attr("d", (dd) => dd.vaccineLine);
          /* opacity is already 0 */
        }
      }
      this.updateBranchLabels(fadeDt);
      this.updateTipLabels(fadeDt);
    }
  };
  const moveTipsWhenFadedOut = () => {
    if (!--inProgress) { /* decrement counter. When hits 0 run block */
      this.svg.selectAll('.tip')
        .filter((d) => d.update)
        .transition()
        .duration(moveDt)
        .attr("cx", (d) => d.xTip)
        .attr("cy", (d) => d.yTip)
        .on("start", () => inProgress++)
        .on("end", moveElementsAndFadeBackIn);
    }
  };

  /* fade out branches, tip & branch labels, vaccine crosses & dotted lines.
  When these fade outs are complete, the function moveTipsWhenFadedOut will fire */
  this.removeConfidence();
  this.svg.selectAll('.branch')
    .filter((d) => d.update)
    .transition().duration(fadeDt)
    .style("opacity", 0.0)
    .on("start", () => inProgress++)
    .on("end", moveTipsWhenFadedOut);
  this.svg.selectAll('.branchLabels')
    .filter((d) => d.update)
    .transition().duration(fadeDt)
    .style("opacity", 0.0)
    .on("start", () => inProgress++)
    .on("end", moveTipsWhenFadedOut);
  this.svg.selectAll('.tipLabels')
    .filter((d) => d.update)
    .transition().duration(fadeDt)
    .style("opacity", 0.0)
    .on("start", () => inProgress++)
    .on("end", moveTipsWhenFadedOut);
  if (this.vaccines) {
    this.svg.selectAll('.vaccineCross')
      .transition().duration(fadeDt)
      .style("opacity", 0.0)
      .on("start", () => inProgress++)
      .on("end", moveTipsWhenFadedOut);
    this.svg.selectAll('.vaccineDottedLine')
      .transition().duration(fadeDt)
      .style("opacity", 0.0)
      .on("start", () => inProgress++)
      .on("end", moveTipsWhenFadedOut);
  }
};


/**
 * Update multiple style or attributes of tree elements at once
 * @param {string} treeElem one of .tip or .branch
 * @param {object} attr object containing the attributes to change as keys, array with values as value
 * @param {object} styles object containing the styles to change
 * @param {int} dt time in milliseconds
 */
export const updateMultipleArray = function updateMultipleArray(treeElem, attrs, styles, dt, quickdraw) {
  console.warn("updateMultipleArray is deprecated. use phylotree.change instead.")
  timerStart("updateMultipleArray");
  // assign new values and decide whether to update
  this.nodes.forEach((d, i) => {
    d.update = false;
    /* note that this is not node.attr, but element attr such as <g width="100" vs style="" */
    let newAttr;
    for (let attr in attrs) { // eslint-disable-line
      newAttr = attrs[attr][i];
      if (newAttr !== d[attr]) {
        d[attr] = newAttr;
        d.update = true;
      }
    }
    let newStyle;
    for (let prop in styles) { // eslint-disable-line
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

  // HOF that returns the closure object for updating the svg
  const updateSVGHOF = (attrToSet, stylesToSet) => (selection) => {
    for (let i = 0; i < stylesToSet.length; i++) {
      const prop = stylesToSet[i];
      selection.style(prop, (d) => d[prop]);
    }
    for (let i = 0; i < attrToSet.length; i++) {
      const prop = attrToSet[i];
      selection.attr(prop, (d) => d[prop]);
    }
    if (updatePath) {
      selection.filter('.S').attr("d", (d) => d.branch[0]);
    }
  };
  // update the svg via the HOF we just created
  if (dt) {
    this.svg.selectAll(treeElem)
      .filter((d) => d.update)
      .transition().duration(dt)
      .call(updateSVGHOF(Object.keys(attrs), Object.keys(styles)));
  } else {
    this.svg.selectAll(treeElem)
      .filter((d) => d.update)
      .call(updateSVGHOF(Object.keys(attrs), Object.keys(styles)));
  }
  timerEnd("updateMultipleArray");
};


/**
 * update the svg after all new values have been assigned
 * @param  treeElem -- one of .tip, .branch
 * @param  attr  -- attribute of the tree element to update
 * @param  dt -- transition time
 */
export const redrawAttribute = function redrawAttribute(treeElem, attr, dt) {
  console.warn("redrawAttribute is deprecated. use phylotree.change instead.")
  this.svg.selectAll(treeElem)
    .filter((d) => d.update)
    .transition()
    .duration(dt)
    .attr(attr, (d) => d[attr]);
};


/**
 * update the svg after all new values have been assigned
 * @param  treeElem -- one of .tip, .branch
 * @param  styleElem  -- style element of the tree element to update
 * @param  dt -- transition time
 */
export const redrawStyle = function redrawStyle(treeElem, styleElem, dt) {
console.warn("redrawStyle is deprecated. use phylotree.change instead.")
  this.svg.selectAll(treeElem)
    .filter((d) => d.update)
    .transition().duration(dt)
    .style(styleElem, (d) => d[styleElem]);
};

export const removeGrid = function removeGrid() {
  this.svg.selectAll(".majorGrid").remove();
  this.svg.selectAll(".minorGrid").remove();
  this.svg.selectAll(".gridTick").remove();
  this.grid = false;
};
