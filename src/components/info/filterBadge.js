import React from "react";
import styled from 'styled-components';

/**
 * React Components for the badges displayed when a filter is selected (e.g. [X|USA])
 */

const BaseContainer = styled.div`
  color: #5097BA;
  cursor: pointer;
  font-weight: 300;
  padding: 0px 2px 0px 2px;
`;

const TextContainer = styled(BaseContainer)`
  display: inline-block;
  background-color: #E9F2F6;
  border: 1px solid #BDD8E5;
  border-width: 1;
  border-radius: 0px 2px 2px 0px;
  margin: 0px 2px 0px 0px;
`;

const IconContainer = styled.div`
  cursor: pointer;
  color: #5097BA;
  border-bottom-left-radius: 2px;
  border-top-left-radius: 2px;
  border-width: 1px 0px 1px 1px;
  border-style: solid;
  border-color: #BDD8E5;
  min-width: 15px;
  background-color: #E9F2F6;
  padding: 0px 0px 0px 2px;
  margin: 1px 0px 1px 2px;
  display: inline-block;
  text-align: center;
  &:hover, &:focus {
    background-color: #d8eafd;
    color: #0071e6;
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
  border-radius: 2px;
  background-color: #E9F2F6;
  border: 1px solid #BDD8E5;
  border-width: 1;
  border-radius: 2px;
  margin: 0px 2px 0px 0px;
  &:hover {
    text-decoration: none;
  }
`;

/**
 * React component to display a selected filter with associated
 * icons to remove filter. More functionality to be added!
 */
export const FilterBadge = ({onRemove, children}) => {
  return (
    <div style={{display: "inline-block"}}>
      <IconContainer onClick={onRemove} role="button" tabIndex={0}>
        {'\xD7'}
      </IconContainer>
      <TextContainer active>
        {children}
      </TextContainer>
    </div>
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
