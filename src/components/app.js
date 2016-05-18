import React from "react";
import { connect } from "react-redux";
// import {  } from "../actions";

import Radium from "radium";
import _ from "lodash";
// import {Link} from "react-router";
// import Awesome from "react-fontawesome";
import Flex from "./framework/flex";


@connect((state) => {
  return state.user;
})
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
    virus: {
      name: "[virus not loaded]"
    }
  }

  render() {
    return (
      <Flex alignItems="flex-start" style={{height: "100%"}}>
        <p> nextstrain </p>
        <p> Real-time tracking of {this.props.virus.name} virus evolution </p>
      </Flex>
    );
  }
}

export default App;
