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
    visualization(
      this.props.tree.tree,
      this.props.sequences.sequences,
      this.props.frequencies.frequencies,
      null /* todo: this is vaccineStrains */
    )
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
        <div className="d3-tip se"/>
        <div className="d3-tip e"/>
        <div className="d3-tip"/>
        <div id="date-input"></div>
        <div id="legend-title"></div>
        <div id="legend"></div>
        <select id="coloring">
          <option value="region"> geographic region </option>
        </select>
        <div id="gt-color"></div>
        <div id="branchlabels"></div>
        <div id="region"></div>
        <div id="search"></div>
        <div id="straininput"></div>
        <div id="bp-ac"></div>
        <div id="bp-input"></div>
        <div id="searchinputclear"></div>
        <div id="reset"></div>
        <div className="freqplot-container"></div>
        <div className="treeplot-container" id="treeplot-container"></div>
        <div id="updated"></div>
        <div id="commit"></div>
        <svg id="treeplot"> </svg>
      </div>
    );
  }
}

export default Tree;
