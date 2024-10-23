import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from 'react-i18next';

import ColorBy, {ColorByInfo} from "./color-by";
import DateRangeInputs, {DateRangeInfo} from "./date-range-inputs";
import AnimationControls from "./animation-controls";
import ChooseExplodeAttr from "./choose-explode-attr";
import ChooseBranchLabelling from "./choose-branch-labelling";
import ChooseLayout from "./choose-layout";
import ChooseDataset from "./choose-dataset";
import ChooseSecondTree from "./choose-second-tree";
import ChooseTipLabel from "./choose-tip-label";
import ChooseMetric from "./choose-metric";
import PanelLayout from "./panel-layout";
import GeoResolution from "./geo-resolution";
import TransmissionLines from './transmission-lines';
import NormalizeFrequencies from "./frequency-normalization";
import AnimationOptions from "./animation-options";
import { PanelSection } from "./panelSection";
import ToggleFocus from "./toggle-focus";
import ToggleTangle from "./toggle-tangle";
import Language from "./language";
import { ControlsContainer } from "./styles";
import FilterData, {FilterInfo} from "./filter";
import {TreeInfo, MapInfo, AnimationOptionsInfo, PanelLayoutInfo,
  ExplodeTreeInfo, EntropyInfo, FrequencyInfo, MeasurementsInfo,
  ToggleFocusInfo} from "./miscInfoText";
import { ControlHeader } from "./controlHeader";
import MeasurementsOptions from "./measurementsOptions";
import { RootState } from "../../store";

function Controls() {
  const { t } = useTranslation();

  const panelsAvailable = useSelector((state: RootState) => state.controls.panelsAvailable);
  const panelsToDisplay = useSelector((state: RootState) => state.controls.panelsToDisplay);
  const showTreeToo = useSelector((state: RootState) => state.controls.showTreeToo);
  const canTogglePanelLayout = useSelector((state: RootState) => state.controls.canTogglePanelLayout);
  const branchLengthsToDisplay = useSelector((state: RootState) => state.controls.branchLengthsToDisplay);

  return (
    <ControlsContainer>
      <ChooseDataset />

      {branchLengthsToDisplay !== 'divOnly' &&
        <>
          <ControlHeader title={t("sidebar:Date Range")} tooltip={DateRangeInfo}/>
          <DateRangeInputs />
          <AnimationControls />
        </>
      }

      <ControlHeader title={t("sidebar:Color By")} tooltip={ColorByInfo}/>
      <ColorBy />

      <ControlHeader title={t("sidebar:Filter Data")} tooltip={FilterInfo}/>
      <FilterData measurementsOn={panelsToDisplay.includes("measurements")} />

      <span style={{ paddingTop: "10px" }} />

      {panelsAvailable.includes("tree") &&
        <PanelSection
          panel="tree"
          title={t("sidebar:Tree")}
          tooltip={TreeInfo}
          options={<>
            <ChooseLayout />
            <ChooseMetric />
            <ToggleFocus tooltip={ToggleFocusInfo} />
            <ChooseBranchLabelling />
            <ChooseTipLabel />
            <ChooseSecondTree />
            <ChooseExplodeAttr tooltip={ExplodeTreeInfo} />
            <ToggleTangle />
          </>}
        />
      }

      {panelsAvailable.includes("measurements") &&
        <PanelSection
          panel="measurements"
          title={t("sidebar:Measurements")}
          tooltip={MeasurementsInfo}
          options={<MeasurementsOptions />}
        />
      }

      {/* Prevent the map from being toggled on when a second tree is visible.
          It is hidden by logic elsewhere.
      */}
      {panelsAvailable.includes("map") && !showTreeToo &&
        <PanelSection
          panel="map"
          title={t("sidebar:Map")}
          tooltip={MapInfo}
          options={<>
            <GeoResolution />
            <TransmissionLines />
          </>}
        />
      }

      {panelsAvailable.includes("entropy") &&
        <PanelSection
          panel="entropy"
          title={t("sidebar:Entropy")}
          tooltip={EntropyInfo}
        />
      }

      {panelsAvailable.includes("frequencies") &&
        <PanelSection
          panel="frequencies"
          title={t("sidebar:Frequency")}
          tooltip={FrequencyInfo}
          options={<NormalizeFrequencies />}
        />
      }

      {branchLengthsToDisplay !== "divOnly" &&
        <span style={{ marginTop: "10px" }}>
          <ControlHeader title={t("sidebar:Animation Options")} tooltip={AnimationOptionsInfo}/>
          <AnimationOptions />
        </span>
      }

      {canTogglePanelLayout &&
        <>
          <span style={{ paddingTop: "10px" }} />
          <ControlHeader title={t("sidebar:Display")} tooltip={PanelLayoutInfo} />
          <PanelLayout />
        </>
      }

      <span style={{ paddingTop: "10px" }} />
      <ControlHeader title={t("sidebar:Language")}/>
      <Language />
    </ControlsContainer>
  );
}

export default Controls;
