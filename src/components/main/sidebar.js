import React from "react";
import {ThemeProvider} from 'styled-components';
import Narrative from "../narrative";
import Controls from "../controls/controls";
import { SidebarContainer, sidebarTheme } from "./styles";
import { narrativeNavBarHeight } from "../../util/globals";


export const Sidebar = (
  {sidebarOpen, width, height, displayNarrative, panelsToDisplay}
) => {
  return (
    <ThemeProvider theme={sidebarTheme}>
      <SidebarContainer left={sidebarOpen ? 0 : -1 * width} width={width} height={height}>
        {displayNarrative ?
          <Narrative
            height={height - narrativeNavBarHeight}
            width={width}
          /> :
          <Controls
            mapOn={panelsToDisplay.includes("map")}
          />
        }
      </SidebarContainer>
    </ThemeProvider>
  );
};
