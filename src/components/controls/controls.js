import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
import ColorBy from "./color-by";
import DateRangeInputs from "./date-range-inputs";
import AnalysisDateSlider from "./analysis-date-slider";
import ChooseLayout from "./choose-layout";
import ChooseVirus from "./choose-virus";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import MapAnimationControls from "./map-animation";
import AllFilters from "./all-filter";
import { controlsWidth, enableAnimationDisplay } from "../../util/globals";
import { titleStyles } from "../../globalStyles";

const header = (text) => (
  <span style={titleStyles.small}>
    {text}
  </span>
);

@connect((state) => ({
  analysisSlider: state.controls.analysisSlider
}))
class Controls extends React.Component {
  static propTypes = {
    analysisSlider: PropTypes.any,
    dispatch: PropTypes.func
  }
  getStyles() {
    return {};
  }
  analysisSlider() {
    if (this.props.analysisSlider && this.props.analysisSlider.valid) {
      return (
        <g>
          <br/>
          {header("Analysis Date")}
          <AnalysisDateSlider/>
        </g>
      );
    }
    return null;
  }
  // restore <ToggleBranchLabels/> below when perf is improved
  render() {
    // const styles = this.getStyles();
    return (
      <Flex
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{
          width: controlsWidth,
          padding: "0px 20px 20px 20px"
        }}
      >

        {header("Dataset")}
        <ChooseVirus/>

        {header("Date Range")}
        <DateRangeInputs/>

        {this.analysisSlider()}

        {header("Color By")}
        <ColorBy/>

        {header("Tree Options")}

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>

        {header("Map Options")}
        <SelectLabel text="Geographic resolution"/>
        <GeoResolution/>
        {enableAnimationDisplay ? <MapAnimationControls/> : null}

        {header("Layout Options")}
        <SelectLabel text="Panel layout"/>
        <PanelLayout/>

        {header("Filters")}
        <AllFilters/>

      </Flex>
    );
  }
}

export default Controls;
