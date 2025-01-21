import React, { CSSProperties, MutableRefObject, useCallback, useRef, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isEqual, orderBy } from "lodash";
import { NODE_VISIBLE } from "../../util/globals";
import { getColorByTitle, getTipColorAttribute } from "../../util/colorHelpers";
import { determineLegendMatch } from "../../util/tipRadiusHelpers";
import ErrorBoundary from "../../util/errorBoundary";
import Flex from "../framework/flex";
import Card from "../framework/card";
import Legend from "../tree/legend/legend";
import HoverPanel, { HoverData } from "./hoverPanel";
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
  addColorByAttrToGroupingLabel,
  layout,
  jitterRawMeansByColorBy,
  addGroupingValueCrosshair,
  removeColorGroupingCrosshair,
} from "./measurementsD3";
import { RootState } from "../../store";
import { MeasurementFilters } from "../../reducers/controls";
import { Visibility } from "../../reducers/tree/types";
import { Measurement, isMeasurement } from "../../reducers/measurements/types";
import {
  applyMeasurementsColorBy,
  isMeasurementColorBy,
  getActiveMeasurementFilters,
  matchesAllActiveFilters
} from "../../actions/measurements";
import { changeColorBy } from "../../actions/colors";

interface MeanAndStandardDeviation {
  mean: number
  standardDeviation: number | undefined
}
function isMeanAndStandardDeviation(x: any): x is MeanAndStandardDeviation {
  return (
    typeof x.mean === "number" &&
    (typeof x.standardDeviation === "number" || x.standardDeviation === undefined)
  )
}
interface TreeStrainVisibility {
  [strain: string]: Visibility
}
interface TreeStrainProperties {
  treeStrainVisibility: TreeStrainVisibility
  treeStrainColors: {
    [strain: string]: {
      attribute: string
      color: string
    }
  }
}

/**
 * A custom React Hook that returns a memoized value that will only change
 * if a deep comparison using lodash.isEqual determines the value is not
 * equivalent to the previous value.
 */
function useDeepCompareMemo<T>(value: T): T {
  const ref: MutableRefObject<T> = useRef();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current;
}

// Checks visibility against global NODE_VISIBLE
const isVisible = (visibility: Visibility): boolean => visibility === NODE_VISIBLE;

/**
 * A custom React Redux Selector that reduces the tree redux state to an object
 * with the terminal strain names and their corresponding properties that
 * are relevant for the Measurement's panel. Uses the colorScale redux state to
 * find the current color attribute per strain.
 *
 * tree.visibility and tree.nodeColors need to be arrays that have the same
 * order as tree.nodes
 */
const treeStrainPropertySelector = (
  state: RootState
): TreeStrainProperties => {
  const { tree, controls } = state;
  const { colorScale } = controls;
  const initialTreeStrainProperty: TreeStrainProperties = {
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
  }, initialTreeStrainProperty);
};

/**
 * Filters provided measurements to measurements of strains that are currently
 * visible in the tree adn that are included in the active measurements filters.
 *
 * Visibility is indicated by the numeric visibility value in the provided
 * treeStrainVisibility object for strain.
 *
 * Returns the active filters object and the filtered measurements
 */
const filterMeasurements = (
  measurements: Measurement[],
  treeStrainVisibility: TreeStrainVisibility,
  filters: MeasurementFilters
): {
  activeFilters: {string?: string[]}
  filteredMeasurements: Measurement[]
} => {
  // Find active filters to filter measurements
  const activeFilters = getActiveMeasurementFilters(filters);

  return {
    activeFilters,
    filteredMeasurements: measurements.filter((measurement) => {
      // First check the strain is visible in the tree
      if (!isVisible(treeStrainVisibility[measurement.strain])) return false;
      // Then check that the measurement contains values for all active filters
      return matchesAllActiveFilters(measurement, activeFilters);
    })
  };
};

const MeasurementsPlot = ({height, width, showLegend, setPanelTitle}) => {
  const dispatch = useDispatch();
  // Use `lodash.isEqual` to deep compare object states to prevent unnecessary re-renderings of the component
  const { treeStrainVisibility, treeStrainColors } = useSelector((state: RootState) => treeStrainPropertySelector(state), isEqual);
  // Convert legendValues to string to ensure that subsequent attribute matches work as intended
  const legendValues = useSelector((state: RootState) => state.controls.colorScale.legendValues.map(String), isEqual);
  const colorings = useSelector((state: RootState) => state.metadata.colorings);
  const colorBy = useSelector((state: RootState) => state.controls.colorBy);
  const defaultColorBy = useSelector((state: RootState) => state.controls.defaults.colorBy);
  const colorGrouping = useSelector((state: RootState) => state.controls.measurementsColorGrouping);
  const groupBy = useSelector((state: RootState) => state.controls.measurementsGroupBy);
  const filters = useSelector((state: RootState) => state.controls.measurementsFilters);
  const display = useSelector((state: RootState) => state.controls.measurementsDisplay);
  const showOverallMean = useSelector((state: RootState) => state.controls.measurementsShowOverallMean);
  const showThreshold = useSelector((state: RootState) => state.controls.measurementsShowThreshold);
  const collection = useSelector((state: RootState) => state.measurements.collectionToDisplay, isEqual);
  const { title, x_axis_label, thresholds, fields, measurements, groupings } = collection;

  // Ref to access the D3 SVG
  const svgContainerRef: MutableRefObject<HTMLDivElement> = useRef(null);
  const d3Ref: MutableRefObject<SVGSVGElement> = useRef(null);
  const d3XAxisRef: MutableRefObject<SVGSVGElement> = useRef(null);

  // State for storing data for the HoverPanel
  const [hoverData, setHoverData] = useState<HoverData>(null);

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

  //
  /**
   * Memoize D3 scale functions to allow deep comparison to work below for svgData
   * Using `useMemo` instead of `useCallback` because `useCallback` is specifically designed for inline functions
   * and will raise lint errors, see https://github.com/facebook/react/issues/19240#issuecomment-652945246
   *
   * Silencing warnings for useMemo's dependency list since we need to do a deep comparison of `filteredMeasurements` array
   *  -Jover, 28 August 2024
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const xScale = useMemo(() => createXScale(width, filteredMeasurements), [width, filteredMeasurements].map(useDeepCompareMemo));
  const yScale = useMemo(() => createYScale(), []);
  // Memoize all data needed for basic SVG to avoid extra re-drawings
  const svgData = useDeepCompareMemo({
    containerHeight: height,
    xScale,
    yScale,
    x_axis_label,
    thresholds,
    groupingOrderedValues,
    groupedMeasurements
  });
  // Cache handleHover function to avoid extra useEffect calls
  const handleHover = useCallback((
    data: Measurement | MeanAndStandardDeviation,
    mouseX: number,
    mouseY: number,
    colorByAttr: string = null
  ): void => {
    let newHoverData = null;
    if (data !== null) {
      // Set color-by attribute as title if provided
      const hoverTitle = colorByAttr !== null ? `Color by ${getColorByTitle(colorings, colorBy)} : ${colorByAttr}` : null;
      // Create a Map of data to save order of fields
      const newData = new Map();
      if (isMeasurement(data)) {
        // Handle single measurement data
        // Filter out internal auspice fields (i.e. measurementsJitter and measurementsId)
        const displayFields = Object.keys(data).filter((field) => fields.has(field));
        // Order fields for display
        const fieldOrder = [...fields.keys()];
        const orderedFields = orderBy(displayFields, (field) => fieldOrder.indexOf(field));
        orderedFields.forEach((field) => {
          newData.set(fields.get(field).title, data[field]);
        });
      } else if (isMeanAndStandardDeviation(data)) {
        // Handle mean and standard deviation data
        newData.set("mean", data.mean.toFixed(2));
        newData.set("standard deviation", data.standardDeviation ? data.standardDeviation.toFixed(2) : "N/A");
      } else {
        // Catch unknown data types
        console.error(`"Unknown data type for hover panel: ${JSON.stringify(data)}`);
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

  /**
   * Ref to save previous non-measurements coloring for toggling back to previous
   * coloring when clicking on the same measurements grouping twice.
   * Uses the default color by if the color is a measurements color on first
   * load, i.e. the color is set by the URL param `c=m-<grouping>`
   */
  const prevNonMeasurementColorBy: MutableRefObject<string> = useRef(isMeasurementColorBy(colorBy) ? defaultColorBy : colorBy);
  useEffect(() => {
    if (!isMeasurementColorBy(colorBy)) {
      prevNonMeasurementColorBy.current = colorBy;
    }
  }, [colorBy]);

  const handleClickOnGrouping = useCallback((grouping: string): void => {
    if (grouping !== colorGrouping || !isMeasurementColorBy(colorBy)) {
      dispatch(applyMeasurementsColorBy(grouping));
    } else if (grouping === colorGrouping && isMeasurementColorBy(colorBy)) {
      // Clicking on the same grouping twice will toggle back to the previous non-measurements coloring
      dispatch(changeColorBy(prevNonMeasurementColorBy.current));
    }
  }, [dispatch, colorGrouping, colorBy]);

  useEffect(() => {
    setPanelTitle(`${title || "Measurements"} (grouped by ${fields.get(groupBy).title})`);
  }, [setPanelTitle, title, fields, groupBy]);

  // Draw SVG from scratch
  useEffect(() => {
    // Reset the container to the top to prevent sticky x-axis from keeping
    // the scroll position on whitespace.
    svgContainerRef.current.scrollTop = 0;
    clearMeasurementsSVG(d3Ref.current, d3XAxisRef.current);
    drawMeasurementsSVG(d3Ref.current, d3XAxisRef.current, svgData, handleClickOnGrouping);
  }, [svgData, handleClickOnGrouping]);

  // Color the SVG & redraw color-by means when SVG is re-drawn or when colors have changed
  useEffect(() => {
    addColorByAttrToGroupingLabel(d3Ref.current, treeStrainColors);
    colorMeasurementsSVG(d3Ref.current, treeStrainColors);
    jitterRawMeansByColorBy(d3Ref.current, svgData, treeStrainColors, legendValues);
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

  useEffect(() => {
    if(isMeasurementColorBy(colorBy)) {
      addGroupingValueCrosshair(d3Ref.current, colorGrouping);
    } else {
      removeColorGroupingCrosshair(d3Ref.current);
    }
  }, [svgData, colorBy, colorGrouping])

  const getSVGContainerStyle = (): CSSProperties => {
    return {
      overflowY: "auto",
      position: "relative",
      height: height,
      width: width
    };
  };

  /**
   * Sticky x-axis with a set height to make sure the x-axis is always
   * at the bottom of the measurements panel
   */
  const getStickyXAxisSVGStyle = (): CSSProperties => {
    return {
      width: "100%",
      height: layout.xAxisHeight,
      position: "sticky",
      zIndex: 99
    };
  };

  /**
   * Position relative with bottom shifted up by the x-axis height to
   * allow x-axis to fit in the bottom of the panel when scrolling all the way
   * to the bottom of the measurements SVG
   */
  const getMainSVGStyle = (): CSSProperties => {
    return {
      width: "100%",
      position: "relative",
      bottom: `${getStickyXAxisSVGStyle().height}px`
    };
  };

  return (
    <>
      {showLegend &&
        <ErrorBoundary>
          <Legend right width={width}/>
        </ErrorBoundary>
      }
      <div id={svgContainerDOMId} ref={svgContainerRef} style={getSVGContainerStyle()}>
        {hoverData &&
          <HoverPanel
            hoverData={hoverData}
          />
        }
        {/* x-axis SVG must be above main measurements SVG for sticky positioning to work properly */}
        <svg
          id="d3MeasurementsXAxisSVG"
          ref={d3XAxisRef}
          style={getStickyXAxisSVGStyle()}
        />
        <svg
          id="d3MeasurementsSVG"
          ref={d3Ref}
          style={getMainSVGStyle()}
        />
      </div>
    </>
  );
};

const Measurements = ({height, width, showLegend}) => {
  const measurementsLoaded = useSelector((state: RootState) => state.measurements.loaded);
  const measurementsError = useSelector((state: RootState) => state.measurements.error);
  const showOnlyPanels = useSelector((state: RootState) => state.controls.showOnlyPanels);

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
    <Card infocard={showOnlyPanels} title={title} titleStyles={getCardTitleStyle()}>
      {measurementsLoaded ?
        <MeasurementsPlot
          height={height}
          width={width}
          showLegend={showLegend}
          setPanelTitle={setTitle}
        /> :
        <Flex style={{ height, width}} direction="column" justifyContent="center">
          <p style={{ textAlign: "center" }}>
            {measurementsError ||
              "Failed to fetch/load measurements due to unknown error"}
          </p>
        </Flex>
      }
    </Card>
  );
};

export default Measurements;
