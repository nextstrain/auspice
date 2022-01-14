import React from "react";
import ErrorBoundary from "../../util/errorBoundry";
import Card from "../framework/card";
import Legend from "../tree/legend/legend";

const Measurements = ({height, width, showLegend}) => {

  const getSVGContainerStyle = () => {
    return {
      overflowY: "auto",
      position: "relative",
      height: height,
      width: width
    };
  };

  return (
    <Card title="Measurements">
      {showLegend &&
        <ErrorBoundary>
          <Legend right width={width}/>
        </ErrorBoundary>
      }
      <div id="measurementsSVGContainer" style={getSVGContainerStyle()}>
        <svg
          id="d3MeasurementsSVG"
          width="100%"
        />
      </div>
    </Card>
  );
};

export default Measurements;
