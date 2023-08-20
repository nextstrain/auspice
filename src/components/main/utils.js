import { computeResponsive } from "../../util/computeResponsive";
import { controlsWidth, controlsPadding } from "../../util/globals";


export const calcPanelDims = (panels, narrativeIsDisplayed, availableWidth, availableHeight) => {
  /* Calculate responsive geometries. chart: entropy, frequencies. full/grid: map, tree, measurements */
  const chartWidthFraction = 1;
  const fullWidthFraction = 1;
  const gridWidthFraction = 0.5;

  let chartHeightFraction = 0.36;
  let fullHeightFraction = 0.88;
  let gridHeightFraction = 0.64;

  if (narrativeIsDisplayed) {
    /* heights */
    const numThinPanels = true + panels.includes("entropy") + panels.includes("frequencies") - 1;
    if (numThinPanels === 0) {
      fullHeightFraction = 1;
      gridHeightFraction = 1;
    } else if (numThinPanels === 1) {
      fullHeightFraction = 0.7;
      gridHeightFraction = 0.7;
      chartHeightFraction = 0.3;
    } else {
      fullHeightFraction = 0.5;
      gridHeightFraction = 0.5;
      chartHeightFraction = 0.25;
    }
  }

  const full = computeResponsive({horizontal: fullWidthFraction, vertical: fullHeightFraction, availableWidth, availableHeight});
  const grid = computeResponsive({horizontal: gridWidthFraction, vertical: gridHeightFraction, availableWidth, availableHeight});
  /* Frequencies are usable with a (SVG) height of ~200px, but the Entropy panel needs more */
  const chartFrequencies = computeResponsive({horizontal: chartWidthFraction, vertical: chartHeightFraction, availableWidth, availableHeight, minHeight: 200});
  const chartEntropy = computeResponsive({horizontal: chartWidthFraction, vertical: chartHeightFraction, availableWidth, availableHeight, minHeight: 300});

  return {full, grid, chartFrequencies, chartEntropy};

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
