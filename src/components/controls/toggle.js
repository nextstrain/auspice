import React from "react";
import styled from 'styled-components';
import { SidebarSubtitle } from "./styles";

const ToggleBackground = styled.label`
  position: relative;
  display: inline-block;
  width: 35px;
  height: 21px;
  input {
    display: none;
  }

  input:checked {
    background-color: ${(props) => props.theme.unselectedColor};
  }
`;

// A new component based on SidebarSubtitle, but with some override styles
const ToggleSubtitle = styled(SidebarSubtitle)`
  margin-left: 40px;
  margin-top: 4px;
  width: 200px;
`;

const Slider = styled.div`
  & {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${(props) => props.theme.unselectedBackground};
    -webkit-transition: .4s;
    transition: .4s;
    border-radius: 12px;
  }
  &:before {
    position: absolute;
    content: "";
    height: 15px;
    width: 15px;
    left: 4px;
    bottom: 3px;
    background-color: #FFF;
    -webkit-transition: .4s;
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + &:before {
    -webkit-transform: translateX(13px);
    -ms-transform: translateX(13px);
    transform: translateX(13px);
  }
`;

const Input = styled.input`
  & {
    margin-left: "40px"
  }
  &:checked + ${Slider} {
    background-color: ${(props) => props.theme.selectedColor};
  }
  &:focus {
    box-shadow: 0 0 1px #2196F3;
  }
`;


const Toggle = ({display, on, callback, label, style={}}) => {
  if (!display) return null;

  return (
    <div style={style}>
      <ToggleBackground>
        <Input type="checkbox" checked={on} onChange={callback}/>
        <Slider/>
        {label === "" ? null : (
          <ToggleSubtitle>
            {label}
          </ToggleSubtitle>
        )}
      </ToggleBackground>
    </div>
  );
};

export default Toggle;
