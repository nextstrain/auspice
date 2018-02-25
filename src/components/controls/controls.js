import React from "react";
import { connect } from "react-redux";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
import ColorBy from "./color-by";
import DateRangeInputs from "./date-range-inputs";
import ChooseBranchLabelling from "./choose-branch-labelling";
import ChooseLayout from "./choose-layout";
import ChooseDataset from "./choose-dataset";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import MapAnimationControls from "./map-animation";
import { titleStyles } from "../../globalStyles";
import DataSource from "./data-source";
import PanelToggles from "./panel-toggles";
import SearchStrains from "./search";

const header = (text) => (
  <span style={titleStyles.small}>
    {text}
  </span>
);

@connect((state) => ({
  canTogglePanelLayout: state.controls.canTogglePanelLayout,
  panels: state.metadata.panels
}))
class Controls extends React.Component {
  getStyles() {
    return {};
  }
  render() {
    const mapAndTree = this.props.panels !== undefined && this.props.panels.indexOf("map") !== -1 && this.props.panels.indexOf("tree") !== -1;

    return (
      <Flex
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{
          height: "100%",
          overflowY: "scroll",
          padding: "0px 20px 20px 20px"
        }}
      >

        {header("Dataset")}
        <ChooseDataset/>

        {header("Date Range")}
        <DateRangeInputs/>

        {header("Color By")}
        <ColorBy/>

        {header("Tree Options")}

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>

        <SelectLabel text="Branch Labels"/>
        <ChooseBranchLabelling/>

        <SelectLabel text="Search Strains"/>
        <SearchStrains/>

        {header("Map Options")}
        <SelectLabel text="Geographic resolution"/>
        <GeoResolution/>
        <MapAnimationControls/>

        <div/>
        {header("Panels To Display")}
        <PanelToggles/>
        {mapAndTree && this.props.canTogglePanelLayout ? (<PanelLayout/>) : null}

        <div/>
        {header("Data Source")}
        <DataSource/>

      </Flex>
    );
  }
}

export default Controls;
