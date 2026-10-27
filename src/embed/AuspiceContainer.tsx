import React from "react";
import { connect } from "react-redux";
import { ThemeProvider } from 'styled-components';
import UnwrappedTree from "../components/tree";
import PanelErrorBoundary from "../components/errorBoundaries/panelErrorBoundary";
import { calcPanelDims } from "../components/main/utils";
import { PanelsContainer, sidebarTheme } from "../components/main/styles";
import { RootState } from "../store";

interface StateProps {
  panelsToDisplay: string[]
  width: number
  height: number
  metadataLoaded: boolean
  treeLoaded: boolean
}

/* `dispatch` is injected by `connect`, but `<Tree>`'s own-props type lists it as
 * required, so present the connected panel as a width/height-only component. */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const Tree = UnwrappedTree as unknown as React.ComponentType<{ width: number, height: number }>;

/**
 * The embed equivalent of `<Main>` (`src/components/main/index.js`), stripped of
 * everything that assumes it owns the page: no sidebar, no `<Info>`/`<Footer>`,
 * no `Monitor`/`Head`/`AnimationController`, no narrative handling. It reads the
 * (host-driven) browser dimensions from the store, computes panel geometry via
 * the shared `calcPanelDims`, and renders the existing connected panels with
 * `width`/`height` props.
 *
 * MVP: only the tree panel is rendered.
 */
class AuspiceContainer extends React.Component<StateProps> {
  override render(): React.ReactNode {
    if (!(this.props.metadataLoaded && this.props.treeLoaded)) {
      return null;
    }
    const { width, height, panelsToDisplay } = this.props;
    const { full } = calcPanelDims(panelsToDisplay, false, width, height);

    return (
      <ThemeProvider theme={sidebarTheme}>
        <PanelsContainer width={width} height={height} left={0}>
          {panelsToDisplay.includes("tree") ? (
            <PanelErrorBoundary width={full.width} height={full.height} name="tree">
              <Tree width={full.width} height={full.height} />
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
  height: state.browserDimensions.browserDimensions.height,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded,
});

export default connect(mapStateToProps)(AuspiceContainer);
