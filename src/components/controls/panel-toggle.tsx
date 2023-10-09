// A textual toggle to adjust the state of a panel via dispatch.

import React from "react";
import { useDispatch } from "react-redux";
import styled from 'styled-components';

import { togglePanelDisplay } from "../../actions/panelDisplay";

type Props = {
  panel: string
  on: boolean
}

const Text = styled.span`
  font-size: 14px;
  cursor: pointer;
  padding: 0 3px;
`;

const TextSelected = styled(Text)`
  color: ${(props) => props.theme.selectedColor};
`;

const TextUnselected = styled(Text)`
  color: ${(props) => props.theme.unselectedColor};
`;

const PanelToggle = ({ panel, on }: Props) => {
  const dispatch = useDispatch();

  if (on) {
    return (
      <div>
        <TextSelected>ON</TextSelected>
        <TextUnselected onClick={() => dispatch(togglePanelDisplay(panel))}>OFF</TextUnselected>
      </div>
    )
  }
  else {
    return (
      <div>
        <TextUnselected onClick={() => dispatch(togglePanelDisplay(panel))}>ON</TextUnselected>
        <TextSelected>OFF</TextSelected>
      </div>
    )
  }
};

export default PanelToggle;
