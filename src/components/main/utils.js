import { computeResponsive } from "../../util/computeResponsive";
import { controlsWidth, controlsPadding } from "../../util/globals";


export const calcPanelDims = (grid, panels, narrativeIsDisplayed, availableWidth, availableHeight) => {
  /* Calculate reponsive geometries. chart: entropy, frequencies. big: map, tree */
  const chartWidthFraction = 1;
  let bigWidthFraction = grid ? 0.5 : 1;
  let chartHeightFraction = 0.36;
  let bigHeightFraction = grid ? 0.64 : 0.88;
  if (narrativeIsDisplayed) {
    /* heights */
    const numThinPanels = true + panels.includes("entropy") + panels.includes("frequencies") - 1;
    if (numThinPanels === 0) {
      bigHeightFraction = 1;
    } else if (numThinPanels === 1) {
      bigHeightFraction = 0.7;
      chartHeightFraction = 0.3;
    } else {
      bigHeightFraction = 0.5;
      chartHeightFraction = 0.25;
    }
    /* widths */
    if (panels.includes("map") && panels.includes("tree") && !grid) {
      bigWidthFraction = 0.5;
    }
    if (grid && (!panels.includes("map") || !panels.includes("tree"))) {
      bigWidthFraction = 1;
    }
  }

  const big = computeResponsive({horizontal: bigWidthFraction, vertical: bigHeightFraction, availableWidth, availableHeight});
  const chart = computeResponsive({horizontal: chartWidthFraction, vertical: chartHeightFraction, availableWidth, availableHeight, minHeight: 150});

  return {big, chart};

};

const calculateSidebarWidth = (available, narrativeMode) => {
  if (narrativeMode) {
    if (available>1500) return 500;
    else if (available>1000) return 400;
    return 310;
  }
  return controlsWidth+controlsPadding;
};

/* move this to styled-components */
export const calcStyles = (browserDimensions, displayNarrative, sidebarOpen, mobileDisplay) => {
  let availableWidth = browserDimensions.width;
  const availableHeight = browserDimensions.height;
  const sidebarWidth = calculateSidebarWidth(availableWidth, displayNarrative);
  const visibleSidebarWidth = sidebarOpen ? sidebarWidth : 0;
  if (!mobileDisplay) {
    availableWidth -= visibleSidebarWidth;
  }
  const overlayStyles = {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    display: "block",
    width: availableWidth,
    height: availableHeight,
    left: sidebarOpen ? visibleSidebarWidth : 0,
    opacity: sidebarOpen ? 1 : 0,
    visibility: sidebarOpen ? "visible" : "hidden",
    zIndex: 8000,
    backgroundColor: "rgba(0,0,0,0.5)",
    cursor: "pointer",
    overflow: "scroll",
    transition: sidebarOpen ?
      'visibility 0s ease-out, left 0.3s ease-out, opacity 0.3s ease-out' :
      'left 0.3s ease-out, opacity 0.3s ease-out, visibility 0s ease-out 0.3s'
  };
  return {overlayStyles, availableWidth, availableHeight, sidebarWidth};
};
