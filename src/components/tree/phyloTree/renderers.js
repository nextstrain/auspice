import { event as d3event } from "d3-selection";
import { timerStart, timerEnd } from "../../../util/perf";

/**
 * @param {d3 selection} svg      -- the svg into which the tree is drawn
 * @param {string} layout         -- the layout to be used, e.g. "rect"
 * @param {string} distance       -- the property used as branch length, e.g. div or num_date
 * @param {object} parameters     -- an object that contains options that will be added to this.params
 * @param {object} callbacks      -- an object with call back function defining mouse behavior
 * @param {array} branchThickness -- array of branch thicknesses (same shape as tree nodes)
 * @param {array} visibility      -- array of "visible" or "hidden" (same shape as tree nodes)
 * @param {bool} drawConfidence   -- should confidence intervals be drawn?
 * @param {bool} vaccines         -- should vaccine crosses (and dotted lines if applicable) be drawn?
 * @param {array} branchStroke    -- branch stroke colour for each node (set onto each node)
 * @param {array} tipStroke       -- tip stroke colour for each node (set onto each node)
 * @param {array} tipFill         -- tip fill colour for each node (set onto each node)
 * @param {array|null} tipRadii   -- array of tip radius'
 * @return {null}
 */
export const render = function render(svg, layout, distance, parameters, callbacks, branchThickness, visibility, drawConfidence, vaccines, branchStroke, tipStroke, tipFill, tipRadii) {
  timerStart("phyloTree render()");
  this.svg = svg;
  this.params = Object.assign(this.params, parameters);
  this.callbacks = callbacks;
  this.vaccines = vaccines ? vaccines.map((d) => d.shell) : undefined;

  /* set x, y values & scale them to the screen */
  this.setDistance(distance);
  this.setLayout(layout);
  this.mapToScreen();

  /* set nodes stroke / fill */
  this.nodes.forEach((d, i) => {
    d.branchStroke = branchStroke[i];
    d.tipStroke = tipStroke[i];
    d.fill = tipFill[i];
    d.visibility = visibility[i];
    d["stroke-width"] = branchThickness[i];
    d.r = tipRadii ? tipRadii[i] : this.params.tipRadius;
  });

  /* draw functions */
  if (this.params.showGrid) this.addGrid();
  this.drawBranches();
  this.drawTips();
  if (this.params.branchLabelKey) this.drawBranchLabels(this.params.branchLabelKey);
  if (this.vaccines) this.drawVaccines();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
  this.confidencesInSVG = false;
  if (drawConfidence) this.drawConfidence();

  this.timeLastRenderRequested = Date.now();
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
    .style("stroke", "#333")
    .style("stroke-width", 2 * this.params.branchStrokeWidth)
    .style("fill", "none")
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => this.callbacks.onTipHover(d, d3event.pageX, d3event.pageY))
    .on("mouseout", (d) => this.callbacks.onTipLeave(d))
    .on("click", (d) => this.callbacks.onTipClick(d));

  this.svg.append("g").selectAll('.vaccineDottedLine')
    .data(this.vaccines)
    .enter()
    .append("path")
    .attr("class", "vaccineDottedLine")
    .attr("d", (d) => d.vaccineLine)
    .style("stroke-dasharray", "5, 5")
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
    .on("mouseover", (d) => this.callbacks.onTipHover(d, d3event.pageX, d3event.pageY))
    .on("mouseout", (d) => this.callbacks.onTipLeave(d))
    .on("click", (d) => this.callbacks.onTipClick(d))
    .style("pointer-events", "auto")
    .style("visibility", (d) => d["visibility"])
    .style("fill", (d) => d.fill || params.tipFill)
    .style("stroke", (d) => d.tipStroke || params.tipStroke)
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
    .style("stroke", (d) => d.branchStroke || params.branchStroke)
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
    .style("stroke", (d) => d.branchStroke || params.branchStroke)
    .style("stroke-linecap", "round")
    .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
    .style("fill", "none")
    .style("cursor", "pointer")
    .style("pointer-events", "auto")
    .on("mouseover", (d) => this.callbacks.onBranchHover(d, d3event.pageX, d3event.pageY))
    .on("mouseout", (d) => this.callbacks.onBranchLeave(d))
    .on("click", (d) => this.callbacks.onBranchClick(d));
  timerEnd("drawBranches");
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
  this.svg.selectAll("*").remove();
};
