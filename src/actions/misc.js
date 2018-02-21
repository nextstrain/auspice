import { TOGGLE_PANEL_DISPLAY } from "./types";

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
  let panelLayout = controls.panelLayout;
  if (panelsToDisplay.indexOf("tree") === -1 || panelsToDisplay.indexOf("map") === -1) {
    panelLayout = "full";
  }
  dispatch({type: TOGGLE_PANEL_DISPLAY, panelsToDisplay, panelLayout});
};
