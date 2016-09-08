import React from "react";
import { connect } from "react-redux";
import {
  populateMetadataStore,
  populateTreeStore,
  populateSequencesStore,
  populateFrequenciesStore
} from "../actions";
import ChooseVirus from "./controls/choose-virus";

import Radium from "radium";
import _ from "lodash";
// import {Link} from "react-router";
// import Awesome from "react-fontawesome";
import Flex from "./framework/flex";
import Header from "./framework/header";
import Controls from "./controls/controls";
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
    const parsedParams = parseParams(this.props.params.splat);
    console.log(parsedParams);
    // this.setState({'dataset':parsedParams['dataset'], 'item':parsedParams['item']});
    var tmp_levels = Object.keys(parsedParams['dataset']).map((d) => parsedParams['dataset'][d]);
    tmp_levels.sort((x,y) => x[0]>y[0]);
    const data_path = tmp_levels.map(function(d){return d[1];}).join('_');
    console.log('maybeFetchDataset:', parsedParams, data_path);
    if (parsedParams.incomplete){
      console.log('maybeFetchDataset',parsedParams.fullsplat);
      const prefix=(parsedParams.fullsplat[0]=='/')?"":"/";
      this.props.router.push({pathname:prefix+parsedParams.fullsplat});
  drawTreeIfData() {
    const p = this.props;
    let markup;

    if (
      p.metadata.metadata &&
      p.tree.tree &&
      p.sequences.sequences &&
      p.frequencies.frequencies
    ) {
      markup = (<Tree {...this.props.location}/>);
    }
    if (parsedParams.valid){
      this.props.dispatch(populateMetadataStore(data_path));
      this.props.dispatch(populateTreeStore(data_path));
      this.props.dispatch(populateSequencesStore(data_path));
      this.props.dispatch(populateFrequenciesStore(data_path));
    }
  }
  render() {
    console.log('app', this.props)
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
          <Controls/>
          {this.drawTreeIfData()}
        </Flex>
        <Footer/>
      </div>
    );
  }
}

export default withRouter(App);
