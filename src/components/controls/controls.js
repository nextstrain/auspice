import React from "react";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
import ToggleBranchLabels from "./toggle-branch-labels";
import ColorBy from "./color-by";
import Search from "./search";
import DateRangeInputs from "./date-range-inputs";
import ChooseLayout from "./choose-layout";
import ChooseVirus from "./choose-virus";
import ChooseMetric from "./choose-metric";
import GeoResolution from "./geoResolution";
import AllFilters from "./all-filter";
import * as globals from "../../util/globals";
import { titleStyles } from "../../globalStyles";

const header = (text) => (
  <span style={titleStyles.small}>
    {text}
  </span>
);

class Controls extends React.Component {
  getStyles() {
    return {};
  }
  render() {
    const styles = this.getStyles();
    return (
      <Flex
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{
          width: globals.controlsWidth,
          padding: "0px 20px 20px 20px"
        }}
      >

        {header("Dataset")}
        <ChooseVirus/>

        {header("Date Range")}
        <DateRangeInputs/>

        {header("Color By")}
        <ColorBy/>

        {header("Tree Options")}

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>

        {header("Filters")}
        <AllFilters/>
        <ToggleBranchLabels/>
        <Search/>

        {header("Map Options")}
        <GeoResolution/>

      </Flex>
    );
  }
}

export default Controls;
