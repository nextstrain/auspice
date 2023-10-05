import React from "react";
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
import Toggle from "./toggle";
import PanelToggle from "./panel-toggle";
import ToggleTangle from "./toggle-tangle";
import Language from "./language";
import { ControlsContainer } from "./styles";
import FilterData, {FilterInfo} from "./filter";
import {TreeInfo, MapInfo, AnimationOptionsInfo, PanelLayoutInfo,
  ExplodeTreeInfo, FrequencyInfo, MeasurementsInfo} from "./miscInfoText";
import { AnnotatedHeader } from "./annotatedHeader";
import MeasurementsOptions from "./measurementsOptions";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type Props = {
  treeOn: boolean
  mapOn: boolean
  frequenciesOn: boolean
  measurementsOn: boolean
  mobileDisplay: boolean
}

function Controls({ treeOn, mapOn, frequenciesOn, measurementsOn, mobileDisplay }: Props) {
  const { t } = useTranslation();

  const [showAnimationOptions, setShowAnimationOptions] = React.useState(false);

  const panelsAvailable = useSelector((state: RootState) => state.controls.panelsAvailable);
  const showTreeToo = useSelector((state: RootState) => state.controls.showTreeToo);
  const canTogglePanelLayout = useSelector((state: RootState) => state.controls.canTogglePanelLayout);

  return (
    <ControlsContainer>
      <ChooseDataset />

      <AnnotatedHeader title={t("sidebar:Date Range")} tooltip={DateRangeInfo} mobile={mobileDisplay}/>
      <DateRangeInputs />

      {/* FIXME: update translations */}
      {/* FIXME: combine this custom Toggle and PanelToggle? */}
      <AnnotatedHeader
        toggle={<Toggle
          display={true}
          on={showAnimationOptions}
          callback={() => setShowAnimationOptions(!showAnimationOptions)}
          label={""}
          style={{ display: "inline" }}
        />}
        title={t("sidebar:Animate")}
        tooltip={AnimationOptionsInfo}
        mobile={mobileDisplay}
      />
      {showAnimationOptions &&
        <>
          {/* FIXME: combine the two components below? */}
          <AnimationOptions />
          <AnimationControls />
        </>
      }

      <AnnotatedHeader title={t("sidebar:Color By")} tooltip={ColorByInfo} mobile={mobileDisplay}/>
      <ColorBy />

      <AnnotatedHeader title={t("sidebar:Filter Data")} tooltip={FilterInfo} mobile={mobileDisplay}/>
      <FilterData measurementsOn={measurementsOn} />

      {canTogglePanelLayout &&
        <>
          <span style={{ paddingTop: "10px" }} />
          {/* FIXME: update translations */}
          <AnnotatedHeader title={t("sidebar:Layout")} tooltip={PanelLayoutInfo} mobile={mobileDisplay} />
          <PanelLayout />
        </>
      }

      {panelsAvailable.includes("tree") &&
        <AnnotatedHeader
          toggle={<PanelToggle panel="tree" on={treeOn} />}
          title={t("sidebar:Tree")}
          tooltip={TreeInfo}
          mobile={mobileDisplay}
        />
      }
      {treeOn &&
        <span>
          <ChooseLayout />
          <ChooseMetric />
          <ChooseBranchLabelling />
          <ChooseTipLabel />
          <ChooseSecondTree />
          <ChooseExplodeAttr tooltip={ExplodeTreeInfo} mobile={mobileDisplay} />
          <ToggleTangle />
        </span>
      }

      {panelsAvailable.includes("measurements") &&
        <AnnotatedHeader
          toggle={<PanelToggle panel="measurements" on={measurementsOn} />}
          title={t("sidebar:Measurements")}
          tooltip={MeasurementsInfo}
          mobile={mobileDisplay}
        />
      }
      {measurementsOn &&
        <span style={{ marginTop: "10px" }}>
          <MeasurementsOptions />
        </span>
      }

      {/* Prevent the map from being toggled on when a second tree is visible.
          It is hidden by logic elsewhere.
      */}
      {panelsAvailable.includes("map") && !showTreeToo &&
        <AnnotatedHeader
          toggle={<PanelToggle panel="map" on={mapOn} />}
          title={t("sidebar:Map")}
          tooltip={MapInfo}
          mobile={mobileDisplay}
        />
      }
      {mapOn &&
        <span style={{ marginTop: "10px" }}>
          <GeoResolution />
          <TransmissionLines />
        </span>
      }

      {panelsAvailable.includes("frequencies") &&
        <AnnotatedHeader
          toggle={<PanelToggle panel="frequencies" on={frequenciesOn} />}
          title={t("sidebar:Frequency")}
          tooltip={FrequencyInfo}
          mobile={mobileDisplay}
        />
      }
      {frequenciesOn &&
        <span style={{ marginTop: "10px" }}>
          <NormalizeFrequencies />
        </span>
      }

      <Language />
    </ControlsContainer>
  );
}

export default Controls;
