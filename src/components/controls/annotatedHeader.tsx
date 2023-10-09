import React from "react";
import { FaInfoCircle } from "react-icons/fa";
import {StyledTooltip, HeaderIconContainer, HeaderContainer, HeaderTitle} from "./styles";

type Props = {
  toggle?: JSX.Element
  title: string
  tooltip: JSX.Element
  mobile: boolean
}

export const AnnotatedHeader = ({toggle=undefined, title, tooltip, mobile}: Props) => {
  return (
    <HeaderContainer>
      <div>
        <HeaderTitle>{title}</HeaderTitle>
        {tooltip && !mobile && (
          <>
            <HeaderIconContainer data-tip data-for={title}>
              <FaInfoCircle />
            </HeaderIconContainer>
            <StyledTooltip place="bottom" type="dark" effect="solid" id={title}>
              {tooltip}
            </StyledTooltip>
          </>
        )}
      </div>
      {toggle !== undefined && toggle}
    </HeaderContainer>
  );
};

