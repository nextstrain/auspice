import React from 'react';
import Radium from 'radium';
import _ from 'lodash';
// import Flex from './framework/flex';
import { connect } from 'react-redux';
// import { FOO } from '../actions';
import { visualization } from "../visualization/visualization";
import d3 from "d3";
import Link from "./tree-link";
import Node from "./tree-node";
import { processNodes } from "../util/processNodes";

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
      /* static for now, then hand rolled version of https://github.com/digidem/react-dimensions */
      const width = 1000;
      const margin = 20;

      const tree = d3.layout.tree()
        .size([this.treePlotHeight(width), width]);
      const nodes = processNodes(tree.nodes(props.tree.tree))
      const links = tree.links(nodes);

      const xValues = nodes.map((d) => {
        return +d.xvalue;
      });

      const yValues = nodes.map((d) => {
        return +d.yvalue;
      });

    this.state = {
      width: width,
      nodes: nodes,
      links: links,
      xScale: d3.scale.linear().domain([d3.min(xValues), d3.max(xValues)]).range([margin, width - margin]),
      yScale: d3.scale.linear().domain([d3.min(yValues), d3.max(yValues)]).range([margin, this.treePlotHeight(width) - margin])
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
    // visualization(
    //   this.props.tree.tree,
    //   this.props.sequences.sequences,
    //   this.props.frequencies.frequencies,
    //   null /* todo: this is vaccineStrains */
    // )
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  treePlotHeight (width) {
    return 400 + 0.30 * width;
  }
  drawNodes(nodes) {
    const nodeComponents = nodes.map((node, index) => {
      return (
        <Node
          key={index}
          k={index}
          hasChildren={node.children ? true : false}
          name={node.name}
          x={this.state.xScale(node.xvalue)}
          y={this.state.yScale(node.yvalue)}/>
      );
    });
    return nodeComponents;
  }
  drawLinks(links) {
    const linkComponents = links.map((link, index) => {
      return (
        <Link
          xscale={this.state.xScale}
          yscale={this.state.yScale}
          datum={link}
          key={index} />
      );
    });
    return linkComponents;
  }
  render() {
    const styles = this.getStyles();
    console.log("tree state", this.state)
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
        <svg
          height={this.treePlotHeight(this.state.width)}
          width={this.state.width}
          id="treeplot"
          style={{
            border: "1px solid rgb(130,130,130)"
          }}>
          {this.drawNodes(this.state.nodes)}
          {this.drawLinks(this.state.links)}
        </svg>
      </div>
    );
  }
}

export default Tree;
