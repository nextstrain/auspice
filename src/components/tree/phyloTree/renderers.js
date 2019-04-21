import { timerStart, timerEnd } from "../../../util/perf";
import { NODE_VISIBLE } from "../../../util/globals";
import { getDomId } from "./helpers";
/**
 * @param {d3 selection} svg      -- the svg into which the tree is drawn
 * @param {string} layout         -- the layout to be used, e.g. "rect"
 * @param {string} distance       -- the property used as branch length, e.g. div or num_date
 * @param {object} parameters     -- an object that contains options that will be added to this.params
 * @param {object} callbacks      -- an object with call back function defining mouse behavior
 * @param {array} branchThickness -- array of branch thicknesses (same ordering as tree nodes)
 * @param {array} visibility      -- array of visibility of nodes(same ordering as tree nodes)
 * @param {bool} drawConfidence   -- should confidence intervals be drawn?
 * @param {bool} vaccines         -- should vaccine crosses (and dotted lines if applicable) be drawn?
 * @param {array} branchStroke    -- branch stroke colour for each node (set onto each node)
 * @param {array} tipStroke       -- tip stroke colour for each node (set onto each node)
 * @param {array} tipFill         -- tip fill colour for each node (set onto each node)
 * @param {array|null} tipRadii   -- array of tip radius'
 * @return {null}
 */
export const render = function render(svg, layout, distance, parameters, callbacks, branchThickness, visibility, drawConfidence, vaccines, branchStroke, tipStroke, tipFill, tipRadii, dateRange) {
  timerStart("phyloTree render()");
  this.svg = svg;
  this.params = Object.assign(this.params, parameters);
  this.callbacks = callbacks;
  this.vaccines = vaccines ? vaccines.map((d) => d.shell) : undefined;
  this.dateRange = dateRange;

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
  if (this.params.showGrid) {
    this.addGrid();
    this.addTemporalSlice();
  }
  this.drawBranches();
  this.drawTips();
  if (this.params.branchLabelKey) this.drawBranchLabels(this.params.branchLabelKey);
  if (this.vaccines) this.drawVaccines();
  if (this.layout === "clock" && this.distance === "num_date") this.drawRegression();
  this.confidencesInSVG = false;
  if (drawConfidence) this.drawConfidence();
  this.updateTipLabels();

  this.timeLastRenderRequested = Date.now();
  timerEnd("phyloTree render()");
};

/**
 * adds crosses to the vaccines
 * @return {null}
 */
export const drawVaccines = function drawVaccines() {
  if (!this.vaccines || !this.vaccines.length) return;

  if (!("vaccines" in this.groups)) {
    this.groups.vaccines = this.svg.append("g").attr("id", "vaccines");
  }
  this.groups.vaccines
    .selectAll(".vaccineCross")
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
        .on("mouseover", this.callbacks.onTipHover)
        .on("mouseout", this.callbacks.onTipLeave)
        .on("click", this.callbacks.onTipClick);
};


/**
 * adds all the tip circles to the svg, they have class tip
 * @return {null}
 */
export const drawTips = function drawTips() {
  timerStart("drawTips");
  const params = this.params;

  if (!("tips" in this.groups)) {
    this.groups.tips = this.svg.append("g").attr("id", "tips");
  }
  this.groups.tips
    .selectAll(".tip")
    .data(this.nodes.filter((d) => d.terminal))
    .enter()
      .append("circle")
        .attr("class", "tip")
        .attr("id", (d) => getDomId("tip", d.n.strain))
        .attr("cx", (d) => d.xTip)
        .attr("cy", (d) => d.yTip)
        .attr("r", (d) => d.r)
        .on("mouseover", this.callbacks.onTipHover)
        .on("mouseout", this.callbacks.onTipLeave)
        .on("click", this.callbacks.onTipClick)
        .style("pointer-events", "auto")
        .style("visibility", (d) => d.visibility === NODE_VISIBLE ? "visible" : "hidden")
        .style("fill", (d) => d.fill || params.tipFill)
        .style("stroke", (d) => d.tipStroke || params.tipStroke)
        .style("stroke-width", () => params.tipStrokeWidth) /* don't want branch thicknesses applied */
        .style("cursor", "pointer");

  timerEnd("drawTips");
};

/**
 * given a tree node, decide whether the branch should be rendered
 * This enforces the "hidden" property set in the dataset JSON
 * @return {string}
 */
export const getBranchVisibility = (d) => {
  const hiddenSetting = d.n.hidden;
  if (hiddenSetting &&
    (
      hiddenSetting === "always" ||
      (hiddenSetting === "timetree" && d.that.distance === "num_date") ||
      (hiddenSetting === "divtree" && d.that.distance === "div")
    )
  ) {
    return "hidden";
  }
  return "visible";
};

/**
 * adds all branches to the svg, these are paths with class branch, which comprise two groups
 * @return {null}
 */
export const drawBranches = function drawBranches() {
  timerStart("drawBranches");
  const params = this.params;

  /* PART 1: draw the branch Ts (i.e. the bit connecting nodes parent branch ends to child branch beginnings)
  Only rectangular & radial trees have this, so we remove it for clock / unrooted layouts */
  if (!("branchTee" in this.groups)) {
    this.groups.branchTee = this.svg.append("g").attr("id", "branchTee");
  }
  if (this.layout === "clock" || this.layout === "unrooted") {
    this.groups.branchTee.selectAll("*").remove();
  } else {
    this.groups.branchTee
      .selectAll('.branch')
      .data(this.nodes.filter((d) => !d.terminal))
      .enter()
        .append("path")
          .attr("class", "branch T")
          .attr("id", (d) => getDomId("branchT", d.n.strain))
          .attr("d", (d) => d.branch[1])
          .style("stroke", (d) => d.branchStroke || params.branchStroke)
          .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
          .style("fill", "none")
          .style("pointer-events", "auto");
  }

  /* PART 2: draw the branch stems (i.e. the actual branches) */
  if (!("branchStem" in this.groups)) {
    this.groups.branchStem = this.svg.append("g").attr("id", "branchStem");
  }
  this.groups.branchStem
    .selectAll('.branch')
    .data(this.nodes)
    .enter()
      .append("path")
        .attr("class", "branch S")
        .attr("id", (d) => getDomId("branchS", d.n.strain))
        .attr("d", (d) => d.branch[0])
        .style("stroke", (d) => d.branchStroke || params.branchStroke)
        .style("stroke-linecap", "round")
        .style("stroke-width", (d) => d['stroke-width']+"px" || params.branchStrokeWidth)
        .style("fill", "none")
        .style("visibility", getBranchVisibility)
        .style("cursor", (d) => d.visibility === NODE_VISIBLE ? "pointer" : "default")
        .style("pointer-events", "auto")
        .on("mouseover", this.callbacks.onBranchHover)
        .on("mouseout", this.callbacks.onBranchLeave)
        .on("click", this.callbacks.onBranchClick);

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

  if (!("clockRegression" in this.groups)) {
    this.groups.clockRegression = this.svg.append("g").attr("id", "clockRegression");
  }

  this.groups.clockRegression
    .append("path")
    .attr("d", path)
    .attr("class", "regression")
    .style("fill", "none")
    .style("visibility", "visible")
    .style("stroke", this.params.regressionStroke)
    .style("stroke-width", this.params.regressionWidth);
  this.groups.clockRegression
    .append("text")
    .text(`rate estimate: ${this.regression.slope.toExponential(2)} subs per site per year`)
    .attr("class", "regression")
    .attr("x", this.xScale.range()[1] / 2 - 75)
    .attr("y", this.yScale.range()[0] + 50)
    .style("fill", this.params.regressionStroke)
    .style("font-size", this.params.tickLabelSize + 8)
    .style("font-weight", 400)
    .style("font-family", this.params.fontFamily);
};

export const removeRegression = function removeRegression() {
  if ("clockRegression" in this.groups) {
    this.groups.clockRegression.selectAll("*").remove();
  }
};

/*
 * add and remove elements from tree, initial render
 */
export const clearSVG = function clearSVG() {
  this.svg.selectAll("*").remove();
};
