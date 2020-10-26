import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import {StyledTooltip, HeaderIconContainer, HeaderContainer} from "./styles";

export const AnnotatedHeader = ({title, tooltip, mobile}) => {
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

