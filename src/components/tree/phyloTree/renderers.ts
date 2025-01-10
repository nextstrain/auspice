import { timerStart, timerEnd } from "../../../util/perf";
import { NODE_VISIBLE } from "../../../util/globals";
import { getDomId, setDisplayOrder } from "./helpers";
import { makeRegressionText } from "./regression";
import { getEmphasizedColor } from "../../../util/colorHelpers";
import { Callbacks, Distance, Params, PhyloNode, PhyloTreeType, Ripple } from "./types";
import { Selection } from "d3-selection";
import { area } from "d3-shape";
import { Layout, ScatterVariables } from "../../../reducers/controls";
import { ReduxNode, Visibility, StreamSummary } from "../../../reducers/tree/types";

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
  streams,
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

  /** TODO XXX */
  streams: Record<string, StreamSummary>
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
  this.streams = streams;

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
  setDisplayOrder({nodes: this.nodes, focus, streams: this.params.showStreamTrees && streams});
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
  this.drawStreams();
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

  const nodes = (this.params.showStreamTrees ? this.nodes.filter((d) => !d.n.inStream) : this.nodes)
    .filter((d) => !d.n.hasChildren);

  this.groups.tips
    .selectAll(".tip")
    .data(nodes)
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

  const nodes = (this.params.showStreamTrees ? this.nodes.filter((d) => !d.n.inStream) : this.nodes)
  .filter((d) => d.displayOrder !== undefined);


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
      .data(nodes.filter((d) => d.n.hasChildren)) // only want internal nodes for the tee
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
    .data(nodes)
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



export function drawStreams(this: PhyloTreeType): void {
  console.groupCollapsed('drawStreams')

  /* initial set up - should only ever run once */
  if (!("streams" in this.groups)) {
    // console.log("initial setup of this.groups.streams")
    this.groups.streams = this.svg.append("g").attr("id", "streams"); // .attr("clip-path", "url(#treeClip)");
  }

  /* stream order is reversed so that stream connectors are correctly layered behind their parent streams */
  const streamsToDraw = this.params.showStreamTrees ? Object.keys(this.streams).reverse() : [];
  console.log("streamsToDraw:", streamsToDraw)

  this.groups.streams.selectAll('g')
    // .data(streamsToDraw, (d) => {console.log(`key fn ${d}`); return String(d);})
    .data(streamsToDraw, (d) => String(d))
    .join(
      (enter) => {
        // console.log("[entire stream // enter]", enter);
        // return enter.append('g').attr('id', (d)=>{console.log(`\t${d}`); return `stream${d}`}).each((d) => console.log("EACH?", d))
        return enter.append('g').attr('id', (name) => `stream${name}`);
      },
      (update) => {
        // console.log("[entire stream // update] NO-OP", update);
        update.attr('id', (name) => `stream${name}`)
        return update;
      },
      (exit) => {
        // console.log("[entire stream // exit]", exit);
        return exit
          .call((selection) => selection.transition('500')
            // .each((d) => console.log("EACH?", d))
            .style('opacity', 0)
            .remove()
          )
      },
    );

  const areaGenerator: (param: Ripple) => string = area<Ripple[0]>()
    .x((d) => d.x)
    .y0((d) => d.y0)
    .y1((d) => d.y1);

  const connector = (node: PhyloNode): string => { // a.k.a. branch

    // don't draw connectors to empty streams!
    if (node.n.streamNodeCounts.visible===0) return "";

    const x1 = node.streamRipples[0][0].x; // first category, first pivot
    const y1 = this.yScale(node.displayOrder);

    const parentStreamName = this.streams[node.n.streamName].parentStreamName;
    if (parentStreamName) { // draw a kinked connector
      const x0 = node.xTip; // represents the div/time of the stream-defining branch
      const y0 = this.yScale(this.nodes[this.streams[parentStreamName].startNode].displayOrder);
      return `M${x0},${y0}L${x0},${y1}L${x1},${y1}`;
    }

    // no parent stream - horizontal line from the parent node ("normal branch")
    return `M${node.n.parent.shell.xTip},${y1}H${x1}`;
  }

  /* If one were a d3 guru one could probably add the following stuff above, but I'm not so there you go */
  for (const name of streamsToDraw) {
    console.log("rendering connectors, ripples (paths) for stream", name);
    const node = this.nodes[this.streams[name].startNode];

    this.groups.streams.select(`#${CSS.escape(`stream${name}`)}`)
      .selectAll(`.connector`)
      .data([node], (_d) => "CONNECTOR") // `data` not `datum` so we can use `join`
      .join(
        (enter) => {
          // console.log(`\t[connector ${name} // enter]`, enter);
          return enter
            .append("path")
            .attr("class", `connector`)
            .attr("d", (d) => connector(d)) // fat-arrow to avoid d3 rebinding `this`
            .attr("stroke-width", (d) => d['stroke-width'])
            .style("stroke", (d) => d.branchStroke)
            .attr("fill", 'None')
            .style("cursor", "pointer")
            .style("pointer-events", "auto")
            .on("mouseover", (_d, i, paths) => this.callbacks.onStreamHover(node, i, paths, true)) // tsc isn't detecting the `bind(this: TreeComponent)` in `initialRender.ts`
            .on("mouseout",  (_d, i, paths) => this.callbacks.onStreamLeave(node, i, paths, true)) // tsc isn't detecting the `bind(this: TreeComponent)` in `initialRender.ts`
            .on("click", this.callbacks.onBranchClick);
        },
        (update) => {
          // console.log(`\t[connector ${name} // update]`, update);
          return update.call(
            (selection) => selection.transition("500")
              .attr("d", (d) => connector(d))
              .attr("stroke-width", (d) => d['stroke-width'])
          );
        },
        (exit) => {
          // console.log(`\t[connector ${name} // exit]`, exit);
          return exit.remove();
        },
      );

    this.groups.streams.select(`#${CSS.escape(`stream${name}`)}`)
      .selectAll(`.stream`)
      .data(node.streamRipples, (d: Ripple) => String(d.key))
      .join(
        (enter) => {
          // each datum here is an element of streamRipples, i.e. an array of pivots for a specific 
          // console.log(`\t[stream ${name} // enter]`, enter);
          return enter
            .append("path")
            .attr("class", `stream`)
            .attr("d", (d) => areaGenerator(d))
            .attr("fill", (_d, i:number) => node.n.streamCategories[i].color)
            .on("mouseover", (_d, i, paths) => this.callbacks.onStreamHover(node, i, paths, false)) // tsc isn't detecting the `bind(this: TreeComponent)` in `initialRender.ts`
            .on("mouseout",  (_d, i, paths) => this.callbacks.onStreamLeave(node, i, paths, false)) // tsc isn't detecting the `bind(this: TreeComponent)` in `initialRender.ts`
        },
        (update) => {
          // console.log(`\t[stream ${name} // update]`, update);
          return update.call(
            (selection) => selection.transition("500")
              .attr("d", (d) => areaGenerator(d))
          );
        },
        (exit) => {
          // console.log(`\t[stream ${name} // exit]`, exit);
          return exit.remove();
        },
      );

    this.groups.streams.select(`#${CSS.escape(`stream${name}`)}`)
      .selectAll(`.streamLabel`)
      .data(_positionLabel(node), (_d) => "LABEL") // `data` not `datum` so we can use `join`
      .join(
        (enter) => {
          // each datum here is an element of streamRipples, i.e. an array of pivots for a specific 
          // console.log(`\t[stream ${name} // enter]`, enter);
          return enter
            .append("text")
            .attr("class", `streamLabel`)
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", (d) => d.fontsize)
            .text((d) => d.text)
            .attr("visibility", (d) => d.visibility)
            .style("pointer-events", "none");
        },
        (update) => {
          return update.call(
            (selection) => selection
              .attr("x", (d) => d.x)
              .attr("y", (d) => d.y)
              .attr("font-size", (d) => d.fontsize)
              .attr("visibility", (d) => d.visibility)
          );
        },
        (exit) => {
          // console.log(`\t[stream ${name} // exit]`, exit);
          return exit.remove();
        },
      );
  }

  console.groupEnd();
}


function _positionLabel(node: PhyloNode): Array<Record<string,any>> {
  const ripples = node.streamRipples;
  if (ripples.length===0) return []; // stream with no terminal nodes

  // find the pivot with the largest height (in pixels)
  const [idx, height] = ripples[0].reduce(([i, maxH], pivotData, pivotIdx) => {
    const h = ripples.at(-1)[pivotIdx].y1 - pivotData.y0;
    if (pivotIdx===0) return [0,h];
    if (h>maxH) return [pivotIdx, h];
    return [i, maxH];
  }, [undefined, undefined]);

  return [{
    text: node.n.streamName,
    pivotIdx: idx,
    fontsize: `${Math.min(20, Math.floor(height*0.8))}px`,
    visibility: height > 20 ? "visible" : "hidden",
    x: ripples.at(0)[idx].x,
    y: ripples.at(0)[idx].y0 +  height/2,
  }];
}