import { intersection } from "lodash";
import { TOGGLE_PANEL_DISPLAY } from "./types";

const gridPanels = ["tree", "measurements", "map"];
export const numberOfGridPanels = (panels) => intersection(panels, gridPanels).length;
export const hasMultipleGridPanels = (panels) => numberOfGridPanels(panels) > 1;

export const togglePanelDisplay = (panelName) => (dispatch, getState) => {
  const { controls } = getState();
  const idx = controls.panelsToDisplay.indexOf(panelName);
  let panelsToDisplay;
  if (idx === -1) {/* add */
    panelsToDisplay = controls.panelsAvailable.filter((n) =>
      controls.panelsToDisplay.indexOf(n) !== -1 || n === panelName
    );
  } else { /* remove */
    panelsToDisplay = controls.panelsToDisplay.slice();
    panelsToDisplay.splice(idx, 1);
  }
  const canTogglePanelLayout = hasMultipleGridPanels(panelsToDisplay);
  const panelLayout = canTogglePanelLayout ? controls.panelLayout : "full";
  dispatch({type: TOGGLE_PANEL_DISPLAY, panelsToDisplay, panelLayout, canTogglePanelLayout});
};
