import React from "react";
import { connect } from "react-redux";
import ColorBy from "./color-by";
import DateRangeInputs from "./date-range-inputs";
import ChooseBranchLabelling from "./choose-branch-labelling";
import ChooseLayout from "./choose-layout";
import ChooseDataset from "./choose-dataset";
import ChooseSecondTree from "./choose-second-tree";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import MapAnimationControls from "./map-animation";
import PanelToggles from "./panel-toggles";
import SearchStrains from "./search";
import ToggleTangle from "./toggle-tangle";
import { SidebarHeader, ControlsContainer } from "./styles";


const Controls = ({ mapIsDisplayed, colorByAvailable, isATimeTree, moreThanOnePanelAvailable }) => (
  <ControlsContainer>

    {/*      CHOOSE    DATASET    OPTIONS          */}
    <SidebarHeader>Dataset</SidebarHeader>
    <ChooseDataset/>


    {/*             TIME       OPTIONS          */}
    { isATimeTree ? (
      <>
        <SidebarHeader>Date Range</SidebarHeader>
        <DateRangeInputs/>
      </>
    ) : null}


    {/*           COLOR       OPTIONS          */}
    { colorByAvailable ? (
      <>
        <SidebarHeader>Color By</SidebarHeader>
        <ColorBy/>
      </>
    ) : null}


    {/*             TREE       OPTIONS          */}
    <SidebarHeader>Tree Options</SidebarHeader>
    <ChooseLayout/>
    <ChooseMetric/>
    <ChooseBranchLabelling/>
    <SearchStrains/>
    <ChooseSecondTree/>
    <ToggleTangle/>


    {/*             MAP        OPTIONS          */}
    { mapIsDisplayed ? (
      <span style={{marginTop: "15px"}}>
        <SidebarHeader>Map Options</SidebarHeader>
        <GeoResolution/>
        <MapAnimationControls/>
      </span>
    ) : null}


    {/*     PANEL       DISPLAY       OPTIONS       */}
    { moreThanOnePanelAvailable ? (
      <>
        <span style={{paddingTop: "10px"}}/>
        <SidebarHeader>Panel Options</SidebarHeader>
        <PanelLayout/>
        <PanelToggles/>
      </>
    ) : null}

  </ControlsContainer>
);

const mapStateToProps = (state) => ({
  mapIsDisplayed: state.controls.panelsToDisplay.includes("map"),
  colorByAvailable: state.controls.colorBy !== "none",
  isATimeTree: state.controls.branchLengthsToDisplay !== "divOnly",
  moreThanOnePanelAvailable: state.controls.panelsToDisplay.length > 1
});

export default connect(mapStateToProps)(Controls);
