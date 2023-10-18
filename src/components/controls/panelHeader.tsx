import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useAppDispatch } from "../../hooks";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { HeaderContainer } from "./styles";
import { PanelToggle, On } from "./panelToggle";
import { AnnotatedTitle, Title, Tooltip } from "./annotatedTitle";
import { PanelChevron } from "./panelChevron";

/** Panel identifier used internally. */
export type PanelId = string;

type Props = {
  panel: PanelId
  title: Title
  tooltip?: Tooltip
  panelIsVisible: On

  /** Indicates whether there are options for the panel. */
  hasOptions: boolean

  /** Indicates options visibility. */
  optionsAreVisible: boolean

  /** Update options visibility. */
  setOptionsAreVisible: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * A header used by all panel controls, containing an interactive title.
 */
export const PanelHeader = ({ panel, title, tooltip, panelIsVisible, hasOptions, optionsAreVisible, setOptionsAreVisible }: Props) => {
  const dispatch = useAppDispatch();

  const mobile = useSelector((state: RootState) => state.general.mobileDisplay);

  function togglePanelVisibility() {
    dispatch(togglePanelDisplay(panel))
  }

  function toggleOptionsVisibility() {
    setOptionsAreVisible(!optionsAreVisible);
  }

  return (
    // Clicking anywhere in the element, even whitespace, will toggle panel visibility.
    <HeaderContainer onClick={togglePanelVisibility}>
      <span>
        {hasOptions && !mobile &&
          <PanelChevron
            show={optionsAreVisible}
            onClick={toggleOptionsVisibility} />}
        <AnnotatedTitle
          title={title}
          tooltip={tooltip} />
      </span>
      <PanelToggle
        on={panelIsVisible}
        callback={(togglePanelVisibility)} />
    </HeaderContainer>
  );
};
