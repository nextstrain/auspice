import React from "react";
import { useAppDispatch } from "../../hooks";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { HeaderContainer } from "./styles";
import Toggle from "./toggle";
import { AnnotatedTitle, Title, Tooltip } from "./annotatedTitle";
import { PanelChevron } from "./panelChevron";

/** Panel identifier used internally. */
export type PanelId = string;

type Props = {
  panel: PanelId
  title: Title
  tooltip?: Tooltip

  /** Indicates panel visibility. */
  panelIsVisible: boolean

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

  function togglePanelVisibility() {
    dispatch(togglePanelDisplay(panel))
  }

  function toggleOptionsVisibility() {
    setOptionsAreVisible(!optionsAreVisible);
  }

  return (
    <HeaderContainer {...(hasOptions ? {
                            onClick: toggleOptionsVisibility,
                            style: {cursor: "pointer"}
                          } :
                          {} )}>
      <span>
        {hasOptions &&
          <PanelChevron
            show={optionsAreVisible} />}
        <AnnotatedTitle
          title={title}
          tooltip={tooltip} />
      </span>
      <span
        // Don't allow the parent click handler to do anything here.
        onClick={(event) => event.stopPropagation()}>
        <Toggle
          display={true}
          on={panelIsVisible}
          callback={togglePanelVisibility}
          label="" />
      </span>
    </HeaderContainer>
  );
};
