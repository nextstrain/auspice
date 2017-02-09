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
    return {
      heading: {
        fontSize: 18,
        letterSpacing: .4,
        color: "rgb(150,150,150)"
      }
    };
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

        <HeaderFont style={styles.heading}>{"Dataset"}</HeaderFont>
        <ChooseVirus/>

        <HeaderFont style={styles.heading}>{"Date Range"}</HeaderFont>
        <DateRangeInputs/>

        <HeaderFont style={styles.heading}>{"Tree Options"}</HeaderFont>

        <SelectLabel text="Layout"/>
        <ChooseLayout/>

        <SelectLabel text="X axis"/>
        <ChooseMetric/>

        <HeaderFont style={styles.heading}>{"Filters"}</HeaderFont>
        <ColorBy/>
        <AllFilters/>
        <ToggleBranchLabels/>
        <Search/>

        <HeaderFont style={styles.heading}>{"Map Options"}</HeaderFont>

      </Flex>
    );
  }
}

export default Controls;
