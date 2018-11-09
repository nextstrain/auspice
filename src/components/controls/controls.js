import React from "react";
import { Header, SelectLabel } from "../framework/select-label";
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

const Controls = ({mapOn}) => (
  <ControlsContainer>
    <SidebarHeader>Dataset</SidebarHeader>
    <ChooseDataset/>

    <DateRangeInputs/>


    <SidebarHeader>Color By</SidebarHeader>
    <ColorBy/>


    <SidebarHeader>Tree Options</SidebarHeader>
    <ChooseLayout/>
    <ChooseMetric/>
    <ChooseBranchLabelling/>
    <SearchStrains/>
    <ChooseSecondTree/>
    <ToggleTangle/>

    { mapOn ? (
      <span style={{marginTop: "15px"}}>
        <Header text="Map Options"/>
        <SelectLabel text="Geographic resolution" extraStyles={{marginTop: "5px"}}/>
        <GeoResolution/>
        <MapAnimationControls/>
      </span>
    ) : null}

    <span style={{paddingTop: "10px"}}/>
    <SidebarHeader>Panel Options</SidebarHeader>
    <PanelLayout/>
    <PanelToggles/>
  </ControlsContainer>
);

export default Controls;
