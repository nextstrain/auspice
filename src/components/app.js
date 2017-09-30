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
import Entropy from "./charts/entropy";
import Map from "./map/map";
import Info from "./info/info";
import TreeView from "./tree/treeView";
import { controlsHiddenWidth } from "../util/globals";
import TitleBar from "./framework/title-bar";
import Footer from "./framework/footer";
import DownloadModal from "./download/downloadModal";
import { analyticsNewPage } from "../util/googleAnalytics";
import filesDropped from "../actions/filesDropped";

const nextstrainLogo = require("../images/nextstrain-logo-small.png");

/* BRIEF REMINDER OF PROPS AVAILABLE TO APP:
  React-Router v4 injects length, action, location, push etc into props,
    but perhaps it's more consistent if we access these through
    this.context.router.
  Regardless, changes in URL will trigger the lifecycle methods
    here as that is a prop of this component, whether we use it or not
  see https://reacttraining.com/react-router
*/
@connect((state) => ({
  datasetPathName: state.controls.datasetPathName,
  readyToLoad: state.datasets.ready,
  metadata: state.metadata,
  treeLoaded: state.tree.loaded,
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
    mql.addListener(() => this.setState({sidebarDocked: this.state.mql.matches}));
    this.state = {
      mql,
      sidebarDocked: mql.matches,
      sidebarOpen: false
    };
    analyticsNewPage();
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  componentWillMount() {
    if (this.props.readyToLoad) { /* charon API call loaded before the app came in - i.e. splash came first */
      this.props.dispatch(loadJSONs(this.context.router));
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
    /* browser back / forward / prop change */
    if (
      (prevProps.readyToLoad === false && this.props.readyToLoad === true) ||
      (
        this.props.readyToLoad &&
        this.props.datasetPathName !== undefined &&
        this.props.datasetPathName !== this.context.router.history.location.pathname
      )
    ) {
      this.props.dispatch(loadJSONs(this.context.router));
    }
  }

  render() {
    return (
      <g>
        <DownloadModal/>
        <ToggleSidebarTab
          open={this.state.sidebarDocked}
          handler={() => {this.setState({sidebarDocked: !this.state.sidebarDocked});}}
        />
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
        >
          {
            (!this.props.treeLoaded || !this.props.metadata.metadata) ? (
              <img className={"spinner"} src={nextstrainLogo} alt="loading" style={{marginTop: `${this.props.browserDimensions.height / 2 - 100}px`}}/>
            ) : (
              <Background>
                <Info
                  sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
                />
                {this.props.metadata.metadata.panels.indexOf("tree") === -1 ? null : (
                  <TreeView
                    query={queryString.parse(this.context.router.history.location.search)}
                    sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
                  />
                )}
                {this.props.metadata.metadata.panels.indexOf("map") === -1 ? null : (
                  <Map
                    sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
                    justGotNewDatasetRenderNewMap={false}
                  />
                )}
                {this.props.metadata.metadata.panels.indexOf("entropy") === -1 ? null : (
                  <Entropy
                    sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
                  />
                )}
                <Footer
                  sidebar={this.state.sidebarOpen || this.state.sidebarDocked}
                />
              </Background>
            )
          }
        </Sidebar>
      </g>
    );
  }
}

export default App;
