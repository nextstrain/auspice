import React, { useRef, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { isEqual } from "lodash";
import { NODE_VISIBLE } from "../../util/globals";
import ErrorBoundary from "../../util/errorBoundry";
import Card from "../framework/card";
import Legend from "../tree/legend/legend";
import {
  createXScale,
  createYScale,
  groupMeasurements,
  clearMeasurementsSVG,
  drawMeasurementsSVG
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

/**
 * A custom React Redux Selector that reduces the tree redux state to an object
 * with the terminal strain names and their visibility.
 *
 * Depends on tree.visibility having the visibility values in an array that
 * has the same order as tree.nodes
 * @param {Object} tree
 * @returns {Object<string,number>}
 */
const treeStrainVisibilitySelector = (tree) => {
  return tree.nodes.reduce((treeStrainVisibility, node, index) => {
    // Only store visibility of terminal strain nodes
    if (!node.hasChildren) {
      treeStrainVisibility[node.name] = tree.visibility[index];
    }
    return treeStrainVisibility;
  }, {});
};

/**
 * Filters provided measurements to only measurements for strains that are
 * currently visible in the tree. Visibiity is indicated by the NODE_VISIBLE
 * value in the provided treeStrainVisibility object for strains.
 * @param {Array<Object>} measurements
 * @param {Object<string,number>} treeStrainVisibility
 * @returns {Array<Object>}
 */
const filterToTreeVisibileStrains = (measurements, treeStrainVisibility) => {
  // Check visibility against global NODE_VISIBLE
  const isVisible = (visibility) => visibility === NODE_VISIBLE;
  return measurements.filter((m) => isVisible(treeStrainVisibility[m.strain]));
};

const Measurements = ({height, width, showLegend}) => {
  // Use `lodash.isEqual` to deep compare object states to prevent unnecessary re-renderings of the component
  const treeStrainVisibility = useSelector((state) => treeStrainVisibilitySelector(state.tree), isEqual);
  const groupBy = useSelector((state) => state.controls.measurementsGroupBy);
  const collection = useSelector((state) => state.measurements.collectionToDisplay, isEqual);
  const { title, x_axis_label, threshold, fields, measurements } = collection;

  // Ref to access the D3 SVG
  const d3Ref = useRef(null);

  // Filter and group measurements
  const filteredMeasurements = filterToTreeVisibileStrains(measurements, treeStrainVisibility);
  const groupedMeasurements = groupMeasurements(filteredMeasurements, groupBy);

  // Memoize D3 scale functions to allow deep comparison to work below for svgData
  const xScale = useMemo(() => createXScale(width, measurements), [width, measurements]);
  const yScale = useMemo(() => createYScale(measurements), [measurements]);
  // Memoize all data needed for basic SVG to avoid extra re-drawings
  const svgData = useDeepCompareMemo({ xScale, yScale, x_axis_label, threshold, groupedMeasurements});

  // Draw SVG from scratch
  useEffect(() => {
    clearMeasurementsSVG(d3Ref.current);
    drawMeasurementsSVG(d3Ref.current, svgData);
  }, [svgData]);

  const getPanelTitle = () => {
    return `${title || "Measurements"} (grouped by ${fields.get(groupBy).title})`;
  };

  const getSVGContainerStyle = () => {
    return {
      overflowY: "auto",
      position: "relative",
      height: height,
      width: width
    };
  };

  return (
    <Card title={getPanelTitle()}>
      {showLegend &&
        <ErrorBoundary>
          <Legend right width={width}/>
        </ErrorBoundary>
      }
      <div id="measurementsSVGContainer" style={getSVGContainerStyle()}>
        <svg
          id="d3MeasurementsSVG"
          width="100%"
          ref={d3Ref}
        />
      </div>
    </Card>
  );
};

export default Measurements;
