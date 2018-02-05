
const contains = (array, elem) => array.some((d) => d === elem);

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
  const attr_array = this.nodes.map((d) => callback(d));
  this.updateStyleOrAttributeArray(treeElem, attr, attr_array, dt, styleOrAttribute);
};

/**
 * update an attribute of the tree for all nodes
 * @param  treeElem  --- the part of the tree to update (.tip, .branch)
 * @param  attr  --- the attribute to update (e.g. r for tipRadius)
 * @param  attr_array  --- an array with values for every node in the tree
 * @param  dt  --- time of transition in milliseconds
 * @return {[type]}
 */
export const updateStyleOrAttributeArray = function updateStyleOrAttributeArray(treeElem, attr, attr_array, dt, styleOrAttribute) {
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
};


/**
 * call to change the distance measure
 * @param  attr -- attribute to be used as a distance measure, e.g. div or num_date
 * @param  dt -- time of transition in milliseconds
 * @return null
 */
export const updateDistance = function updateDistance(attr, dt) {
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
    .transition().duration(dt)
    .attr("d", (dd) => dd.confLine);

  this.updateBranchLabels(dt);
  this.updateTipLabels(dt);
};


/*
 * redraw the tree based on the current xTip, yTip, branch attributes
 * this function will remove branches, move the tips continuously
 * and add the new branches again after the tips arrived at their destination
 *  @params dt -- time of transition in milliseconds
 */
export const updateGeometryFade = function updateGeometryFade(dt) {
  this.removeConfidence(dt);

  // fade out branches
  this.svg.selectAll('.branch')
    .filter((d) => d.update)
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);
  this.svg.selectAll('.branchLabels')
    .filter((d) => d.update)
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);
  this.svg.selectAll('.tipLabels')
    .filter((d) => d.update)
    .transition().duration(dt * 0.5)
    .style("opacity", 0.0);

  // closure to move the tips, called via the time out below
  const tipTransHOF = (svgShadow, dtShadow) => () => {
    svgShadow.selectAll('.tip')
      .filter((d) => d.update)
      .transition().duration(dtShadow)
      .attr("cx", (d) => d.xTip)
      .attr("cy", (d) => d.yTip);
    svgShadow.selectAll(".vaccine")
      .filter((d) => d.update)
      .transition()
      .duration(dtShadow)
      .attr("x", (d) => d.xTip)
      .attr("y", (d) => d.yTip);
  };
  setTimeout(tipTransHOF(this.svg, dt), 0.5 * dt);

  // closure to change the branches, called via time out after the tipTrans is done
  const flipBranchesHOF = (svgShadow) => () => {
    svgShadow.selectAll('.branch').filter('.S')
      .filter((d) => d.update)
      .attr("d", (d) => d.branch[0]);
    svgShadow.selectAll('.branch').filter('.T')
      .filter((d) => d.update)
      .attr("d", (d) => d.branch[1]);
  };
  setTimeout(flipBranchesHOF(this.svg), 0.5 * dt);

  // closure to add the new branches after the tipTrans
  const fadeBackHOF = (svgShadow, dtShadow) => () => {
    svgShadow.selectAll('.branch')
      .filter((dd) => dd.update)
      .transition().duration(0.5 * dtShadow)
      .style("opacity", 1.0);
  };
  setTimeout(fadeBackHOF(this.svg, 0.2 * dt), 1.5 * dt);
  this.updateBranchLabels(dt);
  this.updateTipLabels(dt);
};


/**
 * Update multiple style or attributes of tree elements at once
 * @param {string} treeElem one of .tip or .branch
 * @param {object} attr object containing the attributes to change as keys, array with values as value
 * @param {object} styles object containing the styles to change
 * @param {int} dt time in milliseconds
 */
export const updateMultipleArray = function updateMultipleArray(treeElem, attrs, styles, dt, quickdraw) {
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
};


/**
 * update the svg after all new values have been assigned
 * @param  treeElem -- one of .tip, .branch
 * @param  attr  -- attribute of the tree element to update
 * @param  dt -- transition time
 */
export const redrawAttribute = function redrawAttribute(treeElem, attr, dt) {
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
  this.svg.selectAll(treeElem)
    .filter((d) => d.update)
    .transition().duration(dt)
    .style(styleElem, (d) => d[styleElem]);
};
