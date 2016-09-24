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
import Tree from "./tree/tree";
import Footer from "./framework/footer";
import parseParams from "../util/parseParams";
import { withRouter } from "react-router";
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
    // Richard please take a look at the necessity for this second check adding "/", seems to require it.
    if (this.state.latestValidParams === this.state.location.pathname ||  this.state.latestValidParams === this.state.location.pathname + "/") {
      return;
    }

    const parsedParams = parseParams(this.state.location.pathname);
    // this.setState({'dataset':parsedParams['dataset'], 'item':parsedParams['item']});
    const tmp_levels = Object.keys(parsedParams.dataset).map((d) => parsedParams.dataset[d]);
    tmp_levels.sort((x, y) => x[0] > y[0]);
    const data_path = tmp_levels.map( function (d) {return d[1];}).join("_");
    if (parsedParams.incomplete) {
      const prefix = (parsedParams.fullsplat[0] === "/") ? "" : "/";
      // Richard take a look - this doesn't work as it should (ie., if incomplete), check parseParams function?
      window.history.pushState({}, '', prefix+parsedParams.fullsplat)
      // call changeRoute function
    }
    if (parsedParams.valid && this.state.latestValidParams !== parsedParams.fullsplat) {
      this.props.dispatch(populateMetadataStore(data_path));
      this.props.dispatch(populateTreeStore(data_path));
      this.props.dispatch(populateSequencesStore(data_path));
      this.props.dispatch(populateFrequenciesStore(data_path));
      this.setState({latestValidParams: parsedParams.fullsplat});
    }
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
          <Tree query={this.state.location.query}/>
          <Frequencies/>
          <Entropy/>
        </Flex>
        <Footer/>
      </div>
    );
  }
}

export default withRouter(App);
