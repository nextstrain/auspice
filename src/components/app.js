import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Sidebar from "react-sidebar";
import "whatwg-fetch"; // setup polyfill
import { loadJSONs } from "../actions/loadData";
import Background from "./framework/background";
import ToggleSidebarTab from "./framework/toggle-sidebar-tab";
import Controls from "./controls/controls";
// import Frequencies from "./charts/frequencies";
import { Entropy } from "./charts/entropy";
import Map from "./map/map";
import Info from "./info/info";
import Tree from "./tree";
import { controlsHiddenWidth, narrativeWidth, controlsWidth, controlsPadding } from "../util/globals";
import { sidebarColor } from "../globalStyles";
import TitleBar from "./framework/title-bar";
import Footer from "./framework/footer";
import DownloadModal from "./download/downloadModal";
import { analyticsNewPage } from "../util/googleAnalytics";
import filesDropped from "../actions/filesDropped";
import Narrative from "./narrative";
import AnimationController from "./framework/animationController";
import { calcUsableWidth, computeResponsive } from "../util/computeResponsive";

const nextstrainLogo = require("../images/nextstrain-logo-small.png");

/* <Contents> contains the header, tree, map, footer components etc.
 * here is where the panel sizes are decided, as well as which components are displayed.
 */
const Contents = ({showSpinner, availableWidth, availableHeight, panels, grid, narrative}) => {
  if (showSpinner) {
    return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${availableHeight / 2 - 100}px`}}/>);
  }
  const show = (name) => panels.indexOf(name) !== -1;
  /* Calculate reponsive geometries. chart: entropy, frequencies. big: map, tree */
  const chartWidthFraction = 1;
  const bigWidthFraction = grid ? 0.5 : 1;
  let chartHeightFraction = 0.3;
  let bigHeightFraction = grid ? 0.7 : 0.88;
  if (narrative) {
    if (!show("entropy")) {
      bigHeightFraction = 1;
    } else {
      bigHeightFraction = 0.7;
      chartHeightFraction = 0.3;
    }
  }
  const big = computeResponsive({horizontal: bigWidthFraction, vertical: bigHeightFraction, availableWidth, availableHeight});
  const chart = computeResponsive({horizontal: chartWidthFraction, vertical: chartHeightFraction, availableWidth, availableHeight, minHeight: 150});

  return (
    <Background>
      {narrative ? null : <Info width={calcUsableWidth(availableWidth, 1)} />}
      {show("tree") ? <Tree width={big.width} height={big.height} /> : null}
      {show("map") ? <Map width={big.width} height={big.height} justGotNewDatasetRenderNewMap={false} /> : null}
      {show("entropy") ? <Entropy width={chart.width} height={chart.height} /> : null}
      {narrative ? null : <Footer width={calcUsableWidth(availableWidth, 1)} />}
    </Background>
  );
};

@connect((state) => ({
  readyToLoad: state.datasets.ready,
  datapath: state.datasets.datapath,
  metadataLoaded: state.metadata.loaded,
  treeLoaded: state.tree.loaded,
  panelsToDisplay: state.controls.panelsToDisplay,
  panelLayout: state.controls.panelLayout,
  displayNarrative: state.narrative.display,
  browserDimensions: state.browserDimensions.browserDimensions
}))
class App extends React.Component {
  constructor(props) {
    super(props);
    /* window listener to see when width changes cross thrhershold to toggle sidebar */
    /* A note on sidebar terminology:
    sidebarOpen (AFAIK) is only used via touch drag events
    sidebarDocked is the prop used on desktop.
    While these states could be moved to redux, they would need
    to be connected to here, triggering an app render anyways
    */
    const mql = window.matchMedia(`(min-width: ${controlsHiddenWidth}px)`);
    mql.addListener(() => this.setState({
      sidebarDocked: this.state.mql.matches
    }));
    this.state = {mql, sidebarDocked: mql.matches, sidebarOpen: false};
    analyticsNewPage();
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  }
  componentWillMount() {
    if (this.props.datapath) { /* datapath (pathname) only appears after manifest JSON has arrived */
      this.props.dispatch(loadJSONs());
    }
  }
  componentDidMount() {
    document.addEventListener("dragover", (e) => {e.preventDefault();}, false);
    document.addEventListener("drop", (e) => {
      e.preventDefault();
      return this.props.dispatch(filesDropped(e.dataTransfer.files));
    }, false);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.datapath !== this.props.datapath) {
      this.props.dispatch(loadJSONs());
    }
  }
  render() {
    let availableWidth = this.props.browserDimensions.width;
    if (this.state.sidebarOpen || this.state.sidebarDocked) {
      availableWidth -= this.props.displayNarrative ? controlsWidth : controlsWidth;
      availableWidth -= controlsPadding;
    }
    return (
      <g>
        <AnimationController/>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          widthWhenOpen={controlsWidth}
          widthWhenShut={0}
        />
        <Sidebar
          sidebar={
            <div>
              <TitleBar minified/>
              {this.props.displayNarrative ? <Narrative/> : <Controls/>}
            </div>
          }
          open={this.state.sidebarOpen}
          docked={this.state.sidebarDocked}
          onSetOpen={(a) => {this.setState({sidebarOpen: a});}}
          sidebarClassName={"sidebar"}
          styles={{sidebar: {backgroundColor: sidebarColor, height: "100%", overflow: "hidden"}}}
        >
          <Contents
            showSpinner={!this.props.treeLoaded || !this.props.metadataLoaded}
            availableWidth={availableWidth}
            availableHeight={this.props.browserDimensions.height}
            panels={this.props.panelsToDisplay}
            grid={this.props.panelLayout === "grid"}
            narrative={this.props.displayNarrative}
          />
        </Sidebar>
      </g>
    );
  }
}

export default App;
