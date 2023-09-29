import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import {StyledTooltip, HeaderIconContainer, HeaderContainer} from "./styles";

type Props = {
  title: string
  tooltip: JSX.Element
  mobile: boolean
}

export const AnnotatedHeader = ({title, tooltip, mobile}: Props) => {
  return (
    <HeaderContainer>
      <span>{title}</span>
      {tooltip && !mobile && (
        <>
          <HeaderIconContainer data-tip data-for={title}>
            <FaInfoCircle/>
          </HeaderIconContainer>
          <StyledTooltip place="bottom" type="dark" effect="solid" id={title}>
            {tooltip}
          </StyledTooltip>
        </>
      )}
    </HeaderContainer>
  );
};

