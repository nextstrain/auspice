import React from "@libraries/react";
import styled from '@libraries/styled-components';

const NavBarContainer = styled.div`
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

const AuspiceNavBar = ({sidebar}) => {
  if (!sidebar) return null;
  return (
    <NavBarContainer>
      <Title href="/">
        {"auspice.us"}
      </Title>
    </NavBarContainer>
  );
};

export default AuspiceNavBar;
