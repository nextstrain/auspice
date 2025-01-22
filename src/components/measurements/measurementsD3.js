import { extent, groups, mean, deviation } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleLinear } from "d3-scale";
import { select, event as d3event } from "d3-selection";
import { symbol, symbolDiamond } from "d3-shape";
import { orderBy } from "lodash";
import { measurementIdSymbol } from "../../util/globals";
import { getBrighterColor } from "../../util/colorHelpers";

/* C O N S T A N T S */
export const layout = {
  yMin: 0,
  yMax: 100,
  leftPadding: 180,
  rightPadding: 30,
  topPadding: 20,
  xAxisHeight: 50,
  subplotHeight: 100,
  subplotPadding: 10,
  circleRadius: 3,
  circleHoverRadius: 5,
  circleStrokeWidth: 1,
  circleFillOpacity: 0.5,
  circleStrokeOpacity: 0.75,
  thresholdStrokeWidth: 2,
  thresholdStroke: "#DDD",
  subplotFill: "#adb1b3",
  subplotFillOpacity: "0.15",
  diamondSize: 50,
  standardDeviationStroke: 3,
  overallMeanColor: "#000",
  yAxisTickSize: 6,
  yAxisColorByLineHeight: 9,
  yAxisColorByLineStrokeWidth: 4
};
// Display overall mean at the center of each subplot
layout['overallMeanYValue'] = layout.subplotHeight / 2;

const classes = {
  xAxis: "measurementXAxis",
  yAxis: "measurementYAxis",
  groupingValue: "measurementGroupingValue",
  yAxisColorByLabel: "measurementYAxisColorByLabel",
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
const getMeasurementDOMId = (measurement) => `meaurement_${measurement[measurementIdSymbol]}`;
const getSubplotDOMId = (groupingValueIndex) => `measurement_subplot_${groupingValueIndex}`;

/**
 * Creates the D3 linear scale for the x-axis with the provided measurements'
 * values as the domain and the panelWidth with hard-coded padding values as
 * the range. The optional paddingProportion can be provided to include additional
 * padding for the domain. Expected to be shared across all subplots.
 * @param {number} panelWidth
 * @param {Array<Object>} measurements
 * @param {number} [paddingProportion=0.1]
 * @returns {function}
 */
export const createXScale = (panelWidth, measurements, paddingProportion = 0.1) => {
  // Padding the xScale based on proportion
  // Copied from https://github.com/d3/d3-scale/issues/150#issuecomment-561304239
  function padLinear([x0, x1], k) {
    const dx = (x1 - x0) * k / 2;
    return [x0 - dx, x1 + dx];
  }

  return (
    scaleLinear()
      .domain(padLinear(extent(measurements, (m) => m.value), paddingProportion))
      .range([layout.leftPadding, panelWidth - layout.rightPadding])
      .nice()
  );
};

/**
 * Creates the D3 linear scale for the y-axis of each individual subplot with
 * the hardcoded yMin and yMax with circle diameter as the domain and the hard-coded
 * subplot height as the range.
 * @returns {function}
 */
export const createYScale = () => {
  // Account for circle diameter so the plotted circles do not get cut off
  const domainMin = layout.yMin - (2 * layout.circleRadius);
  const domainMax = layout.yMax + (2 * layout.circleRadius);
  return (
    scaleLinear()
      .domain([domainMin, domainMax])
      .range([layout.subplotHeight, 0])
      .nice()
  );
};

/**
 * Uses D3.groups() to aggregate measurements into a nested array of groups
 * The groups are sorted by the order of values in the provided groupByValueOrder.
 * @param {Array<Object>} measurements
 * @param {string} groupBy
 * @param {Array<string>} groupByValueOrder
 * @returns {Array<Array<string, Array>>}
 */
export const groupMeasurements = (measurements, groupBy, groupByValueOrder) => {
  return orderBy(
    groups(measurements, (d) => d[groupBy]),
    ([groupingValue]) => groupByValueOrder.indexOf(groupingValue),
    "asc");
};

export const clearMeasurementsSVG = (ref, xAxisRef) => {
  select(ref)
    .attr("height", null)
    .selectAll("*").remove();

  select(xAxisRef)
    .selectAll("*").remove();
};

const drawMeanAndStandardDeviation = (values, d3ParentNode, containerClass, colorBy, xScale, yValue) => {
  const meanAndStandardDeviation = {
    colorByAttr: colorBy.attribute,
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
    .attr("fill", colorBy.color);

  if (meanAndStandardDeviation.standardDeviation !== undefined) {
    container.append("line")
      .attr("class", classes.standardDeviation)
      .attr("x1", (d) => xScale(d.mean - d.standardDeviation))
      .attr("x2", (d) => xScale(d.mean + d.standardDeviation))
      .attr("y1", yValue)
      .attr("y2", yValue)
      .attr("stroke-width", layout.standardDeviationStroke)
      .attr("stroke", colorBy.color);
  }
};

const drawStickyXAxis = (ref, containerHeight, svgHeight, xScale, x_axis_label) => {
  const svg = select(ref);

  /**
   * Add top sticky-constraint to make sure the x-axis is always visible
   * Uses the minimum constraint to keep x-axis directly at the bottom of the
   * measurements SVG even when the SVG is smaller than the container
   */
  const stickyTopConstraint = Math.min((containerHeight - layout.xAxisHeight), svgHeight);
  svg.style("top", `${stickyTopConstraint}px`);

  // Add white background rect so the axis doesn't overlap with underlying measurements
  svg.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", "100%")
    .attr("width", "100%")
    .attr("fill", "white")
    .attr("fill-opacity", 1);

  // Draw sticky x-axis
  const svgWidth = svg.node().getBoundingClientRect().width;
  svg.append("g")
    .attr("class", classes.xAxis)
    .call(axisBottom(xScale))
    .call((g) => g.attr("font-family", null))
    .append("text")
      .attr("x", layout.leftPadding + ((svgWidth - layout.leftPadding - layout.rightPadding)) / 2)
      .attr("y", layout.xAxisHeight * 2 / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text(x_axis_label);
};

export const drawMeasurementsSVG = (ref, xAxisRef, svgData, handleClickOnGrouping) => {
  const {containerHeight, xScale, yScale, x_axis_label, thresholds, groupingOrderedValues, groupedMeasurements} = svgData;

  // Do not draw SVG if there are no measurements
  if (groupedMeasurements && groupedMeasurements.length === 0) return;

  // The number of groups is the number of subplots, which determines the final SVG height
  const totalSubplotHeight = (layout.subplotHeight * groupedMeasurements.length);
  const svgHeight = totalSubplotHeight + layout.topPadding;
  /* TODO: remove intermediate <g>s once the 1Password extension interference is resolved
   * <https://github.com/nextstrain/auspice/issues/1919>
   */
  const svg = select(ref).attr("height", svgHeight).append("g").append("g").append("g").append("g");

  // x-axis is in a different SVG element to allow sticky positioning
  drawStickyXAxis(xAxisRef, containerHeight, svgHeight, xScale, x_axis_label);

  // Add threshold(s) if provided
  if (Array.isArray(thresholds)) {
    for (const threshold of thresholds) {
      if (typeof threshold !== "number") continue;
      const thresholdXValue = xScale(threshold);
      svg.append("line")
        .attr("class", classes.threshold)
        .attr("x1", thresholdXValue)
        .attr("x2", thresholdXValue)
        .attr("y1", layout.topPadding)
        .attr("y2", svgHeight)
        .attr("stroke-width", layout.thresholdStrokeWidth)
        .attr("stroke", layout.thresholdStroke)
        // Hide threshold by default since another function will toggle display
        .attr("display", "none");
    }
  }

  // Create a subplot for each grouping
  let prevSubplotBottom = layout.topPadding;
  groupedMeasurements.forEach(([groupingValue, measurements], index) => {
    // Make each subplot its own SVG to re-use the same subplot yScale
    const subplot = svg.append("svg")
      .attr("class", classes.subplot)
      .attr("id", getSubplotDOMId(groupingOrderedValues.indexOf(groupingValue)))
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
      .attr("cursor", "pointer")
      .call(
        axisLeft(yScale)
          .tickValues([yScale((layout.yMax - layout.yMin) / 2)])
          .tickSize(layout.yAxisTickSize)
          .tickFormat(groupingValue))
      .call((g) => {
        // Add tooltip to hint at color by measurements feature
        g.selectAll('.tick')
          .append("title")
            .text("Click to color by an average of all measurement values per test strain in this group");

        g.attr("font-family", null);
        // If necessary, scale down the text to fit in the available space for the y-Axis labels
        // This does mean that if the text is extremely long, it can be unreadable.
        // We can improve on this by manually splitting the text into parts that can fit on multiple lines,
        // but there're always limits of the available space so punting that for now.
        //    -Jover, 20 September 2022
        g.selectAll('text')
          .attr("class", classes.groupingValue)
          .attr("transform", (_, i, element) => {
            const textWidth = select(element[i]).node().getBoundingClientRect().width;
            // Subtract the twice the y-axis tick size to give some padding around the text
            const availableTextWidth = layout.leftPadding - (2 * layout.yAxisTickSize);
            if (textWidth > availableTextWidth) {
              return `scale(${availableTextWidth / textWidth})`;
            }
            return null;
          });
      })
      .on("click", () => handleClickOnGrouping(groupingValue));

    // Add circles for each measurement
    // Note, "cy" is added later when jittering within color-by groups
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
        .attr("r", layout.circleRadius)
        .attr("fill-opacity", layout.circleFillOpacity)
        .attr("stroke-opacity", layout.circleStrokeOpacity)
        .on("mouseover.radius", (d, i, elements) => {
          select(elements[i]).transition()
            .duration("100")
            .attr("r", layout.circleHoverRadius);
        })
        .on("mouseout.radius", (_, i, elements) => {
          select(elements[i]).transition()
            .duration("200")
            .attr("r", layout.circleRadius);
        });

    // Draw overall mean and standard deviation for measurement values
    drawMeanAndStandardDeviation(
      measurements.map((d) => d.value),
      subplot,
      classes.overallMean,
      {attribute: null, color: layout.overallMeanColor},
      xScale,
      layout.overallMeanYValue
    );
  });
};

export const colorMeasurementsSVG = (ref, treeStrainColors) => {
  const svg = select(ref);
  svg.selectAll(`.${classes.rawMeasurements}`)
    .style("stroke", (d) => treeStrainColors[d.strain].color)
    .style("stroke-width", layout.circleStrokeWidth)
    .style("fill", (d) => getBrighterColor(treeStrainColors[d.strain].color));
};

export const jitterRawMeansByColorBy = (ref, svgData, treeStrainColors, legendValues) => {
  const { groupedMeasurements } = svgData;
  const svg = select(ref);

  groupedMeasurements.forEach(([_, measurements]) => {
    // For each color-by attribute, create an array of measurement DOM ids
    const colorByGroups = {};
    measurements.forEach((measurement) => {
      const { attribute } = treeStrainColors[measurement.strain];
      colorByGroups[attribute] = colorByGroups[attribute] || [];
      colorByGroups[attribute].push(getMeasurementDOMId(measurement));
    });
    // Calculate total available subplot height
    // Accounts for top/bottom padding and padding between color-by groups
    const numberOfColorByAttributes = Object.keys(colorByGroups).length;
    const totalColorByPadding = (numberOfColorByAttributes - 1) * 2 * layout.circleRadius;
    const availableSubplotHeight = layout.subplotHeight - (2*layout.subplotPadding) - totalColorByPadding;

    let currentYMin = layout.subplotPadding;
    Object.keys(colorByGroups)
      // Sort by legendValues for stable ordering of color-by groups
      .sort((a, b) => legendValues.indexOf(a) - legendValues.indexOf(b))
      .forEach((attribute) => {
        // Calculate max Y value for each color-by attribute
        // This is determined by the proportion of measurements in each attribute group
        const domIds = colorByGroups[attribute];
        const proportionOfMeasurements = domIds.length / measurements.length;
        const currentYMax = currentYMin + (proportionOfMeasurements * availableSubplotHeight);
        // Jitter "cy" value for each raw measurement
        domIds.forEach((domId) => {
          const jitter = Math.random() * (currentYMax - currentYMin) + currentYMin;
          svg.select(`#${domId}`).attr("cy", jitter);
        });
        // Set next min Y value for next color-by attribute group
        currentYMin = currentYMax + (2 * layout.circleRadius);
      });
  });
};

export const drawMeansForColorBy = (ref, svgData, treeStrainColors, legendValues) => {
  const { xScale, groupingOrderedValues, groupedMeasurements } = svgData;
  const svg = select(ref);
  // Remove all current color by means
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
    const subplot = svg.select(`#${getSubplotDOMId(groupingOrderedValues.indexOf(groupingValue))}`);
    const numberOfColorByAttributes = Object.keys(colorByGroups).length;
    // Calc space between means to evenly spread them within subplot
    // 2 x subplotPadding for padding of top and bottom of each subplot
    // 2 x subplotPadding for padding around the overall mean display
    const ySpacing = (layout.subplotHeight - 4 * layout.subplotPadding) / (numberOfColorByAttributes - 1);
    let yValue = layout.subplotPadding;
    // Order the color groups by the legend value order so that we have a stable order for the means
    const orderedColorGroups = orderBy(
      Object.keys(colorByGroups),
      (key) => legendValues.indexOf(key),
      "asc"
    );

    orderedColorGroups
      .forEach((attribute) => {
        const {color, values} = colorByGroups[attribute];
        drawMeanAndStandardDeviation(
          values,
          subplot,
          classes.colorMean,
          {attribute, color},
          xScale,
          yValue
        );
        // Increase yValue for next attribute mean
        yValue += ySpacing;
        // If the next yValue is near the overall mean display,
        // shift to below the overall mean display + subplotPadding
        if (yValue > (layout.overallMeanYValue - layout.subplotPadding) &&
            yValue < (layout.overallMeanYValue + layout.subplotPadding)) {
          yValue = layout.overallMeanYValue + layout.subplotPadding;
        }
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

export const toggleDisplay = (ref, elementClass, displayOn) => {
  const displayAttr = displayOn ? null : "none";
  select(ref)
    .selectAll(`.${classes[elementClass]}`)
      .attr("display", displayAttr);
};

export const addHoverPanelToMeasurementsAndMeans = (ref, handleHover, treeStrainColors) => {
  const svg = select(ref);
  svg.selectAll(`.${classes.rawMeasurements},.${classes.mean},.${classes.standardDeviation}`)
    .on("mouseover.hoverPanel", (d, i, elements) => {
      // Get mouse position for HoverPanel
      const { clientX, clientY } = d3event;

      // Use class name to check data type
      const className = elements[i].getAttribute("class");
      const dataType = className === classes.rawMeasurements ? "measurement" : "mean";

      // For the means, the bound data includes the color-by attribute
      // For the measurements, we need to get the color-by attribute from treeStrainColors
      let colorByAttr = d.colorByAttr;
      if (dataType === "measurement") {
        colorByAttr = treeStrainColors[d.strain]?.attribute || "undefined";
      }

      // sets hover data state to trigger the hover panel display
      handleHover(d, clientX, clientY, colorByAttr);
    })
    .on("mouseout.hoverPanel", () => handleHover(null));
};

export const addColorByAttrToGroupingLabel = (ref, treeStrainColors) => {
  const svg = select(ref);
  // Remove all previous color-by labels for the y-axis
  svg.selectAll(`.${classes.yAxisColorByLabel}`).remove();
  // Loop through the y-axis labels to check if they have a corresponding color-by
  svg.selectAll(`.${classes.yAxis}`).select(".tick")
    .each((_, i, elements) => {
      const groupingLabel = select(elements[i]);
      const groupingValue = groupingLabel.select(`.${classes.groupingValue}`).text();
      const groupingValueColorBy = treeStrainColors[groupingValue];
      if (groupingValueColorBy) {
        // Get the current label width to add colored line and text relative to the width
        const labelWidth = groupingLabel.node().getBoundingClientRect().width;
        groupingLabel.append("line")
          .attr("class", classes.yAxisColorByLabel)
          .attr("x1", -layout.yAxisTickSize)
          .attr("x2", -labelWidth)
          .attr("y1", layout.yAxisColorByLineHeight)
          .attr("y2", layout.yAxisColorByLineHeight)
          .attr("stroke-width", layout.yAxisColorByLineStrokeWidth)
          .attr("stroke", groupingValueColorBy.color);

        groupingLabel.append("text")
          .attr("class", classes.yAxisColorByLabel)
          .attr("x", labelWidth * -0.5)
          .attr("dy", layout.yAxisColorByLineHeight * 2 + layout.yAxisColorByLineStrokeWidth)
          .attr("text-anchor", "middle")
          .attr("fill", "currentColor")
          .text(`(${groupingValueColorBy.attribute})`);
      }
    });
};

const colorGroupingCrosshairId = "measurementsColorGroupingCrosshair";
export const removeColorGroupingCrosshair = (ref) => {
  const svg = select(ref);
  svg.select(`#${colorGroupingCrosshairId}`).remove();
};

export const addGroupingValueCrosshair = (ref, groupingValue) => {
  // Remove previous color grouping crosshair
  removeColorGroupingCrosshair(ref);

  const svg = select(ref);
  svg.selectAll(`.${classes.yAxis}`).select(".tick")
    .each((_, i, elements) => {
      const groupingLabel = select(elements[i]);
      const currentGroupingValue = groupingLabel.select(`.${classes.groupingValue}`).text()
      if (groupingValue === currentGroupingValue){
        const {width} = groupingLabel.node().getBoundingClientRect();
        groupingLabel.append("svg")
          .attr("id", colorGroupingCrosshairId)
          .attr("stroke", "currentColor")
          .attr("fill", "currentColor")
          .attr("strokeWidth", "0")
          .attr("viewBox", "0 0 256 256")
          .attr("height", layout.yAxisColorByLineHeight * 2)
          .attr("width", layout.yAxisColorByLineHeight * 2)
          .attr("x", -width - (layout.yAxisColorByLineHeight * 2))
          .attr("y", -layout.yAxisColorByLineHeight)
          .append("path")
            // path copied from react-icons/pi/PiCrosshairSimpleBold
            .attr("d", "M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20Zm12,191.13V184a12,12,0,0,0-24,0v27.13A84.18,84.18,0,0,1,44.87,140H72a12,12,0,0,0,0-24H44.87A84.18,84.18,0,0,1,116,44.87V72a12,12,0,0,0,24,0V44.87A84.18,84.18,0,0,1,211.13,116H184a12,12,0,0,0,0,24h27.13A84.18,84.18,0,0,1,140,211.13Z" )

      }
    });
}
