import React from "react";
import {ThemeProvider} from 'styled-components';
import Narrative from "../narrative";
import NavBar from "../navBar";
import Controls from "../controls/controls";
import { SidebarContainer, sidebarTheme } from "./styles";
import { narrativeNavBarHeight } from "../../util/globals";


export const Sidebar = (
  {sidebarOpen, width, height, displayNarrative, panelsToDisplay, narrativeTitle, mobileDisplay, navBarHandler}
) => {
  return (
    <ThemeProvider theme={sidebarTheme}>
      <SidebarContainer left={sidebarOpen ? 0 : -1 * width} width={width} height={height}>
        <NavBar
          sidebar
          mobileDisplay={mobileDisplay}
          toggleHandler={navBarHandler}
          narrativeTitle={displayNarrative ? narrativeTitle : false}
          width={width}
        />
        {displayNarrative ? (
          <Narrative height={height - narrativeNavBarHeight} width={width} />
        ) : (
          <Controls
            mobileDisplay={mobileDisplay}
            mapOn={panelsToDisplay.includes("map")}
            frequenciesOn={panelsToDisplay.includes("frequencies")}
          />
        )}
      </SidebarContainer>
    </ThemeProvider>
  );
};
