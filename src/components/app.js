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
import TreeView from "./tree/treeView";
import { controlsHiddenWidth, narrativeWidth, controlsWidth } from "../util/globals";
import { sidebarColor } from "../globalStyles";
import TitleBar from "./framework/title-bar";
import Footer from "./framework/footer";
import DownloadModal from "./download/downloadModal";
import { analyticsNewPage } from "../util/googleAnalytics";
import filesDropped from "../actions/filesDropped";
import Narrative from "./narrative";

const nextstrainLogo = require("../images/nextstrain-logo-small.png");

@connect((state) => ({
  readyToLoad: state.datasets.ready,
  datapath: state.datasets.datapath,
  metadata: state.metadata,
  treeLoaded: state.tree.loaded,
  narrativeLoaded: state.narrative.loaded,
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
    this.state = {
      mql,
      sidebarDocked: mql.matches,
      sidebarOpen: false,
      narrativeSidebarDocked: false,
      narrativeSidebarOpen: false
    };
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
    if (
      (prevProps.datapath !== this.props.datapath)
      /* before we checked if the datapath (pathname) was different to the URL
      to detrect browser back/forward. But we now need a different approach */
    ) {
      this.props.dispatch(loadJSONs());
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.narrativeLoaded !== this.props.narrativeLoaded) {
      this.setState({
        narrativeSidebarDocked: nextProps.narrativeLoaded,
        sidebarOpen: false,
        sidebarDocked: false
      });
    }
  }
  renderPanels() {
    if (!this.props.treeLoaded || !this.props.metadata.loaded) {
      return (
        <img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${this.props.browserDimensions.height / 2 - 100}px`}}/>
      );
    }
    const padding = {
      left: (this.state.sidebarOpen || this.state.sidebarDocked ? controlsWidth : 0) + (this.state.narrativeSidebarOpen || this.state.narrativeSidebarDocked ? narrativeWidth : 0),
      right: 0,
      top: 0,
      bottom: 0
    };
    return (
      <Background>
        <Info padding={padding} />
        {this.props.metadata.panels.indexOf("tree") === -1 ? null : (
          <TreeView padding={padding} />
        )}
        {this.props.metadata.panels.indexOf("map") === -1 ? null : (
          <Map padding={padding} justGotNewDatasetRenderNewMap={false} />
        )}
        {this.props.metadata.panels.indexOf("entropy") === -1 ? null : (
          <Entropy padding={padding} />
        )}
        <Footer padding={padding} />
      </Background>
    );
  }
  renderNarrativeSwitch() {
    return (
      <ToggleSidebarTab
        open={this.state.narrativeSidebarDocked}
        handler={() => {this.setState({narrativeSidebarDocked: !this.state.narrativeSidebarDocked});}}
        widthWhenOpen={(this.state.sidebarOpen || this.state.sidebarDocked ? controlsWidth : 0) + narrativeWidth + 20}
        widthWhenShut={(this.state.sidebarOpen || this.state.sidebarDocked ? controlsWidth : 0) + 40}
      />
    );
  }
  renderNarrativeAndPanels() {
    return (
      <Sidebar
        sidebar={<Narrative/>}
        open={this.state.narrativeSidebarOpen}
        docked={this.state.narrativeSidebarDocked}
        onSetOpen={(a) => {this.setState({narrativeSidebarOpen: a});}}
        sidebarClassName={"sidebar"}
        shadow={false}
        styles={{
          sidebar: {
            backgroundColor: "rgb(255, 255, 255)",
            width: `${narrativeWidth}px`,
            boxShadow: "-2px -2px 4px -2px rgba(0, 0, 0, 0.5) inset"
          }
        }}
      >
        {this.renderPanels()}
      </Sidebar>
    );
  }
  render() {
    return (
      <g>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          widthWhenOpen={controlsWidth}
          widthWhenShut={0}
        />
        {this.props.narrativeLoaded ? this.renderNarrativeSwitch() : null}
        <Sidebar
          sidebar={
            <div>
              <TitleBar minified/>
              <Controls/>
            </div>
          }
          open={this.state.sidebarOpen}
          docked={this.state.sidebarDocked}
          onSetOpen={(a) => {this.setState({sidebarOpen: a});}}
          sidebarClassName={"sidebar"}
          styles={{sidebar: {backgroundColor: sidebarColor}}}
        >
          {this.props.narrativeLoaded ? this.renderNarrativeAndPanels() : this.renderPanels()}
        </Sidebar>
      </g>
    );
  }
}

export default App;
