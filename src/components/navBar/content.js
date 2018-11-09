import React from "react";
import styled from 'styled-components';

const AuspiceNavBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Title = styled.a`
  padding: 0px;
  color: #000;
  text-decoration: none;
  color: ${(props) => props.theme.color};
  font-size: 20px;
  font-weight: 400;
  cursor: pointer;
  letter-spacing: 1rem;
`;

export const AuspiceNavBar = ({narrativeTitle, sidebar}) => {
  if (!sidebar) return null;
  return (
    <AuspiceNavBarContainer>
      <Title href="/">
	{"auspice"}
      </Title>
    </AuspiceNavBarContainer>
  );
};
