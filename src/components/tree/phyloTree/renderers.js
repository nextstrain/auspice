import { darkGrey } from "../../../globalStyles";
import { timerStart, timerEnd } from "../../../util/perf";
import { calcYValues } from "./helpers";

/**
 * @param  svg    -- the svg into which the tree is drawn
 * @param  layout -- the layout to be used, e.g. "rect"
 * @param  distance   -- the property used as branch length, e.g. div or num_date
 * @param  options    -- an object that contains options that will be added to this.params
 * @param  callbacks  -- an object with call back function defining mouse behavior
 * @param  branchThickness (OPTIONAL) -- array of branch thicknesses
 * @param  visibility (OPTIONAL) -- array of "visible" or "hidden"
 * @return {null}
 */
export const render = function render(svg, layout, distance, options, callbacks, branchThickness, visibility, drawConfidence, vaccines) {
  timerStart("phyloTree render()");
  if (branchThickness) {
    this.nodes.forEach((d, i) => {d["stroke-width"] = branchThickness[i];});
  }
  this.svg = svg;
  this.params = Object.assign(this.params, options);
  this.callbacks = callbacks;
  this.vaccines = vaccines ? vaccines.map((d) => d.shell) : undefined;
  this.clearSVG();

  /* set x, y values & scale them to the screen */
  calcYValues(this.nodes, "visibility", this.numberOfTips, visibility);
  this.setDistance(distance);
  this.setLayout(layout);
  this.mapToScreen();

  /* draw functions */
  if (this.params.showGrid) this.addGrid();
  if (this.params.branchLabels) this.drawBranches();
  this.drawTips();
  if (this.vaccines) this.drawVaccines();
  this.drawCladeLabels();

  if (visibility) {
    timerStart("setVisibility");
    this.nodes.forEach((d, i) => {d["visibility"] = visibility[i];});
    this.svg.selectAll(".tip").style("visibility", (d) => d["visibility"]);
    timerEnd("setVisibility");
  }

  // setting branchLabels and tipLabels to false above in params is not working for some react-dimensions
  // hence the commenting here
  // if (this.params.branchLabels){
  //   this.drawBranchLabels();
  // }
  /* don't even bother initially - there will be too many! */
  // if (this.params.tipLabels){
  //   this.updateTipLabels(100);
  // }

  this.updateGeometry(10);

  this.svg.selectAll(".regression").remove();
  if (this.layout === "clock" && this.distance === "num_date") {
    this.drawRegression();
  }
  if (drawConfidence) {
    this.drawConfidence();
  }
  timerEnd("phyloTree render()");
};

/**
 * adds crosses to the vaccines
 * @return {null}
 */
export const drawVaccines = function drawVaccines() {
  this.svg.append("g").selectAll(".vaccineCross")
    .data(this.vaccines)
    .enter()
    .append("path")
    .attr("class", "vaccineCross")
    .attr("d", (d) => d.vaccineCross)
    .style("stroke", "black")
    .style("stroke-width", 2 * this.params.branchStrokeWidth)
    .style("fill", "none")
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => this.callbacks.onTipHover(d, event.pageX, event.pageY))
    .on("mouseout", (d) => this.callbacks.onTipLeave(d))
    .on("click", (d) => this.callbacks.onTipClick(d));

  this.svg.append("g").selectAll('.vaccineDottedLine')
    .data(this.vaccines)
    .enter()
    .append("path")
    .attr("class", "vaccineDottedLine")
    .attr("d", (d) => d.vaccineLine)
    .style("stroke-dasharray", "5, 5")
    // .style("stroke", (d) => d.stroke || this.params.branchStroke)
    .style("stroke", "black")
    .style("stroke-width", this.params.branchStrokeWidth)
    .style("fill", "none")
    .style("pointer-events", "none");
};


/**
 * adds all the tip circles to the svg, they have class tip
 * @return {null}
 */
export const drawTips = function drawTips() {
  timerStart("drawTips");
  const params = this.params;
  this.svg.append("g").selectAll(".tip")
    .data(this.nodes.filter((d) => d.terminal))
    .enter()
    .append("circle")
    .attr("class", "tip")
    .attr("id", (d) => "tip_" + d.n.clade)
    .attr("cx", (d) => d.xTip)
    .attr("cy", (d) => d.yTip)
    .attr("r", (d) => d.r)
    .on("mouseover", (d) => this.callbacks.onTipHover(d, event.pageX, event.pageY))
    .on("mouseout", (d) => this.callbacks.onTipLeave(d))
    .on("click", (d) => this.callbacks.onTipClick(d))
    .style("pointer-events", "auto")
    .style("fill", (d) => d.fill || params.tipFill)
    .style("stroke", (d) => d.stroke || params.tipStroke)
    .style("stroke-width", () => params.tipStrokeWidth) /* don't want branch thicknesses applied */
    .style("cursor", "pointer");
  timerEnd("drawTips");
};


/**
 * adds all branches to the svg, these are paths with class branch
 * @return {null}
 */
export const drawBranches = function drawBranches() {
  timerStart("drawBranches");
  const params = this.params;
  this.Tbranches = this.svg.append("g").selectAll('.branch')
    .data(this.nodes.filter((d) => !d.terminal))
    .enter()
    .append("path")
    .attr("class", "branch T")
    .attr("id", (d) => "branch_T_" + d.n.clade)
    .attr("d", (d) => d.branch[1])
    .style("stroke", (d) => d.stroke || params.branchStroke)
    .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
    .style("fill", "none")
    .style("pointer-events", "auto");

  this.branches = this.svg.append("g").selectAll('.branch')
    .data(this.nodes)
    .enter()
    .append("path")
    .attr("class", "branch S")
    .attr("id", (d) => "branch_S_" + d.n.clade)
    .attr("d", (d) => d.branch[0])
    .style("stroke", (d) => d.stroke || params.branchStroke)
    .style("stroke-linecap", "round")
    .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
    .style("fill", "none")
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => this.callbacks.onBranchHover(d, event.pageX, event.pageY))
    .on("mouseout", (d) => this.callbacks.onBranchLeave(d))
    .on("click", (d) => this.callbacks.onBranchClick(d));
  timerEnd("drawBranches");
};


/* this need a bit more work as the quickdraw functionality improves */
export const rerenderAllElements = function rerenderAllElements() {
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
 * draws the regression line in the svg and adds a text with the rate estimate
 * @return {null}
 */
export const drawRegression = function drawRegression() {
  const leftY = this.yScale(this.regression.intercept + this.xScale.domain()[0] * this.regression.slope);
  const rightY = this.yScale(this.regression.intercept + this.xScale.domain()[1] * this.regression.slope);

  const path = "M " + this.xScale.range()[0].toString() + " " + leftY.toString() +
    " L " + this.xScale.range()[1].toString() + " " + rightY.toString();
  this.svg.append("path")
    .attr("d", path)
    .attr("class", "regression")
    .style("fill", "none")
    .style("visibility", "visible")
    .style("stroke", this.params.regressionStroke)
    .style("stroke-width", this.params.regressionWidth);
  this.svg.append("text")
    .text("rate estimate: " + this.regression.slope.toFixed(4) + ' / year')
    .attr("class", "regression")
    .attr("x", this.xScale.range()[1] / 2 - 75)
    .attr("y", this.yScale.range()[0] + 50)
    .style("fill", this.params.regressionStroke)
    .style("font-size", this.params.tickLabelSize + 8)
    .style("font-weight", 400)
    .style("font-family", this.params.fontFamily);
};

/*
 * add and remove elements from tree, initial render
 */
export const clearSVG = function clearSVG() {
  this.svg.selectAll('.tip').remove();
  this.svg.selectAll('.branch').remove();
  this.svg.selectAll('.branchLabel').remove();
  this.svg.selectAll(".vaccine").remove();
  this.svg.selectAll(".conf").remove();
};
