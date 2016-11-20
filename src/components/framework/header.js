import React from 'react';
import Flex from './flex';
import HeaderFont from "./header-font";
import MonoFont from "./mono-font";
import { connect } from "react-redux";

const returnStateNeeded = (fullStateTree) => {
  return {
    metadata: fullStateTree.metadata.metadata
  };
};
@connect(returnStateNeeded)
class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }

  createTitle() {
    const title = "nextstrain";
    const colors = ["#4377CD", "#5097BA", "#63AC9A", "#7CB879", "#9ABE5C", "#B9BC4A", "#D4B13F", "#E49938", "#E67030", "#DE3C26"];

    return title.split("").map((letter, i) => {
      return (
        <span style={{color: colors[i]}}>{letter}</span>
      )
    })
  }
  render() {
    return (
      <Flex>
        <HeaderFont size="large"> {this.createTitle()} </HeaderFont>
      </Flex>
    );
  }
}

export default Header;
// <p> Real-time tracking of <MonoFont>this.props.metadata.virus = {this.props.metadata ? this.props.metadata.virus : "loading"}</MonoFont> virus evolution </p>
