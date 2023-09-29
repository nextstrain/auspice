import React from "react";
import { HeaderContainer } from "./styles";
import { AnnotatedTitle, Title, Tooltip } from "./annotatedTitle";

type Props = {
  title: Title
  tooltip?: Tooltip
}

/**
 * A header used by all non-panel controls, containing an informative title.
 */
export const ControlHeader = ({title, tooltip=undefined }: Props) => {
  return (
    <HeaderContainer>
      <AnnotatedTitle
        title={title}
        tooltip={tooltip} />
    </HeaderContainer>
  );
};
