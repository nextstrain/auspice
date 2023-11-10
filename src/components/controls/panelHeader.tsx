import React from "react";
import { useAppDispatch } from "../../hooks";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { HeaderContainer } from "./styles";
import { PanelToggle, On } from "./panelToggle";
import { AnnotatedTitle, Title, Tooltip } from "./annotatedTitle";

/** Panel identifier used internally. */
export type PanelId = string;

type Props = {
  panel: PanelId
  title: Title
  tooltip?: Tooltip
  panelIsVisible: On
}

/**
 * A header used by all panel controls, containing an interactive title.
 */
export const PanelHeader = ({ panel, title, tooltip, panelIsVisible }: Props) => {
  const dispatch = useAppDispatch();

  function togglePanelVisibility() {
    dispatch(togglePanelDisplay(panel))
  }

  return (
    // Clicking anywhere in the element, even whitespace, will toggle panel visibility.
    <HeaderContainer onClick={togglePanelVisibility}>
      <AnnotatedTitle
        title={title}
        tooltip={tooltip} />
      <PanelToggle
        on={panelIsVisible}
        callback={(togglePanelVisibility)} />
    </HeaderContainer>
  );
};
