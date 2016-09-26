import React from "react";
import { connect } from "react-redux";
import {
  populateMetadataStore,
  populateTreeStore,
  populateSequencesStore,
  populateFrequenciesStore,
  populateEntropyStore
} from "../actions";

import Radium from "radium";
import _ from "lodash";
// import {Link} from "react-router";
// import Awesome from "react-fontawesome";
import Flex from "./framework/flex";
import Header from "./framework/header";
import Controls from "./controls/controls";
import Frequencies from "./charts/frequencies";
import Entropy from "./charts/entropy";
import TreeView from "./tree/treeView";
import Footer from "./framework/footer";
import parseParams from "../util/parseParams";
import queryString from "query-string";

@connect()
@Radium
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: false,
      location: {
        pathname: window.location.pathname.slice(1, -1),
        query: queryString.parse(window.location.search)
      }
      // sidebarDocked: true,
    };
  }
  static propTypes = {
    /* react */
    dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    /* component api */
    error: React.PropTypes.object,
    loading: React.PropTypes.bool,
    user: React.PropTypes.object,
    routes: React.PropTypes.array
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"

  }
  componentDidMount() {
    console.log('registering')
    // when the user hits the back button or forward, let us know so we can setstate again
    // all of the other intentional route changes we will manually setState
    window.addEventListener('popstate', (a,b,c) => {
      console.log('popstate', a,b,c)
      this.setState({
        location: {
          pathname: window.location.pathname.slice(1, -1),
          query: queryString.parse(window.location.search)
        }
      })
    })
    this.maybeFetchDataset();
  }
  componentDidUpdate() {
    this.maybeFetchDataset();
  }
  maybeFetchDataset() {
    if (this.state.latestValidParams === this.state.location.pathname) {
      return;
    }

    const parsedParams = parseParams(this.state.location.pathname);
    const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
    tmp_levels.sort((x, y) => x[0] > y[0]);
    const data_path = tmp_levels.map( function (d) {return d[1];}).join("_");
    if (parsedParams.incomplete) {
        this.setVirusPath(parsedParams.fullsplat);
    }
    if (parsedParams.valid && this.state.latestValidParams !== parsedParams.fullsplat) {
      console.log("attempting to load, need to nuke old Guid",data_path);
      this.props.dispatch(populateMetadataStore(data_path));
      this.props.dispatch(populateTreeStore(data_path));
      this.props.dispatch(populateSequencesStore(data_path));
      this.props.dispatch(populateFrequenciesStore(data_path));
    }
  }
  setVirusPath(newPath) {
    const prefix = (newPath === "" || newPath[0] === "/") ? "" : "/";
    const suffix = (newPath.length && newPath[newPath.length - 1] !== "/") ? "/?" : "?";
    const url = prefix + newPath + suffix + queryString.stringify(this.state.location.query);
    window.history.pushState({}, "", url);
    this.changeRoute(newPath, this.state.location.query);
  }
  changeRoute(pathname, query) {
    this.setState({
      location: {
        pathname,
        query
      }
    });
  }
  render() {
    return (
      <div style={{margin: "0px 20px"}}>
        <Header/>
        <Flex
          style={{
            width: "100%"
          }}
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Controls changeRoute={this.changeRoute.bind(this)} location={this.state.location}/>
          <TreeView query={this.state.location.query}/>
          <Frequencies/>
          <Entropy/>
        </Flex>
        <Footer/>
      </div>
    );
  }
}

export default App;
