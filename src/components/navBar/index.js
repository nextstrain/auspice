/* eslint-disable no-multi-spaces */
import React from "react";
import styled from 'styled-components';
import { normalNavBarHeight, narrativeNavBarHeight } from "../../util/globals";
import SidebarChevron from "../framework/sidebar-chevron";
import { AuspiceNavBar } from "./content";
import { hasExtension, getExtension } from "../../util/extensions";

const NavBarContainer = styled.div`
  left: 0;
  max-width: 960px;
  margin-top: auto;
  margin-right: auto;
  margin-bottom: auto;
  margin-left: auto;
  height: ${(props) => props.narrative ? narrativeNavBarHeight : normalNavBarHeight}px;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  z-index: 100;
  transition: left .3s ease-out;
`;

const Content = hasExtension("navbarComponent") ?
  getExtension("navbarComponent") : AuspiceNavBar;


const NavBar = ({sidebar, toggleHandler, narrativeTitle, width}) => {
  // const styles = getStyles({minified, narrative: !!narrativeTitle, width});
  const showSidebarToggle = sidebar && !narrativeTitle;
  return (
    <NavBarContainer>
      <Content
        narrativeTitle={narrativeTitle}
        sidebar={sidebar}
        width={width}
      />
      <SidebarChevron navHeight={normalNavBarHeight} navWidth={width} display={showSidebarToggle} onClick={toggleHandler}/>
    </NavBarContainer>
  );
};

export default NavBar;
