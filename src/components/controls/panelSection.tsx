import React from "react";
import { useSelector } from "react-redux";
import { PanelOptionsContainer, PanelSectionContainer } from "./styles";
import { Title, Tooltip } from "./annotatedTitle";
import { PanelHeader, PanelId } from "./panelHeader";
import { RootState } from "../../store";

type Props = {
  panel: PanelId
  title: Title
  tooltip?: Tooltip

  /** Element that contains panel-specific options. */
  options?: JSX.Element
}

/**
 * A controls section for panel-specific customization.
 */
export const PanelSection = ({ panel, title, tooltip, options=undefined }: Props): JSX.Element => {

  const panelsToDisplay = useSelector((state: RootState) => state.controls.panelsToDisplay);

  const panelIsVisible = panelsToDisplay.includes(panel)

  // Initially, panel visibility determines options visibility.
  const [optionsAreVisible, setOptionsAreVisible] = React.useState(panelIsVisible);

  // Subsequent panel visibility updates also determines options visibility.
  React.useEffect(() => {
    setOptionsAreVisible(panelIsVisible)
  }, [panelIsVisible])

  const [contentHeight, setContentHeight] = React.useState(1000);
  const optionsContainer = React.useRef<HTMLDivElement>(null);

  // FIXME: useLayoutEffect?
  React.useEffect(() => {
    if (optionsContainer.current) {
      setContentHeight(optionsContainer.current.scrollHeight); // FIXME: offsetHeight?
    }
  }, [options]);

  return (
    <PanelSectionContainer>
      <PanelHeader
        panel={panel}
        title={title}
        tooltip={tooltip}
        panelIsVisible={panelIsVisible}
        hasOptions={options!==undefined}
        optionsAreVisible={optionsAreVisible}
        setOptionsAreVisible={setOptionsAreVisible}
      />
      <PanelOptionsContainer ref={optionsContainer} className={`${optionsAreVisible ? "open" : ""}`} contentHeight={contentHeight}>
        {options}
      </PanelOptionsContainer>
    </PanelSectionContainer>
  );
};
