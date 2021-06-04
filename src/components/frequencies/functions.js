import { select, mouse } from "d3-selection";
import 'd3-transition';
import scaleLinear from "d3-scale/src/linear";
import { axisBottom, axisLeft } from "d3-axis";
import { min, max } from "d3-array";
import { rgb } from "d3-color";
import { area } from "d3-shape";
import { format } from "d3-format";
import { dataFont } from "../../globalStyles";
import { unassigned_label } from "../../util/processFrequencies";
import { isColorByGenotype, decodeColorByGenotype } from "../../util/getGenotype";
import { numericToCalendar } from "../../util/dateHelpers";
import { computeTemporalGridPoints } from "../tree/phyloTree/grid";

/* C O N S T A N T S */
const opacity = 0.85;

export const areListsEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return !a.filter((el, idx) => el !== b[idx]).length;
};

export const parseColorBy = (colorBy, colorOptions) => {
  if (colorOptions && colorOptions[colorBy]) {
    return colorOptions[colorBy].title;
  } else if (isColorByGenotype(colorBy)) {
    const genotype = decodeColorByGenotype(colorBy);
    return genotype.aa
      ? `Genotype at ${genotype.gene} pos ${genotype.positions.join(", ")}`
      : `Genotype at Nuc. ${genotype.positions.join(", ")}`;
  }
  return colorBy;
};

export const normString = (normalized, tipCount, fullTipCount) => {
  if (tipCount<fullTipCount) {
    if (normalized) {
      return `and normalized to 100% at each time point for ${tipCount} out of a total of ${fullTipCount} tips`;
    }
    return `as a fraction of all sequences at each time point showing ${tipCount} out of a total of ${fullTipCount} tips`;
  }
  return "";
};

const getOrderedCategories = (matrixCategories, colorScale) => {
  /* get the colorBy's in the same order as in the tree legend */
  const orderedCategories = colorScale.legendValues
    .filter((d) => d !== undefined)
    .reverse()
    .map((v) => v.toString());
  /* remove categories that (for whatever reason) are in the legend but aren't in the matrix */
  for (let i = orderedCategories.length - 1; i >= 0; --i) {
    if (matrixCategories.indexOf(orderedCategories[i]) === -1) {
      orderedCategories.splice(i, 1);
    }
  }
  /* add in categories that (for whatever reason) aren't in the legend */
  if (matrixCategories.length > orderedCategories.length) {
    matrixCategories.forEach((v) => {
      if (orderedCategories.indexOf(v) === -1) {
        orderedCategories.push(v);
      }
    });
  }
  return orderedCategories;
};

export const calcXScale = (chartGeom, pivots) => {
  const x = scaleLinear()
    .domain([pivots[0], pivots[pivots.length - 1]])
    .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight]);
  return {x};
};

export const calcYScale = (chartGeom, maxY) => {
  const y = scaleLinear()
    .domain([0, maxY])
    .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop]);
  return {y, numTicksY: 5};
};

const removeXAxis = (svg) => {
  svg.selectAll(".x.axis").remove();
};

const removeYAxis = (svg) => {
  svg.selectAll(".y.axis").remove();
};

const removeProjectionInfo = (svg) => {
  svg.selectAll(".projection-pivot").remove();
  svg.selectAll(".projection-text").remove();
};

export const drawXAxis = (svg, chartGeom, scales) => {
  const domain = scales.x.domain(),
    range = scales.x.range();
  const {majorGridPoints} = computeTemporalGridPoints(
    min(domain), max(domain), range[1] - range[0]
  );
  removeXAxis(svg);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisBottom(scales.x)
      .tickValues(majorGridPoints.map((x) => x.position))
      .tickFormat((_, i) => majorGridPoints[i].name)
    );
};

export const drawYAxis = (svg, chartGeom, scales) => {
  removeYAxis(svg);
  const formatPercent = format(".0%");
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisLeft(scales.y).ticks(scales.numTicksY).tickFormat(formatPercent));
};

export const drawProjectionInfo = (svg, scales, projection_pivot, t) => {
  if (projection_pivot) {

    removeProjectionInfo(svg);

    svg.append("g")
      .attr("class", "projection-pivot")
      .append("line")
      .attr("x1", scales.x(parseFloat(projection_pivot)))
      .attr("x2", scales.x(parseFloat(projection_pivot)))
      .attr("y1", scales.y(1))
      .attr("y2", scales.y(0))
      .style("visibility", "visible")
      .style("stroke", "rgba(55,55,55,0.9)")
      .style("stroke-width", "2")
      .style("stroke-dasharray", "4 4");

    const midPoint = 0.5 * (scales.x(parseFloat(projection_pivot)) + scales.x.range()[1]);
    svg.append("g")
      .attr("class", "projection-text")
      .append("text")
      .attr("x", midPoint)
      .attr("y", scales.y(1) - 3)
      .style("pointer-events", "none")
      .style("fill", "#555")
      .style("font-family", dataFont)
      .style("font-size", 12)
      .style("alignment-baseline", "bottom")
      .style("text-anchor", "middle")
      .text(t("Projection"));

  }
};

const turnMatrixIntoSeries = (categories, nPivots, matrix) => {
  /*
  WHAT IS A SERIES?
  this is the data structure demanded by d3 for a stream graph.
  it is often produced by the d3.stack function - see https://github.com/d3/d3-shape/blob/master/README.md#_stack
  but it's faster to create this ourselves.

  THIS IS THE STRUCTURE:
    [x1, x2, ... xn] where n is the number of categories
      xi = [y1, y2, ..., ym] where m is the number of pivots
        yi = [z1, z2]: the (y0, y1) values of the categorie at that pivot point.

  TO DO:
  this should / could be in the reducer. But what if we want to re-order things?!?!
  */
  const series = [];
  for (let i = 0; i < categories.length; i++) {
    const x = [];
    for (let j = 0; j < nPivots; j++) {
      if (i === 0) {
        x.push([0, matrix[categories[i]][j]]);
      } else {
        const prevY1 = series[i - 1][j][1];
        x.push([prevY1, matrix[categories[i]][j] + prevY1]);
      }
    }
    series.push(x);
  }
  return series;
};

const getMeaningfulLabels = (categories, colorScale) => {
  if (colorScale.continuous) {
    return categories.map((name) => name === unassigned_label ?
      unassigned_label :
      `${colorScale.legendBounds[name][0].toFixed(2)} - ${colorScale.legendBounds[name][1].toFixed(2)}`
    );
  }
  return categories.slice();
};

export const removeStream = (svg) => {
  svg.selectAll("path").remove();
  svg.selectAll("line").remove();
  svg.selectAll("text").remove();
};

const generateColorScaleD3 = (categories, colorScale) => (d, i) =>
  categories[i] === unassigned_label ? "#ADB1B3" : rgb(colorScale.scale(categories[i])).toString();

function handleMouseOver() {
  select(this).attr("opacity", 1);
}

function handleMouseOut() {
  select(this).attr("opacity", opacity);
  select("#freqinfo").style("visibility", "hidden");
  select("#vline").style("visibility", "hidden");
}

/* returns [[xval, yval], [xval, yval], ...] order: that of {series} */
const calcBestXYPositionsForLabels = (series, pivots, scales, lookahead) => series.map((d) => {
  const maxY = scales.y.domain()[1];
  const displayThresh = 0.15 * maxY;
  for (let pivotIdx = 0; pivotIdx < d.length - lookahead; pivotIdx++) {
    const nextIdx = pivotIdx + lookahead;
    if (d[pivotIdx][1] - d[pivotIdx][0] > displayThresh && d[nextIdx][1] - d[nextIdx][0] > displayThresh) {
      return [
        scales.x(pivots[pivotIdx + 1]),
        (scales.y((d[pivotIdx][1] + d[pivotIdx][0]) / 2) + scales.y((d[nextIdx][1] + d[nextIdx][0]) / 2)) / 2
      ];
    }
  }
  return [undefined, undefined]; /* don't display text! */
});

const drawLabelsOverStream = (svgStreamGroup, series, pivots, labels, scales) => {
  const xyPos = calcBestXYPositionsForLabels(series, pivots, scales, 3);
  svgStreamGroup.selectAll(".streamLabels")
    .data(labels)
    .enter()
    .append("text")
    .attr("x", (d, i) => xyPos[i][0])
    .attr("y", (d, i) => xyPos[i][1])
    .style("pointer-events", "none")
    .style("fill", "white")
    .style("font-family", dataFont)
    .style("font-size", 14)
    .style("alignment-baseline", "middle")
    .text((d, i) => xyPos[i][0] ? d : "");
};

const calcMaxYValue = (series) => {
  return series[series.length - 1].reduce((curMax, el) => Math.max(curMax, el[1]), 0);
};

export const processMatrix = ({matrix, pivots, colorScale}) => {
  const categories = getOrderedCategories(Object.keys(matrix), colorScale);
  const series = turnMatrixIntoSeries(categories, pivots.length, matrix);
  const maxY = calcMaxYValue(series);
  return {categories, series, maxY};
};

export const drawStream = (
  svgStreamGroup, scales, {categories, series}, {colorBy, colorScale, colorOptions, pivots, projection_pivot, t}
) => {
  removeStream(svgStreamGroup);
  const colourer = generateColorScaleD3(categories, colorScale);
  const labels = getMeaningfulLabels(categories, colorScale);

  /* https://github.com/d3/d3-shape/blob/master/README.md#areas */
  const areaObj = area()
    .x((d, i) => scales.x(pivots[i]))
    .y0((d) => scales.y(d[0]))
    .y1((d) => scales.y(d[1]));

  /* define handleMouseMove inside drawStream so it can access the provided arguments */
  function handleMouseMove(d, i) {
    const [mousex] = mouse(this); // [x, y] x starts from left, y starts from top
    /* what's the closest pivot? */
    const date = scales.x.invert(mousex);
    const pivotIdx = pivots.reduce((closestIdx, val, idx, arr) => Math.abs(val - date) < Math.abs(arr[closestIdx] - date) ? idx : closestIdx, 0);
    const frequency = (d[pivotIdx][1] - d[pivotIdx][0]) * 100;
    const freqVal = frequency < 1 ? "<1%" : Math.round(frequency) + "%";
    const xValueOfPivot = scales.x(pivots[pivotIdx]);
    const y1ValueOfPivot = scales.y(d[pivotIdx][1]);
    const y2ValueOfPivot = scales.y(d[pivotIdx][0]);

    select("#vline")
      .style("visibility", "visible")
      .attr("x1", xValueOfPivot)
      .attr("x2", xValueOfPivot)
      .attr("y1", y1ValueOfPivot)
      .attr("y2", y2ValueOfPivot);

    const left = xValueOfPivot > 0.5 * scales.x.range()[1] ? "" : `${xValueOfPivot + 25}px`;
    const right = xValueOfPivot > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - xValueOfPivot + 25}px` : "";
    const top = y1ValueOfPivot > 0.5 * scales.y(0) ? `${scales.y(0) - 50}px` : `${y1ValueOfPivot + 25}px`;

    let frequencyText = t("Frequency");
    if (projection_pivot) {
      if (pivots[pivotIdx] > projection_pivot) {
        frequencyText = t("Projected frequency");
      }
    }

    select("#freqinfo")
      .style("left", left)
      .style("right", right)
      .style("top", top)
      .style("padding-left", "10px")
      .style("padding-right", "10px")
      .style("padding-top", "0px")
      .style("padding-bottom", "0px")
      .style("visibility", "visible")
      .style("background-color", "rgba(55,55,55,0.9)")
      .style("color", "white")
      .style("font-family", dataFont)
      .style("font-size", 18)
      .style("line-height", 1)
      .style("font-weight", 300)
      .html(
        `<p>${parseColorBy(colorBy, colorOptions)}: ${labels[i]}</p>
        <p>${t("Time point")}: ${numericToCalendar(pivots[pivotIdx])}</p>
        <p>${frequencyText}: ${freqVal}</p>`
      );
  }


  /* the streams */
  svgStreamGroup.selectAll(".stream")
    .data(series)
    .enter()
    .append("path")
    .attr("d", areaObj)
    .attr("fill", colourer)
    .attr("opacity", opacity)
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .on("mousemove", handleMouseMove);

  /* the vertical line to indicate the highlighted frequency interval */
  svgStreamGroup.append("line")
    .attr("id", "vline")
    .style("visibility", "hidden")
    .style("pointer-events", "none")
    .style("stroke", "rgba(55,55,55,0.9)")
    .style("stroke-width", 4);

  drawLabelsOverStream(svgStreamGroup, series, pivots, labels, scales);
};
