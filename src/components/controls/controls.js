import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
import ColorBy from "./color-by";
import DateRangeInputs from "./date-range-inputs";
import AnalysisDateSlider from "./analysis-date-slider";
import ChooseLayout from "./choose-layout";
import ChooseDataset from "./choose-dataset";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import MapAnimationControls from "./map-animation";
import { controlsWidth, enableAnimationDisplay } from "../../util/globals";
import { titleStyles } from "../../globalStyles";
import DataSource from "./data-source";
import Narrative from "../narrative";
import Toggle from "./toggle";

const header = (text) => (
  <span style={titleStyles.small}>
    {text}
  </span>
);

@connect((state) => ({
  analysisSlider: state.controls.analysisSlider,
  panels: state.metadata.panels
}))
class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = {narrativeOpen: true};
  }
  static propTypes = {
    analysisSlider: PropTypes.any
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
  narrativeToggle() {
    return (
      <Toggle
        display
        on={this.state.narrativeOpen}
        callback={() => this.setState({narrativeOpen: !this.state.narrativeOpen})}
        label="Show Narrative"
      />
    );
  }
  // restore <ToggleBranchLabels/> below when perf is improved
  render() {
    const mapAndTree = this.props.panels !== undefined && this.props.panels.indexOf("map") !== -1 && this.props.panels.indexOf("tree") !== -1;

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
        {/* following two lines temporary solution */}
        {this.narrativeToggle()}
        {this.state.narrativeOpen ? <Narrative/> : null}


        {header("Dataset")}
        <ChooseDataset/>

        {header("Date Range")}
        <DateRangeInputs/>

        {this.analysisSlider()}

        {header("Color By")}
        <ColorBy/>

        {mapAndTree ? (header("Panel Layout")) : null}
        {mapAndTree ? (<PanelLayout/>) : null}

        {header("Tree Options")}

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>

        {header("Map Options")}
        <SelectLabel text="Geographic resolution"/>
        <GeoResolution/>
        {enableAnimationDisplay ? <MapAnimationControls/> : null}

        <div/>
        {header("Data Source")}
        <DataSource/>

      </Flex>
    );
  }
}

export default Controls;
