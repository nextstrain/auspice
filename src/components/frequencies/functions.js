import { select, mouse } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { rgb } from "d3-color";
import { area } from "d3-shape";
import { dataFont } from "../../globalStyles";
import { prettyString } from "../../util/stringHelpers";
import { unassigned_label } from "../../util/processFrequencies";

/* C O N S T A N T S */
const opacity = 0.85;

export const areListsEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return !a.filter((el, idx) => el !== b[idx]).length;
};

export const parseColorBy = (colorBy, colorOptions) => {
  if (colorOptions[colorBy]) {
    return colorOptions[colorBy].legendTitle;
  } else if (colorBy.startsWith("gt-nuc")) { /* gt-nuc_155 */
    return `Genotype at Nuc. ${colorBy.split("_")[1]}`;
  } else if (colorBy.startsWith("gt-")) { /* gt-HA2_155 */
    const parts = colorBy.split('-')[1].split('_');
    return `Genotype at ${parts[0]} pos ${parts[1]}`;
  }
  return prettyString(colorBy);
};

const getOrderedCategories = (matrixCategories, colorScale) => {
  /* get the colorBy's in the same order as in the tree legend */
  const orderedCategories = colorScale.scale.domain()
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

export const calcXScale = (chartGeom, ticks) => {
  const x = scaleLinear()
    .domain([ticks[0], ticks[ticks.length - 1]])
    .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight]);
  return {x, numTicksX: ticks.length};
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

export const drawXAxis = (svg, chartGeom, scales) => {
  removeXAxis(svg);
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisBottom(scales.x).ticks(scales.numTicksX, ".1f"));
};
export const drawYAxis = (svg, chartGeom, scales) => {
  removeYAxis(svg);
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisLeft(scales.y).ticks(scales.numTicksY));
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
      `${colorScale.legendBoundsMap.lower_bound[name].toFixed(2)} - ${colorScale.legendBoundsMap.upper_bound[name].toFixed(2)}`
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
  categories[i] === unassigned_label ? "rgb(190, 190, 190)" : rgb(colorScale.scale(categories[i])).toString();

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
  for (let pivotIdx = 0; pivotIdx < d.length - lookahead; pivotIdx++) {
    const nextIdx = pivotIdx + lookahead;
    const displayThresh = 0.07;
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
    .text((d, i) => xyPos[i][0] ? prettyString(d) : "");
};

const calcNiceMaxYValue = (series) => {
  const max = series[series.length - 1].reduce((curMax, el) => Math.max(curMax, el[1]), 0);
  return Math.ceil(max * 20) / 20;
};

export const processMatrix = ({matrix, pivots, colorScale}) => {
  const categories = getOrderedCategories(Object.keys(matrix), colorScale);
  const series = turnMatrixIntoSeries(categories, pivots.length, matrix);
  const maxY = calcNiceMaxYValue(series);
  return {categories, series, maxY};
};

export const drawStream = (
  svgStreamGroup, scales, {categories, series}, {colorBy, colorScale, colorOptions, pivots}
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
    const freqVal = parseInt((d[pivotIdx][1] - d[pivotIdx][0]) * 100, 10) + "%";
    const xvalueOfPivot = scales.x(pivots[pivotIdx]);

    select("#vline")
      .style("visibility", "visible")
      .attr("x1", xvalueOfPivot)
      .attr("x2", xvalueOfPivot);

    const left = mousex > 0.5 * scales.x.range()[1] ? "" : `${mousex + 4}px`;
    const right = mousex > 0.5 * scales.x.range()[1] ? `${scales.x.range()[1] - mousex - 4}px` : "";
    select("#freqinfo")
      .style("left", left)
      .style("right", right)
      .style("top", `${70}px`)
      .style("visibility", "visible")
      .html(`<p>${parseColorBy(colorBy, colorOptions)}: ${prettyString(labels[i])}</p>
        <p>Time point: ${pivots[pivotIdx]}</p>
        <p>Frequency: ${freqVal}</p>`);
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

  /* the vertical line to indicate the pivot point */
  svgStreamGroup.append("line")
    .attr("id", "vline")
    .attr("y1", scales.y(1))
    .attr("y2", scales.y(0))
    .style("visibility", "hidden")
    .style("pointer-events", "none")
    .style("stroke", "hsla(0,0%,100%,.9)")
    .style("stroke-width", "5");

  drawLabelsOverStream(svgStreamGroup, series, pivots, labels, scales);
};
