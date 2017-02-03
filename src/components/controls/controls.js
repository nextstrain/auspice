import React from "react";
import Flex from "../framework/flex";
import { connect } from "react-redux";
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

const returnStateNeeded = (fullStateTree) => {
  return {
    controls: fullStateTree.controls,
    metadata: fullStateTree.metadata
  };
};

@connect(returnStateNeeded)
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
        }}>

        <HeaderFont bold dark>{"Dataset"}</HeaderFont>
        <ChooseVirus {...this.props}/>

        <HeaderFont bold dark>{"Date Range"}</HeaderFont>
        <DateRangeInputs {...this.props}/>

        <HeaderFont bold dark>{"Color By"}</HeaderFont>
        <ColorBy {...this.props}/>

        <HeaderFont bold dark>{"Tree Options"}</HeaderFont>
        <SelectLabel text="Layout"/>
        <ChooseLayout {...this.props}/>
        <SelectLabel text="Branch Length"/>
        <ChooseMetric {...this.props}/>

        <HeaderFont bold dark>{"Filters"}</HeaderFont>
        <AllFilters {...this.props} />
        <ToggleBranchLabels/>
        <Search/>


        <HeaderFont style={styles.heading}>{"Map Options"}</HeaderFont>

      </Flex>
    );
  }
}

export default Controls;

// <Button> Reset Filters </Button>

// <div className="d3-tip se"/>
// <div className="d3-tip e"/>
// <div className="d3-tip"/>
// <div id="date-input"></div>
// <div id="legend-title"></div>
// <div id="legend"></div>
// <div id="gt-color"></div>
// <div id="branchlabels"></div>
// <div id="region"></div>
// <div id="search"></div>
// <div id="straininput"></div>
// <div id="bp-ac"></div>
// <div id="bp-input"></div>
// <div id="searchinputclear"></div>
// <div id="reset"></div>
// <div className="freqplot-container"></div>
// <div className="treeplot-container" id="treeplot-container"></div>
// <div id="updated"></div>
// <div id="commit"></div>
