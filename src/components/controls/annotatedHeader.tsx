import React from "react";
import { useSelector } from "react-redux";
import { FaInfoCircle } from "react-icons/fa";
import {StyledTooltip, HeaderIconContainer, HeaderContainer} from "./styles";
import { RootState } from "../../store";

type Props = {
  title: string
  tooltip?: JSX.Element
}

export const AnnotatedHeader = ({title, tooltip=undefined}: Props) => {
  const mobile = useSelector((state: RootState) => state.general.mobileDisplay);

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

