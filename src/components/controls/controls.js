import React from "react";
import Flex from "../framework/flex";
import SelectLabel from "../framework/select-label";
import HeaderFont from "../framework/header-font";
import ToggleBranchLabels from "./toggle-branch-labels";
import ColorBy from "./color-by";
import Search from "./search";
import DateRangeInputs from "./date-range-inputs";
import ChooseLayout from "./choose-layout";
import ChooseVirus from "./choose-virus";
import ChooseMetric from "./choose-metric";
import AllFilters from "./all-filter";
import * as globals from "../../util/globals";

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

        <HeaderFont>{"Dataset"}</HeaderFont>
        <ChooseVirus/>

        <HeaderFont>{"Date Range"}</HeaderFont>
        <DateRangeInputs/>

        <HeaderFont>{"Color by"}</HeaderFont>
        <ColorBy/>

        <HeaderFont>{"Tree Options"}</HeaderFont>

        <SelectLabel text="Layout"/>
        <ChooseLayout/>
  
        <SelectLabel text="Branch Length"/>
        <ChooseMetric/>

        <HeaderFont>{"Filters"}</HeaderFont>
        <AllFilters/>
        <ToggleBranchLabels/>
        <Search/>

        <HeaderFont style={styles.heading}>{"Map Options"}</HeaderFont>

      </Flex>
    );
  }
}

export default Controls;
