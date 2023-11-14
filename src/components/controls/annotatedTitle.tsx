import React from "react";
import { useSelector } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import {TitleAndIconContainer, StyledTooltip, HeaderIconContainer, HeaderTitle} from "./styles";
import { RootState } from "../../store";

/** Title to display for the control. */
export type Title = string;

/** Informational tooltip element to display on hover. */
export type Tooltip = JSX.Element;

type Props = {
  title: Title
  tooltip?: Tooltip
}

/**
 * A title and tooltip to be shown in a control header.
 * The tooltip is not shown on mobile.
 */
export const AnnotatedTitle = ({title, tooltip=undefined}: Props) => {
  const mobile = useSelector((state: RootState) => state.general.mobileDisplay);

  return (
    <TitleAndIconContainer>
      <HeaderTitle>{title}</HeaderTitle>
      {tooltip && !mobile && (
        <>
          <HeaderIconContainer data-tip data-for={title}
            // Don't allow any parent onClick callbacks to run.
            onClick={(event) => event.stopPropagation()}>
            <FaInfoCircle/>
          </HeaderIconContainer>
          <StyledTooltip place="bottom" type="dark" effect="solid" id={title}>
            {tooltip}
          </StyledTooltip>
        </>
      )}
    </TitleAndIconContainer>
  );
};
