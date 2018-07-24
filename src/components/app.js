import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { loadJSONs } from "../actions/loadData";
import SidebarToggle from "./framework/sidebar-toggle";
import Controls from "./controls/controls";
import { Frequencies } from "./frequencies";
import { Entropy } from "./entropy";
import Info from "./info/info";
import Tree from "./tree";
import Map from "./map/map";
import { controlsHiddenWidth, controlsWidth, controlsPadding } from "../util/globals";
import { sidebarColor } from "../globalStyles";
import NavBar from "./framework/nav-bar";
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
const Contents = ({sidebarOpen, showSpinner, styles, availableWidth, availableHeight, panels, grid, narrative, frequenciesLoaded}) => {
  if (showSpinner) {
    return (<img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${availableHeight / 2 - 100}px`}}/>);
  }
  const show = (name) => panels.indexOf(name) !== -1;
  /* Calculate reponsive geometries. chart: entropy, frequencies. big: map, tree */
  const chartWidthFraction = 1;
  let bigWidthFraction = grid ? 0.5 : 1;
  let chartHeightFraction = 0.32;
  let bigHeightFraction = grid ? 0.68 : 0.88;
  if (narrative) {
    /* heights */
    const numThinPanels = true + show("entropy") + show("frequencies") - 1;
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

  /* TODO */
  return (
    <div style={styles}>
      {narrative ? null : <Info width={calcUsableWidth(availableWidth, 1)} />}
      {show("tree") ? <Tree width={big.width} height={big.height} /> : null}
      {show("map") ? <Map width={big.width} height={big.height} justGotNewDatasetRenderNewMap={false} /> : null}
      {show("entropy") ? <Entropy width={chart.width} height={chart.height} /> : null}
      {show("frequencies") && frequenciesLoaded ? <Frequencies width={chart.width} height={chart.height} /> : null}
      {narrative ? null : <Footer width={calcUsableWidth(availableWidth, 1)} />}
    </div>
  );
};

const Sidebar = ({styles, sidebarOpen, mobileDisplay, narrative, mapOn, toggleHandler}) => {
  return (
    <div style={styles}>
      <NavBar
        minified
        sidebarOpen={sidebarOpen}
        mobileDisplay={mobileDisplay}
        toggleHandler={toggleHandler}
      />
      {narrative ?
        <Narrative height={styles.height}/> :
        <Controls mapOn={mapOn}/>
      }
    </div>
  );
};

const Overlay = ({styles, mobileDisplay, handler}) => {
  return (
    mobileDisplay ?
      <div style={styles} onClick={handler} onTouchStart={handler}/> :
      <div/>
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
  browserDimensions: state.browserDimensions.browserDimensions,
  frequenciesLoaded: state.frequencies.loaded
}))
class App extends React.Component {
  constructor(props) {
    super(props);
    /* window listener to see when width changes cross threshold to toggle sidebar */
    const mql = window.matchMedia(`(min-width: ${controlsHiddenWidth}px)`);
    mql.addListener(() => this.setState({
      sidebarOpen: this.state.mql.matches,
      mobileDisplay: !this.state.mql.matches
    }));
    this.state = {
      mql,
      sidebarOpen: props.treeLoaded ? mql.matches : false,
      mobileDisplay: !mql.matches
    };
    analyticsNewPage();
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.treeLoaded && this.state.mql.matches) {
      this.setState({sidebarOpen: true});
    }
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
    /* D I M E N S I O N S */
    let availableWidth = this.props.browserDimensions.width;
    const availableHeight = this.props.browserDimensions.height;

    let sidebarWidth = 0;
    if (this.props.displayNarrative) {
      sidebarWidth = parseInt(0.27 * availableWidth, 10);
    } else {
      sidebarWidth = controlsWidth;
    }
    sidebarWidth += controlsPadding;

    const visibleSidebarWidth = this.state.sidebarOpen ? sidebarWidth : 0;
    if (!this.state.mobileDisplay) {
      availableWidth -= visibleSidebarWidth;
    }

    const mapOn = this.props.panelsToDisplay.indexOf("map") !== -1;

    /* S T Y L E S */
    const sharedStyles = {
      position: "absolute",
      top: 0,
      bottom: 0,
      right: 0,
      transition: 'left 0.3s ease-out'
    };
    const overlayStyles = {
      ...sharedStyles,
      position: "absolute",
      display: "block",
      width: availableWidth,
      height: availableHeight,
      left: this.state.sidebarOpen ? visibleSidebarWidth : 0,
      opacity: this.state.sidebarOpen ? 1 : 0,
      visibility: this.state.sidebarOpen ? "visible" : "hidden",
      zIndex: 8000,
      backgroundColor: "rgba(0,0,0,0.5)",
      cursor: "pointer",
      overflow: "scroll",
      transition: this.state.sidebarOpen ?
        'visibility 0s ease-out, left 0.3s ease-out, opacity 0.3s ease-out' :
        'left 0.3s ease-out, opacity 0.3s ease-out, visibility 0s ease-out 0.3s'
    };
    const sidebarStyles = {
      ...sharedStyles,
      left: this.state.sidebarOpen ? 0 : -1 * sidebarWidth,
      backgroundColor: sidebarColor,
      height: availableHeight,
      width: sidebarWidth,
      maxWidth: sidebarWidth,
      overflow: "scroll",
      boxShadow: '-3px 0px 3px -3px rgba(0, 0, 0, 0.2) inset'
    };
    const contentStyles = {
      ...sharedStyles,
      backgroundColor: "#fff",
      height: availableHeight,
      width: availableWidth,
      overflowX: "hidden",
      overflowY: "scroll",
      left: this.state.sidebarOpen ? sidebarWidth : 0
    };

    return (
      <span>
        <AnimationController/>
        <DownloadModal/>
        <SidebarToggle
          sidebarOpen={this.state.sidebarOpen}
          mobileDisplay={this.state.mobileDisplay}
          handler={() => {this.setState({sidebarOpen: !this.state.sidebarOpen});}}
        />
        <Sidebar
          styles={sidebarStyles}
          sidebarOpen={this.state.sidebarOpen}
          mobileDisplay={this.state.mobileDisplay}
          narrative={this.props.displayNarrative}
          mapOn={mapOn}
          toggleHandler={() => {this.setState({sidebarOpen: !this.state.sidebarOpen});}}
        />
        <Contents
          sidebarOpen={this.state.sidebarOpen}
          styles={contentStyles}
          showSpinner={!this.props.treeLoaded || !this.props.metadataLoaded}
          availableWidth={availableWidth}
          availableHeight={availableHeight}
          panels={this.props.panelsToDisplay}
          grid={this.props.panelLayout === "grid"}
          narrative={this.props.displayNarrative}
          frequenciesLoaded={this.props.frequenciesLoaded}
        />
        <Overlay
          styles={overlayStyles}
          sidebarOpen={this.state.sidebarOpen}
          mobileDisplay={this.state.mobileDisplay}
          handler={() => {this.setState({sidebarOpen: false});}}
        />
      </span>
    );
  }
}

export default App;
