import React from "react";
import styled from 'styled-components';
import { FaChevronRight, FaChevronDown } from "react-icons/fa";

const Container = styled.span`
  padding-right: 6px;
  color: ${(props) => props.theme.color};
`

type Props = {
  show: boolean
}

/**
 * An interactive chevron to show/hide a panel's options.
 */
export const PanelChevron = ({ show }: Props) => {
  const icon = show ? <FaChevronDown /> : <FaChevronRight />

  return (
    <Container>
      {icon}
    </Container>
  )
}
