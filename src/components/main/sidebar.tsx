import React from "react";
import { useSelector } from "react-redux";
import {ThemeProvider} from 'styled-components';
import Narrative from "../narrative";
import NavBar from "../navBar";
import Controls from "../controls/controls";
import { SidebarContainer, sidebarTheme } from "./styles";
import { narrativeNavBarHeight } from "../../util/globals";
import { RootState } from "../../store";


export const Sidebar = (
  { width, height, displayNarrative, narrativeTitle, navBarHandler}
) => {
  const sidebarOpen = useSelector((state: RootState) => state.controls.sidebarOpen);

  return (
    <ThemeProvider theme={sidebarTheme}>
      <SidebarContainer left={sidebarOpen ? 0 : -1 * width} width={width} height={height}>
        <NavBar
          sidebar
          toggleHandler={navBarHandler}
          narrativeTitle={displayNarrative ? narrativeTitle : false}
          width={width}
        />
        {displayNarrative ? (
          <Narrative height={height - narrativeNavBarHeight} width={width} />
        ) : (
          <Controls />
        )}
      </SidebarContainer>
    </ThemeProvider>
  );
};
