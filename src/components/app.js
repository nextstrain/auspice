import React from "react";
import { connect } from "react-redux";
// import {  } from "../actions";

import Radium from "radium";
import _ from "lodash";
// import {Link} from "react-router";
// import Awesome from "react-fontawesome";
import Flex from "./framework/flex";
import Header from "./header";
import Controls from "./controls";
import Tree from "./tree";
import Footer from "./footer";


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

  }

  render() {
    return (
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        direction="column"
        style={{
          height: "100%",
          margin: 40
        }}>
        <Header/>
        <Flex
          style={{
            width: "100%"
          }}
          wrap="wrap"
          justifyContent="space-between">
          <Controls/>
          <Tree/>
        </Flex>
        <Footer/>
      </Flex>
    );
  }
}

export default App;
