import { intersection } from "lodash";
import { TOGGLE_PANEL_DISPLAY } from "./types";
import { calcEntropyInView } from "../util/entropy";

const gridPanels = ["tree", "measurements", "map"];
export const numberOfGridPanels = (panels) => intersection(panels, gridPanels).length;
export const hasMultipleGridPanels = (panels) => numberOfGridPanels(panels) > 1;

export const togglePanelDisplay = (panelName) => (dispatch, getState) => {
  const { controls, entropy, tree } = getState();
  const idx = controls.panelsToDisplay.indexOf(panelName);
  let panelsToDisplay;
  const addPanel = idx===-1;
  if (addPanel) {/* add */
    panelsToDisplay = controls.panelsAvailable.filter((n) =>
      controls.panelsToDisplay.indexOf(n) !== -1 || n === panelName
    );
  } else { /* remove */
    panelsToDisplay = controls.panelsToDisplay.slice();
    panelsToDisplay.splice(idx, 1);
  }
  const canTogglePanelLayout = hasMultipleGridPanels(panelsToDisplay);
  const panelLayout = canTogglePanelLayout ? controls.panelLayout : "full";

  /* If we're toggling on the entropy panel, and the entropy data is stale (it
  becomes stale if an action which would normally update it is skipped due to
  the entropy panel not being rendered) then we need to recalculate it here */
  let entropyData, entropyMaxYVal;
  if (addPanel && panelName==='entropy' && !entropy.bars) {
    ([entropyData, entropyMaxYVal] = calcEntropyInView(tree.nodes, tree.visibility, entropy.selectedCds, entropy.showCounts));
  }
  dispatch({type: TOGGLE_PANEL_DISPLAY, panelsToDisplay, panelLayout, canTogglePanelLayout, entropyData, entropyMaxYVal});
};
