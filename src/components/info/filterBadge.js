import React from "react";
import styled from 'styled-components';
import { FaTrash, FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import ReactTooltip from 'react-tooltip';

/**
 * React Components for the badges displayed when a filter is selected
 */

const BaseContainer = styled.div`
  color: #5097BA;
  cursor: pointer;
  font-weight: 300;
  padding: 0px 2px 0px 2px;
`;

const TextContainer = styled(BaseContainer)`
  display: inline-block;
  cursor: help;
  margin: 0px 0px 0px 2px;
`;

const IconContainer = styled.div`
  cursor: pointer;
  color: #5097BA;
  /* left vertical border */
  border-width: 0px 0px 0px 1px;
  border-style: solid;
  border-color: #BDD8E5; */
  min-width: 20px;
  padding: 0px 1px 0px 5px;
  display: inline-block;
  text-align: center;
  &:hover, &:focus {
    & > svg {
      color: #0071e6;
    }
  }
  & > svg {
    transform: translate(-2px, 2px);
  }
`;

const UnselectedFilterTextContainer = styled(BaseContainer)`
  margin: 1px 2px 1px 2px;
  padding: 0px 2px 0px 2px;
  &:hover {
    text-decoration: underline; 
  }
`;

const SelectedFilterTextContainer = styled(BaseContainer)`
  background-color: #E9F2F6;
  border-radius: 2px;
  border: 1px solid #BDD8E5;
  border-width: 1;
  border-radius: 2px;
  margin: 0px 2px 0px 0px;
  &:hover {
    text-decoration: none;
  }
`;


const BadgeContainer = styled.div`
  background-color: #E9F2F6;
  ${(props) => props.striped ? 'background: repeating-linear-gradient(135deg, #E9F2F6, #E9F2F6 5px, transparent 5px, transparent 10px);' : ''};
  display: inline-block;
  font-size: 14px;
  border-radius: 2px;
  border-width: 1px;
  border-style: solid;
  border-color: #BDD8E5;
`;


const StyledTooltip = styled(ReactTooltip)`
  max-width: 30vh;
  font-weight: 400;
  white-space: normal;
  line-height: 1.2;
  padding: 4px !important; /* override ReactTooltip's internal styling */
  & > br {
    margin-bottom: 10px;
  }
`;

export const Tooltip = ({id, children}) => (
  <StyledTooltip place="bottom" type="dark" effect="solid" delayShow={300} id={id}>
    {children}
  </StyledTooltip>
);


/**
 * React component to display a selected filter with associated
 * icons to remove filter. More functionality to be added!
 */
export const FilterBadge = ({remove, canMakeInactive, active, activate, inactivate, children, id, onHoverMessage="The visible data is being filtered by this"}) => {
  return (
    <BadgeContainer striped={canMakeInactive && !active}>
      <TextContainer active={canMakeInactive ? active : true} data-tip data-for={id}>
        {children}
      </TextContainer>
      <Tooltip id={id}>
        {canMakeInactive && !active ? `This filter is currently inactive` : onHoverMessage}
      </Tooltip>
      {canMakeInactive && (
        <IconContainer onClick={active ? inactivate : activate} role="button" tabIndex={0} data-tip data-for={id+'active'}>
          {active ? <FaRegEye/> : <FaRegEyeSlash/>}
          <Tooltip id={id+'active'}>{active ? 'Inactivate this filter' : 'Re-activate this filter'}</Tooltip>
        </IconContainer>
      )}
      <IconContainer onClick={remove} role="button" tabIndex={0}>
        <FaTrash data-tip data-for={id+'remove'}/>
        <Tooltip id={id+'remove'}>{'Remove this filter'}</Tooltip>
      </IconContainer>
    </BadgeContainer>
  );
};


/**
 * A simpler version of <FilterBadge> with no icons
 */
export const SimpleFilter = ({onClick, extraStyles={}, active, children}) => {
  const Container = active ? SelectedFilterTextContainer : UnselectedFilterTextContainer;
  return (
    <div style={{display: "inline-block", ...extraStyles}}>
      <Container onClick={onClick}>
        {children}
      </Container>
    </div>
  );
};
