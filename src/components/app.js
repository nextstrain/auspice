import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Sidebar from "react-sidebar";
import queryString from "query-string";
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
import { controlsHiddenWidth } from "../util/globals";
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
      rightSidebarDocked: false,
      rightSidebarOpen: false
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
      this.setState({rightSidebarDocked: nextProps.narrativeLoaded});
    }
  }
  renderPanels() {
    if (!this.props.treeLoaded || !this.props.metadata.loaded) {
      return (
        <img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${this.props.browserDimensions.height / 2 - 100}px`}}/>
      );
    }
    const sidebar = this.state.sidebarOpen || this.state.sidebarDocked;
    const sidebarRight = this.state.rightSidebarOpen || this.state.rightSidebarDocked;
    return (
      <Background>
        <Info sidebar={sidebar} sidebarRight={sidebarRight} />
        {this.props.metadata.panels.indexOf("tree") === -1 ? null : (
          <TreeView
            sidebar={sidebar}
            sidebarRight={sidebarRight}
          />
        )}
        {this.props.metadata.panels.indexOf("map") === -1 ? null : (
          <Map
            sidebar={sidebar}
            sidebarRight={sidebarRight}
            justGotNewDatasetRenderNewMap={false}
          />
        )}
        {this.props.metadata.panels.indexOf("entropy") === -1 ? null : (
          <Entropy sidebar={sidebar} sidebarRight={sidebarRight} />
        )}
        <Footer sidebar={sidebar} sidebarRight={sidebarRight} />
      </Background>
    );
  }
  render() {
    return (
      <g>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
          side={"left"}
        />
        {this.props.narrativeLoaded ?
          (<ToggleSidebarTab
            open={this.state.rightSidebarDocked}
            handler={() => {this.setState({rightSidebarDocked: !this.state.rightSidebarDocked});}}
            side={"right"}
          />) :
          null}
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
          styles={{
            sidebar: {
              backgroundColor: sidebarColor
            }
          }}
        >
          {this.props.narrativeLoaded ?
            (<Sidebar
              sidebar={<Narrative/>}
              pullRight
              open={this.state.rightSidebarOpen}
              docked={this.state.rightSidebarDocked}
              onSetOpen={(a) => {this.setState({rightSidebarOpen: a});}}
              sidebarClassName={"sidebar"}
              styles={{
                sidebar: {
                  backgroundColor: sidebarColor,
                  width: "300px"
                }
              }}
            >
              {this.renderPanels()}
            </Sidebar>) :
            this.renderPanels()
          }
        </Sidebar>
      </g>
    );
  }
}

export default App;
