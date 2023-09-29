import React from "react";
import { useAppDispatch } from "../../hooks";
import { togglePanelDisplay } from "../../actions/panelDisplay";
import { HeaderContainer } from "./styles";
import Toggle from "./toggle";
import { AnnotatedTitle, Title, Tooltip } from "./annotatedTitle";

/** Panel identifier used internally. */
export type PanelId = string;

type Props = {
  panel: PanelId
  title: Title
  tooltip?: Tooltip

  /** Indicates panel visibility. */
  panelIsVisible: boolean
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
    <HeaderContainer>
      <AnnotatedTitle
        title={title}
        tooltip={tooltip} />
      <Toggle
        display={true}
        on={panelIsVisible}
        callback={togglePanelVisibility}
        label="" />
    </HeaderContainer>
  );
};
