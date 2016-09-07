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
import shouldFetchDataset from "../util/shouldFetchDataset";

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
    const query = this.props.location.query;
    const config = shouldFetchDataset(this.props.params.splat);
    console.log(config);
    var tmp_levels = Object.keys(config['path']).map((d) => config['path'][d]);
    tmp_levels.sort((x,y) => x[1]>y[1]);
    const data_path = tmp_levels.map(function(d){return d[0];}).join('_');
    console.log('tmp_levels',tmp_levels);
    console.log('data_path',data_path);
    console.log('goit here');
    if (config.valid){
      console.log('got here');
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
        <ChooseVirus {...this.props.location}/>
        <Flex
          style={{
            width: "100%"
          }}
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="space-between">
          <Controls/>
          <Tree/>

        </Flex>
        <Footer/>
      </div>
    );
  }
}

export default App;
