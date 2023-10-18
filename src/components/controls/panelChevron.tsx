import React from "react";
import styled from 'styled-components';
import { FaChevronRight, FaChevronDown } from "react-icons/fa";

const Container = styled.span`
  padding-right: 6px;
  color: ${(props) => props.theme.color};
`

type Props = {
  show: boolean

  /** Run this callback only and ignore any parent callbacks. */
  onClick: () => void
}

/**
 * An interactive chevron to show/hide a panel's options.
 */
export const PanelChevron = ({ show, onClick: isolatedOnClick }: Props) => {
  const icon = show ? <FaChevronDown /> : <FaChevronRight />

  function onClick(event: React.MouseEvent) {
    event.stopPropagation();
    isolatedOnClick();
  }

  return (
    <Container onClick={onClick}>
      {icon}
    </Container>
  )
}
