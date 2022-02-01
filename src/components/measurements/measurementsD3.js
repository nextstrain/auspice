import { extent, groups, mean, deviation } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import { select, event as d3event } from "d3-selection";
import { symbol, symbolDiamond } from "d3-shape";
import { orderBy } from "lodash";

/* C O N S T A N T S */
const layout = {
  leftPadding: 120,
  rightPadding: 30,
  topPadding: 20,
  bottomPadding: 50,
  subplotHeight: 100,
  subplotPadding: 10,
  circleRadius: 3,
  circleHoverRadius: 5,
  thresholdStrokeWidth: 2,
  thresholdStroke: "#DDD",
  subplotFill: "#adb1b3",
  subplotFillOpacity: "0.15",
  diamondSize: 25,
  standardDeviationStroke: 2,
  overallMeanColor: "#000"
};

const classes = {
  xAxis: "measurementXAxis",
  yAxis: "measurementYAxis",
  threshold: "measurementThreshold",
  subplot: "measurementSubplot",
  subplotBackground: "measurementSubplotBackground",
  rawMeasurements: "rawMeasurements",
  rawMeasurementsGroup: "rawMeasurementsGroup",
  overallMean: "measurementsOverallMean",
  colorMean: "measurementsColorMean",
  mean: "mean",
  standardDeviation: "standardDeviation"
};

export const svgContainerDOMId = "measurementsSVGContainer";
const getMeasurementDOMId = (measurement) => `meaurement_${measurement.measurementId}`;
const domIdRegex = new RegExp("[^\\w\\-_]+", "gi");
const getSubplotDOMId = (groupingValue) => `measurment_subplot_${groupingValue.replace(domIdRegex, "_")}`;

/**
 * Creates the D3 linear scale for the x-axis with the provided measurements'
 * values as the domain and the panelWidth with hard-coded padding values as
 * the range. Expected to be shared across all subplots.
 * @param {number} panelWidth
 * @param {Array<Object>} measurements
 * @returns {function}
 */
export const createXScale = (panelWidth, measurements) => {
  return (
    scaleLinear()
      .domain(extent(measurements, (m) => m.value))
      .range([layout.leftPadding, panelWidth - layout.rightPadding])
      .nice()
  );
};

/**
 * Creates the D3 linear scale for the y-axis of each individual subplot with
 * the provided measurements' jitters as the domain and the hard-coded
 * subplot height as the range.
 * @param {Array<Object>} measurements
 * @returns {function}
 */
export const createYScale = (measurements) => {
  return (
    scaleLinear()
      .domain(extent(measurements, (m) => m.measurementJitter))
      .range([layout.subplotHeight, 0])
      .nice()
  );
};

/**
 * Uses D3.groups() to aggregate measurements into a nested array of groups
 * The groups are sorted with the most number of measurements first.
 * @param {Array<Object>} measurements
 * @param {string} groupBy
 * @returns {Array<Array<string, Array>>}
 */
export const groupMeasurements = (measurements, groupBy) => {
  const groupedMeasurements = groups(measurements, (d) => d[groupBy]);
  return orderBy(
    groupedMeasurements,
    ([, groupingMeasurements]) => groupingMeasurements.length,
    "desc");
};

export const clearMeasurementsSVG = (ref) => {
  select(ref)
    .attr("height", null)
    .selectAll("*").remove();
};

const drawMeanAndStandardDeviation = (values, d3ParentNode, containerClass, color, xScale, yValue) => {
  const meanAndStandardDeviation = {
    mean: mean(values),
    standardDeviation: deviation(values)
  };
  // Container for both mean and standard deviation
  const container = d3ParentNode.append("g")
    .attr("class", containerClass)
    .attr("display", "none")
    .selectAll("meanAndStandardDeviation")
    .data([meanAndStandardDeviation])
    .enter();

  container.append("path")
    .attr("class", classes.mean)
    .attr("transform", (d) => `translate(${xScale(d.mean)}, ${yValue})`)
    .attr("d", symbol().type(symbolDiamond).size(layout.diamondSize))
    .attr("fill", color);

  if (meanAndStandardDeviation.standardDeviation !== undefined) {
    container.append("line")
      .attr("class", classes.standardDeviation)
      .attr("x1", (d) => xScale(d.mean - d.standardDeviation))
      .attr("x2", (d) => xScale(d.mean + d.standardDeviation))
      .attr("y1", yValue)
      .attr("y2", yValue)
      .attr("stroke-width", layout.standardDeviationStroke)
      .attr("stroke", color);
  }
};

export const drawMeasurementsSVG = (ref, svgData) => {
  const {xScale, yScale, x_axis_label, threshold, groupedMeasurements} = svgData;

  // Do not draw SVG if there are no measurements
  if (groupedMeasurements && groupedMeasurements.length === 0) return;

  const svg = select(ref);
  const svgWidth = svg.node().getBoundingClientRect().width;

  // The number of groups is the number of subplots, which determines the final SVG height
  const totalSubplotHeight = (layout.subplotHeight * groupedMeasurements.length);
  const svgHeight = totalSubplotHeight + layout.topPadding + layout.bottomPadding;
  svg.attr("height", svgHeight);

  // Add threshold if provided
  if (threshold !== null) {
    const thresholdXValue = xScale(threshold);
    svg.append("line")
      .attr("class", classes.threshold)
      .attr("x1", thresholdXValue)
      .attr("x2", thresholdXValue)
      .attr("y1", layout.topPadding)
      .attr("y2", svgHeight - layout.bottomPadding)
      .attr("stroke-width", layout.thresholdStrokeWidth)
      .attr("stroke", layout.thresholdStroke)
      // Hide threshold by default since another function will toggle display
      .attr("display", "none");
  }

  // Add x-axis to the bottom of the SVG
  // (above the bottomPadding to leave room for the x-axis label)
  svg.append("g")
    .attr("class", classes.xAxis)
    .attr("transform", `translate(0, ${svgHeight - layout.bottomPadding})`)
    .call(axisBottom(xScale))
    .append("text")
      .attr("x", layout.leftPadding + ((svgWidth - layout.leftPadding - layout.rightPadding)) / 2)
      .attr("y", layout.bottomPadding * 2 / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text(x_axis_label);

  // Create a subplot for each grouping
  let prevSubplotBottom = layout.topPadding;
  groupedMeasurements.forEach(([groupingValue, measurements], index) => {
    // Make each subplot it's own SVG to re-use the same subplot yScale
    const subplot = svg.append("svg")
      .attr("class", classes.subplot)
      .attr("id", getSubplotDOMId(groupingValue))
      .attr("width", "100%")
      .attr("height", layout.subplotHeight)
      .attr("y", prevSubplotBottom);

    // Add subplot height to keep track of y position for next subplot
    prevSubplotBottom += layout.subplotHeight;

    // Add a rect to fill the entire width with a light grey background for every other group
    subplot.append("rect")
      .attr("class", classes.subplotBackground)
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("fill", index % 2 ? layout.subplotFill : "none")
      .attr("fill-opacity", layout.subplotFillOpacity);

    // Add y axis with a single tick that displays the grouping value
    subplot.append("g")
      .attr("class", classes.yAxis)
      .attr("transform", `translate(${layout.leftPadding}, 0)`)
      .call(
        axisLeft(yScale)
          .ticks(1)
          .tickFormat(() => groupingValue));

    // Add circles for each measurement
    subplot.append("g")
      .attr("class", classes.rawMeasurementsGroup)
      .attr("display", "none")
      .selectAll("dot")
      .data(measurements)
      .enter()
      .append("circle")
        .attr("class", classes.rawMeasurements)
        .attr("id", (d) => getMeasurementDOMId(d))
        .attr("cx", (d) => xScale(d.value))
        .attr("cy", (d) => yScale(d.measurementJitter))
        .attr("r", layout.circleRadius);

    // Draw overall mean and standard deviation for measurement values
    drawMeanAndStandardDeviation(
      measurements.map((d) => d.value),
      subplot,
      classes.overallMean,
      layout.overallMeanColor,
      xScale,
      layout.subplotHeight / 2
    );
  });
};

export const colorMeasurementsSVG = (ref, treeStrainColors) => {
  const svg = select(ref);
  svg.selectAll(`.${classes.rawMeasurements}`)
    .style("fill", (d) => treeStrainColors[d.strain].color);
};

export const drawMeansForColorBy = (ref, svgData, treeStrainColors) => {
  const { xScale, groupedMeasurements } = svgData;
  const svg = select(ref);
  // Re move all current color by means
  svg.selectAll(`.${classes.colorMean}`).remove();
  // Calc and draw color by means for each group
  groupedMeasurements.forEach(([groupingValue, measurements]) => {
    // For each color-by attribute, create an array of measurement values and keep track of color
    const colorByGroups = {};
    measurements.forEach((measurement) => {
      const { attribute, color } = treeStrainColors[measurement.strain];
      colorByGroups[attribute] = colorByGroups[attribute] || {color: null, values: []};
      colorByGroups[attribute].values.push(measurement.value);
      if (!colorByGroups[attribute].color) {
        colorByGroups[attribute].color = color;
      }
    });
    // Plot mean/SD for each color-by attribute within subplot
    const subplot = svg.select(`#${getSubplotDOMId(groupingValue)}`);
    const numberOfColorByAttributes = Object.keys(colorByGroups).length;
    // Calc space between means to evenly spread them within subplot
    const ySpacing = (layout.subplotHeight - 2 * layout.subplotPadding) / (numberOfColorByAttributes - 1);
    let yValue = layout.subplotPadding;
    Object.values(colorByGroups).forEach(({color, values}) => {
      drawMeanAndStandardDeviation(
        values,
        subplot,
        classes.colorMean,
        color,
        xScale,
        yValue
      );
      // Increate yValue for next attribute mean
      yValue += ySpacing;
    });
  });
};

export const changeMeasurementsDisplay = (ref, display) => {
  const svg = select(ref);
  const dataDisplayClasses = {
    raw: classes.rawMeasurementsGroup,
    mean: classes.colorMean
  };
  Object.entries(dataDisplayClasses).forEach(([displayOption, displayClass]) => {
    svg.selectAll(`.${displayClass}`)
      .attr("display", display === displayOption ? null : "none");
  });
};

export const setHoverTransition = (ref, handleHover) => {
  const svg = select(ref);
  // Handle hovers of raw measurements
  svg.selectAll(`.${classes.rawMeasurements}`)
    .on("mouseover", (d, i, elements) => {
      select(elements[i]).transition()
        .duration("100")
        .attr("r", layout.circleHoverRadius);

      // Get mouse position for HoverPanel
      const { clientX, clientY } = d3event;
      // sets hover data state to trigger the hover panel display
      handleHover(d, "measurement", clientX, clientY);
    })
    .on("mouseout", (_, i, elements) => {
      select(elements[i]).transition()
        .duration("200")
        .attr("r", layout.circleRadius);
      // sets hover data state to null to hide the hover panel display
      handleHover(null);
    });

  // Handle hovers of mean and standard deviations
  svg.selectAll(`.${classes.mean}, .${classes.standardDeviation}`)
    .on("mouseover", (d) => {
      // Get mouse position for HoverPanel
      const { clientX, clientY } = d3event;
      handleHover(d, "mean", clientX, clientY);
    })
    .on("mouseout", () => handleHover(null));
};

export const toggleDisplay = (ref, elementClass, displayOn) => {
  const displayAttr = displayOn ? null : "none";
  select(ref)
    .selectAll(`.${classes[elementClass]}`)
      .attr("display", displayAttr);
};
