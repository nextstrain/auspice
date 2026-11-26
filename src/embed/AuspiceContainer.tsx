import React from "react";
import { connect } from "react-redux";
import { ThemeProvider } from 'styled-components';
import UnwrappedTree from "../components/tree";
import UnwrappedMap from "../components/map/map";
import UnwrappedEntropy from "../components/entropy";
import PanelErrorBoundary from "../components/errorBoundaries/panelErrorBoundary";
import { PanelsContainer, sidebarTheme } from "../components/main/styles";
import { computeEmbedLayout } from "./layout";
import { RootState } from "../store";

interface StateProps {
  panelsToDisplay: string[]
  width: number
  metadataLoaded: boolean
  treeLoaded: boolean
}

interface OwnProps {
  /** Scales the panel heights; passed straight to `computeEmbedLayout`. Supplied
   * by `render()` from `RenderOptions.heightMultiplier` (default `1`). */
  heightMultiplier?: number
}

type Props = StateProps & OwnProps;

/* These connected panels have `width`/`height` props but also own-props whose
 * types (e.g. an injected `dispatch`, or being untyped JS) don't line up with a
 * plain `width`/`height` call site. Present each as a width/height-only
 * component — `connect`/`withTranslation` supply the rest. The `map` panel also
 * takes a `legend` descriptor and `justGotNewDatasetRenderNewMap` flag. */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const Tree = UnwrappedTree as unknown as React.ComponentType<{ width: number, height: number }>;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const Map = UnwrappedMap as unknown as React.ComponentType<{
  width: number, height: number, legend: { swatches: boolean, demes: boolean },
  justGotNewDatasetRenderNewMap: boolean, mapContainerId: string,
}>;

/* Leaflet binds its map to a globally-unique DOM id, so every map on the page
 * needs its own — otherwise a second `render()` fails with "Map container is
 * already initialized". One id per container instance (i.e. per `render()`). */
let mapInstanceCount = 0;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const Entropy = UnwrappedEntropy as unknown as React.ComponentType<{ width: number, height: number }>;

/**
 * The embed equivalent of `<Main>` (`src/components/main/index.js`), stripped of
 * everything that assumes it owns the page: no sidebar, no `<Info>`/`<Footer>`,
 * no `Monitor`/`Head`/`AnimationController`, no narrative handling. It reads the
 * (host-driven) width from the store, derives the panel geometry from the shared
 * `computeEmbedLayout`, and renders the existing connected panels with
 * `width`/`height` props.
 *
 * Supports the tree, map and entropy panels, any combination of which may be
 * shown at once. Layout mirrors the full app: panels are `inline-block` cards
 * that wrap by width, so giving the tree and map half-widths is what places them
 * side-by-side, and full-widths is what stacks them. Entropy is always a
 * full-width chart, so it always falls below. See `computeEmbedLayout` for the
 * width threshold and how the container height is derived from the panel set.
 */
class AuspiceContainer extends React.Component<Props> {
  private readonly mapContainerId = `auspice-map-${mapInstanceCount++}`;

  override render(): React.ReactNode {
    if (!(this.props.metadataLoaded && this.props.treeLoaded)) {
      return null;
    }
    const { width, panelsToDisplay, heightMultiplier } = this.props;
    const { sideBySide, height, tree, map, entropy } = computeEmbedLayout(panelsToDisplay, width, heightMultiplier);

    return (
      <ThemeProvider theme={sidebarTheme}>
        <PanelsContainer width={width} height={height} left={0}>
          {tree ? (
            <PanelErrorBoundary width={tree.width} height={tree.height} name="tree">
              <Tree width={tree.width} height={tree.height} />
            </PanelErrorBoundary>
          ) : null}
          {map ? (
            <PanelErrorBoundary width={map.width} height={map.height} name="map">
              <Map
                width={map.width}
                height={map.height}
                legend={{ swatches: !sideBySide, demes: true }}
                justGotNewDatasetRenderNewMap={false}
                mapContainerId={this.mapContainerId}
              />
            </PanelErrorBoundary>
          ) : null}
          {entropy ? (
            <PanelErrorBoundary width={entropy.width} height={entropy.height} name="entropy">
              <Entropy width={entropy.width} height={entropy.height} />
            </PanelErrorBoundary>
          ) : null}
        </PanelsContainer>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = (state: RootState): StateProps => ({
  panelsToDisplay: state.controls.panelsToDisplay,
  width: state.browserDimensions.browserDimensions.width,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded,
});

export default connect(mapStateToProps)(AuspiceContainer);
