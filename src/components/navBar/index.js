/* eslint-disable no-multi-spaces */
import React from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import { normalNavBarHeight } from "../../util/globals";
import { AuspiceNavBar } from "./content";
import { hasExtension, getExtension } from "../../util/extensions";
import { sidebarTheme } from "../../components/main/styles";
import { changePage } from "../../actions/navigation";

const NavBarContainer = styled.div`
  flex: 0 0 auto;
  padding: 0 10px;
  background-color: ${sidebarTheme.background};
  height: ${normalNavBarHeight}px;
  align-items: left;
  overflow: hidden;
  z-index: 100;
  transition: left .3s ease-out;
`;

const Content = hasExtension("navbarComponent") ?
  getExtension("navbarComponent") : AuspiceNavBar;


@connect(
  undefined,
  dispatch => ({
    changePage: path => dispatch(changePage(path))
  })
)
class NavBar extends React.Component {
  render() {
    const {narrativeTitle, width, changePage} = this.props
    return (
      <NavBarContainer>
        <Content
          narrativeTitle={narrativeTitle}
          width={width}
          changePage={changePage}
        />
      </NavBarContainer>
    );
  }
}

export default NavBar;
