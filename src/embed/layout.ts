/**
 * The embed's layout model.
 *
 * Unlike the full app — which is handed a fixed browser-window height and splits
 * it among panels as *fractions* (`calcPanelDims`) — the embed is given only a
 * width and must *produce* a height: it owns the vertical space and the host
 * container grows to fit it. So we size each panel's SVG absolutely (as a ratio
 * of the width) and sum the rows to get the container height. That way every
 * panel combination fits exactly, with no internal scroll and no empty gap.
 *
 * This is the single source of truth for both halves of that calculation:
 * `render()` uses `height` to size the mount element and the store's browser
 * dimensions, and `AuspiceContainer` uses the per-panel dims (and `sideBySide`)
 * to render the panels — both call `computeEmbedLayout` with the same inputs, so
 * they can't disagree.
 */
import { calcUsableWidth } from "../util/computeResponsive";

/** When both the tree and map are shown, they sit side-by-side only once the
 * container is at least this wide; below it they stack above-and-below. (The
 * full app makes this a user-toggled "grid"/"full" choice; the embed has no
 * sidebar to toggle from, so it decides from the available width instead.) */
export const GRID_LAYOUT_MIN_WIDTH = 1000;

/** A "main" panel (tree / map) is this fraction of the container width tall. */
const MAIN_PANEL_ASPECT = 0.6;
/** The entropy chart is this fraction of the container width tall (it's a wide,
 * short panel), floored at `ENTROPY_MIN_HEIGHT`. */
const ENTROPY_ASPECT = 0.25;
const ENTROPY_MIN_HEIGHT = 300;
/** Vertical chrome each card adds around its SVG (title, padding, margin). This
 * mirrors `computeResponsive`'s `verticalPadding`, which the app subtracts from
 * the available height for the same reason; here we add it so the container is
 * tall enough to hold the card, not just the SVG. */
const CARD_CHROME = 52;

export interface PanelDims {
  width: number
  height: number
}

export interface EmbedLayout {
  /** Whether the tree and map share a row (vs. stacking). Also drives the map's
   * legend layout, exactly as `panelLayout === "grid"` does in the full app. */
  sideBySide: boolean
  /** The total container height needed to show every requested panel. */
  height: number
  tree?: PanelDims
  map?: PanelDims
  entropy?: PanelDims
}

/**
 * Compute the embed's layout for a given set of panels and container width.
 * Panels not in `panels` are left `undefined`.
 *
 * `heightMultiplier` (default `1`) scales how tall each panel's drawing area is.
 * It is applied to the panels themselves — not to the container alone — so a
 * value of `1.5` makes the tree/map/entropy ~50% taller (and the container grows
 * to match), rather than just padding the container with empty space. The fixed
 * per-card chrome is *not* scaled (it is title/padding, not drawable area), so
 * the total container height grows by slightly less than the multiplier.
 */
export function computeEmbedLayout(panels: string[], width: number, heightMultiplier = 1): EmbedLayout {
  const showTree = panels.includes("tree");
  const showMap = panels.includes("map");
  const showEntropy = panels.includes("entropy");

  /* Guard against a non-positive / non-finite multiplier collapsing the layout. */
  const scale = Number.isFinite(heightMultiplier) && heightMultiplier > 0 ? heightMultiplier : 1;

  const sideBySide = showTree && showMap && width >= GRID_LAYOUT_MIN_WIDTH;

  /* Widths match the app's panels: a full-width card loses `xPaddingOneCard`, a
   * half-width (grid) card loses `xPaddingTwoCards` — see `calcUsableWidth`. */
  const mainWidth = calcUsableWidth(width, sideBySide ? 0.5 : 1);
  const mainHeight = Math.round(MAIN_PANEL_ASPECT * width * scale);
  const mainDims: PanelDims = { width: mainWidth, height: mainHeight };

  const entropyDims: PanelDims = {
    width: calcUsableWidth(width, 1),
    height: Math.max(Math.round(ENTROPY_ASPECT * width * scale), ENTROPY_MIN_HEIGHT),
  };

  /* The tree and map occupy one row when side-by-side, otherwise one row each;
   * entropy is always its own row below. Each row costs its SVG height plus one
   * card's worth of chrome. */
  const mainRows = sideBySide ? 1 : (showTree ? 1 : 0) + (showMap ? 1 : 0);
  const height =
    mainRows * (mainHeight + CARD_CHROME) +
    (showEntropy ? entropyDims.height + CARD_CHROME : 0) +
    15;
  

  return {
    sideBySide,
    height,
    tree: showTree ? mainDims : undefined,
    map: showMap ? mainDims : undefined,
    entropy: showEntropy ? entropyDims : undefined,
  };
}
