import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
// import Flex from './framework/flex';
import { connect } from 'react-redux';
// import { FOO } from '../actions';
import { visualization } from "../visualization/visualization";

const returnStateNeeded = (fullStateTree) => {
  return {
    metadata: fullStateTree.metadata,
    tree: fullStateTree.tree,
    sequences: fullStateTree.sequences,
    frequencies: fullStateTree.frequencies
  }
}

@connect(returnStateNeeded)
@Radium
class Tree extends React.Component {
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
  static defaultProps = {
    // foo: "bar"
  }
  componentDidMount() {
    visualization()
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <p> tree </p>
        <svg id="treemap"> </svg>
      </div>
    );
  }
}

export default Tree;
