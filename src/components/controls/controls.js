import React from "react";
import { Header, SelectLabel } from "../framework/select-label";
import ColorBy from "./color-by";
import DateRangeInputs from "./date-range-inputs";
import ChooseBranchLabelling from "./choose-branch-labelling";
import ChooseLayout from "./choose-layout";
import ChooseDataset from "./choose-dataset";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import MapAnimationControls from "./map-animation";
import DataSource from "./data-source";
import PanelToggles from "./panel-toggles";
import SearchStrains from "./search";

const Controls = ({mapOn}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignContent: "stretch",
      flexWrap: "nowrap",
      height: "100%",
      order: 0,
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: "auto",
      overflowY: "scroll",
      alignSelf: "auto",
      padding: "0px 20px 20px 20px"
    }}
  >

    <Header text="Dataset"/>
    <ChooseDataset/>


    <Header text="Date Range"/>
    <DateRangeInputs/>


    <Header text="Color By"/>
    <ColorBy/>


    <Header text="Tree Options"/>
    <ChooseLayout/>
    <ChooseMetric/>
    <ChooseBranchLabelling/>
    <SearchStrains/>

    { mapOn ? (
      <span>
        <Header text="Map Options"/>
        <SelectLabel text="Geographic resolution" extraStyles={{marginTop: "0px"}}/>
        <GeoResolution/>
        <MapAnimationControls/>
      </span>
    ) : null}

    <Header text="Panel Options" extraStyles={{paddingTop: "10px"}}/>
    <PanelLayout/>
    <PanelToggles/>


    <Header text="Data Source" extraStyles={{paddingTop: "10px"}}/>
    <DataSource/>

  </div>
);

export default Controls;
