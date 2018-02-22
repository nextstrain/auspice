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
import { controlsHiddenWidth, controlsWidth, controlsPadding, titleBarHeight } from "../util/globals";
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
  let bigWidthFraction = grid ? 0.5 : 1;
  let chartHeightFraction = 0.3;
  let bigHeightFraction = grid ? 0.7 : 0.88;
  if (narrative) {
    /* heights */
    if (!show("entropy")) {
      bigHeightFraction = 1;
    } else {
      bigHeightFraction = 0.7;
      chartHeightFraction = 0.3;
    }
    /* widths */
    if (show("map") && show("tree") && !grid) {
      console.warn("narrative mode specified full display but we have both map & tree");
      bigWidthFraction = 0.5;
    }
    if (grid && (!show("map") || !show("tree"))) {
      console.warn("narrative mode specified grid display but we are not showing both map & tree");
      bigWidthFraction = 1;
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
    let sidebarWidth = 0;
    if (this.state.sidebarOpen || this.state.sidebarDocked) {
      if (this.props.displayNarrative) {
        sidebarWidth = parseInt(0.27 * availableWidth, 10);
      } else {
        sidebarWidth = controlsWidth;
      }
      sidebarWidth += controlsPadding;
      availableWidth -= sidebarWidth;
    }
    const sidebarWidthLessPadding = sidebarWidth - controlsPadding;
    const sidebarHeight = this.props.browserDimensions.height - titleBarHeight;
    return (
      <g>
        <AnimationController/>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          widthWhenOpen={sidebarWidth - 15}
          widthWhenShut={0}
          dontDisplay={this.props.displayNarrative}
        />
        <Sidebar
          sidebar={
            <div>
              <TitleBar minified/>
              {this.props.displayNarrative ?
                <Narrative width={sidebarWidthLessPadding} height={sidebarHeight}/> :
                <Controls width={sidebarWidthLessPadding} height={sidebarHeight}/>
              }
            </div>
          }
          open={this.state.sidebarOpen}
          docked={this.state.sidebarDocked}
          onSetOpen={(a) => {this.setState({sidebarOpen: a});}}
          sidebarClassName={"sidebar"}
          styles={{
            sidebar: {backgroundColor: sidebarColor, width: sidebarWidth, height: "100%", overflow: "hidden"},
            content: {width: availableWidth, left: sidebarWidth}
          }}
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
