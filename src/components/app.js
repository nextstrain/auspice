import React from "react";
import { connect } from "react-redux";
import {
  populateMetadataStore,
  populateTreeStore,
  populateSequencesStore,
  populateFrequenciesStore,
  populateEntropyStore
} from "../actions";
import ChooseVirus from "./controls/choose-virus";

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
import { withRouter } from 'react-router';

@connect()
@Radium
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: false
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
    routes: React.PropTypes.array,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"

  }
  componentDidMount() {
    this.maybeFetchDataset()
  }
  componentDidUpdate() {
    this.maybeFetchDataset()
  }
  maybeFetchDataset() {
    if (this.state.latestValidParams === this.props.params.splat) {
      return;
    }

    const parsedParams = parseParams(this.props.params.splat);
    // this.setState({'dataset':parsedParams['dataset'], 'item':parsedParams['item']});
    var tmp_levels = Object.keys(parsedParams['dataset']).map((d) => parsedParams['dataset'][d]);
    tmp_levels.sort((x,y) => x[0]>y[0]);
    const data_path = tmp_levels.map(function(d){return d[1];}).join('_');
    if (parsedParams.incomplete) {
      const prefix=(parsedParams.fullsplat[0]=='/')?"":"/";
      this.props.router.push({pathname:prefix+parsedParams.fullsplat});
    }
    if (parsedParams.valid && this.state.latestValidParams !== parsedParams.fullsplat) {
      this.props.dispatch(populateMetadataStore(data_path));
      this.props.dispatch(populateTreeStore(data_path));
      this.props.dispatch(populateSequencesStore(data_path));
      this.props.dispatch(populateFrequenciesStore(data_path));
      this.setState({latestValidParams: parsedParams.fullsplat});
    }
  }
  render() {
    return (
      <div style={{
          margin: "0px 20px"
        }}>
        <Header/>
        <ChooseVirus {...this.props}/>
        <Flex
          style={{
            width: "100%"
          }}
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between">
          <Controls {...this.props}/>
          <Tree
            {...this.props.location}
            layout="radial"
          />
          <Frequencies/>
          <Entropy/>
        </Flex>
        <Footer/>
      </div>
    );
  }
}

export default withRouter(App);
