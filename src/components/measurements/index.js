import React, { useRef, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { isEqual, orderBy } from "lodash";
import { NODE_VISIBLE } from "../../util/globals";
import { getColorByTitle, getTipColorAttribute } from "../../util/colorHelpers";
import { determineLegendMatch } from "../../util/tipRadiusHelpers";
import ErrorBoundary from "../../util/errorBoundary";
import Flex from "../framework/flex";
import Card from "../framework/card";
import Legend from "../tree/legend/legend";
import HoverPanel from "./hoverPanel";
import {
  createXScale,
  createYScale,
  groupMeasurements,
  clearMeasurementsSVG,
  drawMeasurementsSVG,
  drawMeansForColorBy,
  colorMeasurementsSVG,
  changeMeasurementsDisplay,
  svgContainerDOMId,
  toggleDisplay,
  addHoverPanelToMeasurementsAndMeans,
  addColorByAttrToGroupingLabel
} from "./measurementsD3";

/**
 * A custom React Hook that returns a memoized value that will only change
 * if a deep comparison using lodash.isEqual determines the value is not
 * equivalent to the previous value.
 * @param {*} value
 * @returns {*}
 */
const useDeepCompareMemo = (value) => {
  const ref = useRef();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
};

// Checks visibility against global NODE_VISIBLE
const isVisible = (visibility) => visibility === NODE_VISIBLE;

/**
 * A custom React Redux Selector that reduces the tree redux state to an object
 * with the terminal strain names and their corresponding properties that
 * are relevant for the Measurement's panel. Uses the colorScale redux state to
 * find the current color attribute per strain.
 *
 * tree.visibility and tree.nodeColors need to be arrays that have the same
 * order as tree.nodes
 * @param {Object} state
 * @returns {Object<string,Object>}
 */
const treeStrainPropertySelector = (state) => {
  const { tree, controls } = state;
  const { colorScale } = controls;
  const intitialTreeStrainProperty = {
    treeStrainVisibility: {},
    treeStrainColors: {}
  };
  return tree.nodes.reduce((treeStrainProperty, node, index) => {
    const { treeStrainVisibility, treeStrainColors } = treeStrainProperty;
    // Only store properties of terminal strain nodes
    if (!node.hasChildren) {
      treeStrainVisibility[node.name] = tree.visibility[index];
      /*
      * If the color scale is continuous, we want to group by the legend value
      * instead of the specific strain attribute in order to combine all values
      * within the legend bounds into a single group.
      */
      let attribute = getTipColorAttribute(node, colorScale);
      if (colorScale.continuous) {
        const matchingLegendValue = colorScale.visibleLegendValues
          .find((legendValue) => determineLegendMatch(legendValue, node, colorScale));
        if (matchingLegendValue !== undefined) attribute = matchingLegendValue;
      }
      treeStrainColors[node.name] = {
        attribute,
        color: tree.nodeColors[index]
      };

    }
    return treeStrainProperty;
  }, intitialTreeStrainProperty);
};

/**
 * Filters provided measurements to measurements of strains that are currently
 * visible in the tree adn that are included in the active measurements filters.
 *
 * Visibility is indicated by the numeric visibility value in the provided
 * treeStrainVisibility object for strain.
 *
 * Returns the active filters object and the filtered measurements
 * @param {Array<Object>} measurements
 * @param {Object<string,number>} treeStrainVisibility
 * @param {Object<string,Map>} filters
 * @returns {Object<Object, Array>}
 */
const filterMeasurements = (measurements, treeStrainVisibility, filters) => {
  // Find active filters to filter measurements
  const activeFilters = {};
  Object.entries(filters).forEach(([field, valuesMap]) => {
    activeFilters[field] = activeFilters[field] || [];
    valuesMap.forEach(({active}, fieldValue) => {
      // Save array of active values for the field filter
      if (active) activeFilters[field].push(fieldValue);
    });
  });

  return {
    activeFilters,
    filteredMeasurements: measurements.filter((measurement) => {
      // First check the strain is visible in the tree
      if (!isVisible(treeStrainVisibility[measurement.strain])) return false;
      // Then check that the measurement contains values for all active filters
      for (const [field, values] of Object.entries(activeFilters)) {
        if (values.length > 0 && !values.includes(measurement[field])) return false;
      }
      return true;
    })
  };
};

const MeasurementsPlot = ({height, width, showLegend, setPanelTitle}) => {
  // Use `lodash.isEqual` to deep compare object states to prevent unnecessary re-renderings of the component
  const { treeStrainVisibility, treeStrainColors } = useSelector((state) => treeStrainPropertySelector(state), isEqual);
  const legendValues = useSelector((state) => state.controls.colorScale.legendValues, isEqual);
  const colorings = useSelector((state) => state.metadata.colorings);
  const colorBy = useSelector((state) => state.controls.colorBy);
  const groupBy = useSelector((state) => state.controls.measurementsGroupBy);
  const filters = useSelector((state) => state.controls.measurementsFilters);
  const display = useSelector((state) => state.controls.measurementsDisplay);
  const showOverallMean = useSelector((state) => state.controls.measurementsShowOverallMean);
  const showThreshold = useSelector((state) => state.controls.measurementsShowThreshold);
  const collection = useSelector((state) => state.measurements.collectionToDisplay, isEqual);
  const { title, x_axis_label, threshold, fields, measurements, groupings } = collection;

  // Ref to access the D3 SVG
  const d3Ref = useRef(null);

  // State for storing data for the HoverPanel
  const [hoverData, setHoverData] = useState(null);

  // Filter and group measurements
  const {activeFilters, filteredMeasurements} = filterMeasurements(measurements, treeStrainVisibility, filters);
  const groupingOrderedValues = groupings.get(groupBy).values;
  // Default ordering of rows is the groupings value order from redux state
  let groupByValueOrder = groupingOrderedValues;
  // If there are active filters for the current group-by field, ordering is the user's filter order
  if (activeFilters[groupBy] && activeFilters[groupBy].length) {
    groupByValueOrder = activeFilters[groupBy];
  }
  const groupedMeasurements = groupMeasurements(filteredMeasurements, groupBy, groupByValueOrder);

  // Memoize D3 scale functions to allow deep comparison to work below for svgData
  const xScale = useMemo(() => createXScale(width, measurements), [width, measurements]);
  const yScale = useMemo(() => createYScale(), []);
  // Memoize all data needed for basic SVG to avoid extra re-drawings
  const svgData = useDeepCompareMemo({ xScale, yScale, x_axis_label, threshold, groupingOrderedValues, groupedMeasurements});
  // Memoize handleHover function to avoid extra useEffect calls
  const handleHover = useMemo(() => (data, dataType, mouseX, mouseY, colorByAttr=null) => {
    let newHoverData = null;
    if (data !== null) {
      // Set color-by attribute as title if provided
      const hoverTitle = colorByAttr !== null ? `Color by ${getColorByTitle(colorings, colorBy)} : ${colorByAttr}` : null;
      // Create a Map of data to save order of fields
      const newData = new Map();
      if (dataType === "measurement") {
        // Handle single measurement data
        // Filter out internal auspice fields (i.e. measurementsJitter and measurementsId)
        const displayFields = Object.keys(data).filter((field) => fields.has(field));
        // Order fields for display
        const fieldOrder = [...fields.keys()];
        const orderedFields = orderBy(displayFields, (field) => fieldOrder.indexOf(field));
        orderedFields.forEach((field) => {
          newData.set(fields.get(field).title, data[field]);
        });
      } else if (dataType === "mean") {
        // Handle mean and standard deviation data
        newData.set("mean", data.mean.toFixed(2));
        newData.set("standard deviation", data.standardDeviation ? data.standardDeviation.toFixed(2) : "N/A");
      } else {
        // Catch unknown data types
        console.error(`"Unknown data type for hover panel: ${dataType}`);
        // Display provided data without extra ordering or parsing
        Object.entries(data).forEach(([key, value]) => newData.set(key, value));
      }
      newHoverData = {
        hoverTitle,
        mouseX,
        mouseY,
        containerId: svgContainerDOMId,
        data: newData
      };
    }
    setHoverData(newHoverData);
  }, [fields, colorings, colorBy]);

  useEffect(() => {
    setPanelTitle(`${title || "Measurements"} (grouped by ${fields.get(groupBy).title})`);
  }, [setPanelTitle, title, fields, groupBy]);

  // Draw SVG from scratch
  useEffect(() => {
    clearMeasurementsSVG(d3Ref.current);
    drawMeasurementsSVG(d3Ref.current, svgData);
  }, [svgData]);

  // Color the SVG & redraw color-by means when SVG is re-drawn or when colors have changed
  useEffect(() => {
    addColorByAttrToGroupingLabel(d3Ref.current, treeStrainColors);
    colorMeasurementsSVG(d3Ref.current, treeStrainColors);
    drawMeansForColorBy(d3Ref.current, svgData, treeStrainColors, legendValues);
    addHoverPanelToMeasurementsAndMeans(d3Ref.current, handleHover, treeStrainColors);
  }, [svgData, treeStrainColors, legendValues, handleHover]);

  // Display raw/mean measurements when SVG is re-drawn, colors have changed, or display has changed
  useEffect(() => {
    changeMeasurementsDisplay(d3Ref.current, display);
  }, [svgData, treeStrainColors, legendValues, handleHover, display]);

  useEffect(() => {
    toggleDisplay(d3Ref.current, "overallMean", showOverallMean);
  }, [svgData, showOverallMean]);

  useEffect(() => {
    toggleDisplay(d3Ref.current, "threshold", showThreshold);
  }, [svgData, showThreshold]);

  const getSVGContainerStyle = () => {
    return {
      overflowY: "auto",
      position: "relative",
      height: height,
      width: width
    };
  };

  return (
    <>
      {showLegend &&
        <ErrorBoundary>
          <Legend right width={width}/>
        </ErrorBoundary>
      }
      <div id={svgContainerDOMId} style={getSVGContainerStyle()}>
        {hoverData &&
          <HoverPanel
            hoverData={hoverData}
          />
        }
        <svg
          id="d3MeasurementsSVG"
          width="100%"
          ref={d3Ref}
        />
      </div>
    </>
  );
};

const Measurements = ({height, width, showLegend}) => {
  const measurementsLoaded = useSelector((state) => state.measurements.loaded);
  const measurementsError = useSelector((state) => state.measurements.error);

  const [title, setTitle] = useState("Measurements");

  const getCardTitleStyle = () => {
    /**
     * Additional styles of Card title forces it to be in one line and display
     * ellipsis if the title is too long to prevent the long title from pushing
     * the Card into the next line when viewing in grid mode
     */
    return {
      width,
      display: "block",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis"
    };
  };

  return (
    <Card title={title} titleStyles={getCardTitleStyle()}>
      {measurementsLoaded &&
        (measurementsError ?
          <Flex style={{ height, width}} direction="column" justifyContent="center">
            <p style={{ textAlign: "center" }}>
              {measurementsError}
            </p>
          </Flex> :
          <MeasurementsPlot
            height={height}
            width={width}
            showLegend={showLegend}
            setPanelTitle={setTitle}
          />
        )
      }
    </Card>
  );
};

export default Measurements;
