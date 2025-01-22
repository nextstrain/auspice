import { timerStart, timerEnd } from "../../../util/perf";
import { NODE_VISIBLE } from "../../../util/globals";
import { getDomId, setDisplayOrder } from "./helpers";
import { makeRegressionText } from "./regression";
import { getEmphasizedColor } from "../../../util/colorHelpers";
import { Callbacks, Distance, Params, PhyloNode, PhyloTreeType } from "./types";
import { Selection } from "d3-selection";
import { Layout, ScatterVariables } from "../../../reducers/controls";
import { ReduxNode, Visibility } from "../../../reducers/tree/types";

export const render = function render(
  this: PhyloTreeType,
{
  svg,
  layout,
  distance,
  focus,
  parameters,
  callbacks,
  branchThickness,
  visibility,
  drawConfidence,
  vaccines,
  branchStroke,
  tipStroke,
  tipFill,
  tipRadii,
  dateRange,
  scatterVariables,
  measurementsColorGrouping,
}: {
  /** the SVG element into which the tree is drawn */
  svg: Selection<SVGGElement | null, unknown, null, unknown>

  /** the layout to be used, e.g. "rect" */
  layout: Layout

  /** the property used as branch length, e.g. div or num_date */
  distance: Distance

  /** whether to focus on filtered nodes */
  focus: boolean

  /** an object that contains options that will be added to this.params */
  parameters: Partial<Params>

  /** an object with call back function defining mouse behavior */
  callbacks: Callbacks

  /** array of branch thicknesses (same ordering as tree nodes) */
  branchThickness: number[]

  /** array of visibility of nodes(same ordering as tree nodes) */
  visibility: Visibility[]

  /** should confidence intervals be drawn? */
  drawConfidence: boolean

  /** should vaccine crosses (and dotted lines if applicable) be drawn? */
  vaccines: ReduxNode[] | false

  /** branch stroke colour for each node (set onto each node) */
  branchStroke: string[]

  /** tip stroke colour for each node (set onto each node) */
  tipStroke: string[]

  /** tip fill colour for each node (set onto each node) */
  tipFill: string[]

  /** array of tip radius' */
  tipRadii: number[] | null

  dateRange: [number, number]

  /** {x, y} properties to map nodes => scatterplot (only used if layout="scatter") */
  scatterVariables: ScatterVariables

  measurementsColorGrouping: string | undefined
}) {
  timerStart("phyloTree render()");
  this.svg = svg;
  this.params = {
    ...this.params,
    ...parameters
  };
  this.callbacks = callbacks;
  this.vaccines = vaccines ? vaccines.map((d) => d.shell) : undefined;
  this.measurementsColorGrouping = measurementsColorGrouping;
  this.dateRange = dateRange;

  /* set nodes stroke / fill */
  this.nodes.forEach((d, i) => {
    d.branchStroke = branchStroke[i];
    d.tipStroke = tipStroke[i];
    d.fill = tipFill[i];
    d.visibility = visibility[i];
    d["stroke-width"] = branchThickness[i];
    d.r = tipRadii ? tipRadii[i] : this.params.tipRadius;
  });

  /* set x, y values & scale them to the screen */
  setDisplayOrder({nodes: this.nodes, focus});
  this.setDistance(distance);
  this.setLayout(layout, scatterVariables);
  this.mapToScreen();

  /* draw functions */
  this.setClipMask();
  if (this.params.showGrid) {
    this.addGrid();
    this.showTemporalSlice();
  }
  this.drawBranches();
  this.updateTipLabels();
  this.drawTips();
  if (this.params.branchLabelKey) this.drawBranchLabels(this.params.branchLabelKey);
  if (this.vaccines) this.drawVaccines();
  if (this.measurementsColorGrouping) this.drawMeasurementsColoringCrosshair();
  if (this.regression) this.drawRegression();
  this.confidencesInSVG = false;
  if (drawConfidence) this.drawConfidence();

  this.timeLastRenderRequested = Date.now();
  timerEnd("phyloTree render()");
};

/**
 * adds crosses to the vaccines
 */
export const drawVaccines = function drawVaccines(this: PhyloTreeType): void {
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

export const removeMeasurementsColoringCrosshair = function removeMeasurementsColoringCrosshair(this: PhyloTreeType): void {
  if ("measurementsColoringCrosshair" in this.groups) {
    this.groups.measurementsColoringCrosshair.selectAll("*").remove();
  }
}

/**
 * Adds crosshair to tip matching the measurements coloring group
 */
export const drawMeasurementsColoringCrosshair = function drawMeasurementsColoringCrosshair(this: PhyloTreeType): void {
  if ("measurementsColoringCrosshair" in this.groups) {
    this.removeMeasurementsColoringCrosshair();
  } else {
    this.groups.measurementsColoringCrosshair = this.svg.append("g").attr("id", "measurementsColoringCrosshairId");
  }

  const matchingStrains = this.nodes.filter((d) => !d.n.hasChildren && d.n.name === this.measurementsColorGrouping);
  if (matchingStrains.length === 1) {
    this.groups.measurementsColoringCrosshair
      .selectAll(".crosshair")
      .data(matchingStrains)
      .enter()
      .append("svg")
        .attr("stroke", "currentColor")
        .attr("fill", "currentColor")
        .attr("strokeWidth", "0")
        .attr("viewBox", "0 0 256 256")
        .attr("height", (d) => d.r * 5)
        .attr("width", (d) => d.r * 5)
        .attr("x", (d) => d.xTip - (d.r * 5 / 2))
        .attr("y", (d) => d.yTip - (d.r * 5 / 2))
        .style("cursor", "pointer")
        .style("pointer-events", "auto")
        .on("mouseover", this.callbacks.onTipHover)
        .on("mouseout", this.callbacks.onTipLeave)
        .on("click", this.callbacks.onTipClick)
        .append("path")
          // path copied from react-icons/pi/PiCrosshairSimpleBold
          .attr("d", "M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm12,191.13V184a12,12,0,0,0-24,0v27.13A84.18,84.18,0,0,1,44.87,140H72a12,12,0,0,0,0-24H44.87A84.18,84.18,0,0,1,116,44.87V72a12,12,0,0,0,24,0V44.87A84.18,84.18,0,0,1,211.13,116H184a12,12,0,0,0,0,24h27.13A84.18,84.18,0,0,1,140,211.13Z");
  } else if (matchingStrains.length === 0) {
    console.warn(`Measurements coloring group ${this.measurementsColorGrouping} doesn't match any tip names`);
  } else {
    console.warn(`Measurements coloring group ${this.measurementsColorGrouping} matches multiple tips`);
  }
}

/**
 * adds all the tip circles to the svg, they have class tip
 */
export const drawTips = function drawTips(this: PhyloTreeType): void {
  timerStart("drawTips");
  const params = this.params;
  if (!("tips" in this.groups)) {
    this.groups.tips = this.svg.append("g").attr("id", "tips").attr("clip-path", "url(#treeClip)");
  }
  this.groups.tips
    .selectAll(".tip")
    .data(this.nodes.filter((d) => !d.n.hasChildren))
    .enter()
    .append("circle")
    .attr("class", "tip")
    .attr("id", (d) => getDomId("tip", d.n.name))
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
 * This enforces the "hidden" property set on `node.node_attrs.hidden`
 * in the dataset JSON
 */
export const getBranchVisibility = (d: PhyloNode): "visible" | "hidden" => {
  const hiddenSetting = d.n.node_attrs && d.n.node_attrs.hidden;
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

/** Calculate the stroke for a given branch. May return a hex or a `url` referring to
 * a SVG gradient definition
 */
export const strokeForBranch = (
  d: PhyloNode,

  /** branch type -- either "T" (tee) or "S" (stem) */
  _b?: "T" | "S",
): string => {
  /* Due to errors rendering gradients on SVG branches on some browsers/OSs which would
  cause the branches to not appear, we're falling back to the previous solution which
  doesn't use gradients. The commented code remains & hopefully a solution can be
  found which reinstates gradients!                            James, April 4 2020. */
  return d.branchStroke;
  // const id = `T${d.that.id}_${d.parent.n.arrayIdx}_${d.n.arrayIdx}`;
  // if (d.branchStroke === d.parent.branchStroke || b === "T") {
  //   return d.branchStroke;
  // }
  // return `url(#${id})`;
};

/**
 * adds all branches to the svg, these are paths with class branch, which comprise two groups
 */
export const drawBranches = function drawBranches(this: PhyloTreeType): void {
  timerStart("drawBranches");
  const params = this.params;

  /* PART 1: draw the branch Ts (i.e. the bit connecting nodes parent branch ends to child branch beginnings)
  Only rectangular & radial trees have this, so we remove it for clock / unrooted layouts */
  if (!("branchTee" in this.groups)) {
    this.groups.branchTee = this.svg.append("g").attr("id", "branchTee").attr("clip-path", "url(#treeClip)");
  }
  if (this.layout === "clock" || this.layout === "scatter" || this.layout === "unrooted") {
    this.groups.branchTee.selectAll("*").remove();
  } else {
    this.groups.branchTee
      .selectAll('.branch')
      .data(this.nodes.filter((d) => d.n.hasChildren && d.displayOrder !== undefined))
      .enter()
      .append("path")
      .attr("class", "branch T")
      .attr("id", (d) => getDomId("branchT", d.n.name))
      .attr("d", (d) => d.branch[1])
      .style("stroke", (d) => d.branchStroke || params.branchStroke)
      .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
      .style("visibility", getBranchVisibility)
      .style("fill", "none")
      .style("pointer-events", "auto")
      .on("mouseover", this.callbacks.onBranchHover)
      .on("mouseout", this.callbacks.onBranchLeave)
      .on("click", this.callbacks.onBranchClick);
  }

  /* PART 2: draw the branch stems (i.e. the actual branches) */

  /* PART 2a: Create linear gradient definitions which can be applied to branch stems for which
  the start & end stroke colour is different */
  if (!this.groups.branchGradientDefs) {
    this.groups.branchGradientDefs = this.svg.append("defs");
  }
  this.groups.branchGradientDefs.selectAll("*").remove();
  // TODO -- explore if duplicate <def> elements (e.g. same colours on each end) slow things down
  this.updateColorBy();
  /* PART 2b: Draw the stems */
  if (!("branchStem" in this.groups)) {
    this.groups.branchStem = this.svg.append("g").attr("id", "branchStem").attr("clip-path", "url(#treeClip)");
  }
  this.groups.branchStem
    .selectAll('.branch')
    .data(this.nodes.filter((d) => d.displayOrder !== undefined))
    .enter()
    .append("path")
    .attr("class", "branch S")
    .attr("id", (d) => getDomId("branchS", d.n.name))
    .attr("d", (d) => d.branch[0])
    .style("stroke", (d) => {
      if (!d.branchStroke) return params.branchStroke;
      return strokeForBranch(d, "S");
    })
    .style("stroke-linecap", "round")
    .style("stroke-width", (d) => d['stroke-width'] || params.branchStrokeWidth)
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
 */
export const drawRegression = function drawRegression(this: PhyloTreeType): void {
  /* check we have computed a sensible regression before attempting to draw */
  if (this.regression.slope===undefined) {
    return;
  }

  const leftY = this.yScale(this.regression.intercept + this.xScale.domain()[0] * this.regression.slope);
  const rightY = this.yScale(this.regression.intercept + this.xScale.domain()[1] * this.regression.slope);

  const path = "M " + this.xScale.range()[0].toString() + " " + leftY.toString() +
    " L " + this.xScale.range()[1].toString() + " " + rightY.toString();

  if (!("regression" in this.groups)) {
    this.groups.regression = this.svg.append("g").attr("id", "regression").attr("clip-path", "url(#treeClip)");
  }

  this.groups.regression
    .append("path")
    .attr("d", path)
    .attr("class", "regression")
    .style("fill", "none")
    .style("visibility", "visible")
    .style("stroke", this.params.regressionStroke)
    .style("stroke-width", this.params.regressionWidth);

  /* Compute & draw regression text. Note that the text hasn't been created until now,
  as we need to wait until rendering time when the scales have been calculated */
  this.groups.regression
    .append("text")
    .text(makeRegressionText(this.regression, this.layout, this.yScale))
    .attr("class", "regression")
    .attr("x", this.xScale.range()[1] / 2 - 75)
    .attr("y", this.yScale.range()[0] + 50)
    .style("fill", this.params.regressionStroke)
    .style("font-size", this.params.tickLabelSize + 8)
    .style("font-weight", 400)
    .style("font-family", this.params.fontFamily);
};

export const removeRegression = function removeRegression(this: PhyloTreeType): void {
  if ("regression" in this.groups) {
    this.groups.regression.selectAll("*").remove();
  }
};

/*
 * add and remove elements from tree, initial render
 */
export const clearSVG = function clearSVG(this: PhyloTreeType): void {
  this.svg.selectAll("*").remove();
};


/* Due to errors rendering gradients on SVG branches on some browsers/OSs which would
cause the branches to not appear, we're falling back to the previous solution which
doesn't use gradients. Calls to `updateColorBy` are therefore unnecessary.
                                                                James, April 4 2020. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const updateColorBy = function updateColorBy() {};
// export const updateColorBy = function updateColorBy() {
//   // console.log("updating colorBy")
//   this.nodes.forEach((d) => {
//     const a = d.parent.branchStroke;
//     const b = d.branchStroke;
//     const id = `T${this.id}_${d.parent.n.arrayIdx}_${d.n.arrayIdx}`;
//     if (a === b) { // not a gradient // color can be computed from d alone
//       this.svg.select(`#${id}`).remove(); // remove an existing gradient for this node
//       return;
//     }
//     if (!this.svg.select(`#${id}`).empty()) { // there an existing gradient // update its colors
//       // console.log("adjusting " + id + " " + d.parent.branchStroke + "=>" + d.branchStroke);
//       this.svg.select(`#${id}_begin`).attr("stop-color", d.parent.branchStroke);
//       this.svg.select(`#${id}_end`).attr("stop-color", d.branchStroke);

//     } else { // otherwise create a new gradient
//       //  console.log("new gradient " + id + " " + d.parent.branchStroke + "=>" + d.branchStroke);
//       const linearGradient = this.svg.select("defs").append("linearGradient")
//         .attr("id", id);
//       if (d.rot && typeof d.rot === "number") {
//         linearGradient.attr("gradientTransform", "translate(.5,.5) rotate(" + d.rot + ") translate(-.5,-.5)");
//       }
//       linearGradient.append("stop")
//         .attr("id", id + "_begin")
//         .attr("offset", "0")
//         .attr("stop-color", d.parent.branchStroke);
//       linearGradient.append("stop")
//         .attr("id", id + "_end")
//         .attr("offset", "1")
//         .attr("stop-color", d.branchStroke);
//     }
//   });
// };


/** given a node `d` which is being hovered, update it's colour to emphasize
 * that it's being hovered. This updates the SVG element stroke style in-place
 * _or_ updates the SVG gradient def in place.
 */
const handleBranchHoverColor = (
  d: PhyloNode,

  /** colour of the parent (start of the branch) */
  _c1: string,

  /** colour of the node (end of the branch) */
  c2: string,
): void => {
  if (!d) { return; }

  /* We want to emphasize the colour of the branch. How we do this depends on how the branch was rendered in the first place! */
  const tel = d.that.svg.select("#"+getDomId("branchT", d.n.name));
  if (!tel.empty()) { // Some displays don't have S & T parts of the branch
    tel.style("stroke", c2);
  }

  /* If we reinstate gradient stem colours this section must be updated; see the
  commit which added this comment for the previous implementation */
  const sel = d.that.svg.select("#"+getDomId("branchS", d.n.name));
  if (!sel.empty()) {
    sel.style("stroke", c2);
  }
};

export const branchStrokeForLeave = function branchStrokeForLeave(d: PhyloNode) {
  if (!d) { return; }
  handleBranchHoverColor(d, d.n.parent.shell.branchStroke, d.branchStroke);
};

export const branchStrokeForHover = function branchStrokeForHover(d: PhyloNode) {
  if (!d) { return; }
  handleBranchHoverColor(d, getEmphasizedColor(d.n.parent.shell.branchStroke), getEmphasizedColor(d.branchStroke));
};

/**
 * Create / update the clipping mask which is attached to branches, tips, branch-labels
 * and regression lines. In theory, we can clip to exactly the {xy}Scale range, however
 * in practice, elements (or portions of elements) render outside this.
 */
export const setClipMask = function setClipMask(this: PhyloTreeType): void {
  const [yMin, yMax] = this.yScale.range();
  // for the RHS tree (if there is one) ensure that xMin < xMax, else width<0 which some
  // browsers don't like. See <https://github.com/nextstrain/auspice/issues/1755>
  let [xMin, xMax] = this.xScale.range();
  if (parseInt(xMin, 10)>parseInt(xMax, 10)) [xMin, xMax] = [xMax, xMin];
  const x0 = xMin - 5;
  const width = xMax - xMin + 20;  // RHS overflow is not problematic
  const y0 = yMin - 15;            // some overflow at top is ok
  const height = yMax - yMin + 20; // extra padding to allow tips & lowest major axis line to render

  if (!this.groups.clipPath) {
    this.groups.clipPath = this.svg.append("g").attr("id", "clipGroup");
    this.groups.clipPath.append("clipPath")
        .attr("id", "treeClip")
      .append("rect")
        .attr("x", x0)
        .attr("y", y0)
        .attr("width", width)
        .attr("height", height);
  } else {
    this.groups.clipPath.select('rect')
      .attr("x", x0)
      .attr("y", y0)
      .attr("width", width)
      .attr("height", height);
  }

};
