import React from "react";
import styled from 'styled-components';
import { FaChevronRight, FaChevronDown } from "react-icons/fa";

const Container = styled.span`
  padding-right: 6px;
  color: ${(props: {theme: {color: string}}): string => props.theme.color};
`

type Props = {
  show: boolean
}

/**
 * An interactive chevron to show/hide a panel's options.
 */
export const PanelChevron = ({ show }: Props): JSX.Element => {
  const icon = show ? <FaChevronDown /> : <FaChevronRight />

  return (
    <Container>
      {icon}
    </Container>
  )
}
