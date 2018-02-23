import { select, mouse } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { rgb } from "d3-color";
import { area } from "d3-shape";
import { dataFont } from "../../globalStyles";

/* C O N S T A N T S */
const opacity = 0.85;

export const getOrderedCategories = (categories, colorScale) => {
  /* get the colorBy's in the same order as in the tree legend */
  const legendOrderingReversed = colorScale.scale.domain()
    .filter((d) => d !== undefined)
    .reverse()
    .map((v) => v.toString());
  if (categories.length > legendOrderingReversed.length) {
    categories.forEach((v) => {
      if (legendOrderingReversed.indexOf(v) === -1) {
        legendOrderingReversed.push(v);
      }
    });
  }
  return legendOrderingReversed;
};

export const calcScales = (chartGeom, ticks) => {
  const x = scaleLinear()
    .domain([ticks[0], ticks[ticks.length - 1]])
    .range([chartGeom.spaceLeft, chartGeom.width - chartGeom.spaceRight]);
  const y = scaleLinear()
    .domain([0, 1])
    .range([chartGeom.height - chartGeom.spaceBottom, chartGeom.spaceTop]);
  return {x, y, numTicksX: ticks.length, numTicksY: 5};
};

export const drawAxis = (svg, chartGeom, scales) => {
  /* no idea why I need to add 15 to some of these translations... */
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${chartGeom.height - chartGeom.spaceBottom})`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisBottom(scales.x).ticks(scales.numTicksX, ".1f"));
  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", `translate(${chartGeom.spaceLeft},0)`)
    .style("font-family", dataFont)
    .style("font-size", "12px")
    .call(axisLeft(scales.y).ticks(scales.numTicksY));
};

export const turnMatrixIntoSeries = (categories, nPivots, matrix) => {
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

export const getMeaningfulLabels = (categories, colorScale) => {
  if (colorScale.continuous) {
    const labels = [];
    for (let i = 0; i < categories.length; i++) {
      labels[i] = `${colorScale.legendBoundsMap.lower_bound[categories[i]].toFixed(2)} - ${colorScale.legendBoundsMap.upper_bound[categories[i]].toFixed(2)}`;
    }
    return labels;
  }
  return categories.slice();
};

export const drawTooltip = () => {
  select("#freqinfo")
    .style("position", "absolute")
    .style("z-index", "20")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("background-color", "hsla(0,0%,100%,.9)")
    .style("pointer-events", "none")
    .style("visibility", "hidden");
};

export const generateColorScaleD3 = (categories, colorScale) => (d, i) =>
  categories[i] === "N/A" ? "rgb(190, 190, 190)" : rgb(colorScale.scale(categories[i])).toString();

function handleMouseOver() {
  select(this).attr("opacity", 1);
}

function handleMouseOut() {
  select(this).attr("opacity", opacity);
  select("#freqinfo").style("visibility", "hidden");
  select("#vline").style("visibility", "hidden");
}

export const drawStream = (svgStreamGroup, scales, colorBy, labels, pivots, series, colourer) => {
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

    select("#freqinfo")
      .style("left", `${mousex + 4}px`)
      .style("top", `${50}px`)
      .style("visibility", "visible")
      .html(`<p>${colorBy}: ${labels[i]}</p><p>Pivot: ${pivots[pivotIdx]}</p><p>Frequency ${freqVal}</p>`);
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
};


export const removeStream = (svg) => {
  svg.selectAll("path").remove();
  svg.selectAll("line").remove();
};
