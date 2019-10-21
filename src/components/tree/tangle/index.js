/* eslint-disable space-infix-ops */
import React from "react";
import { select } from "d3-selection";
import 'd3-transition';

const makeTipPathGenerator = (props) => (idxs) => {
  const tip1 = props.leftNodes[idxs[0]].shell;
  const tip2 = props.rightNodes[idxs[1]].shell;
  // return `M ${tip1.xTip},${tip1.yTip} L ${(props.width + props.spaceBetweenTrees) / 2 + tip2.xTip},${tip2.yTip}`;
  return `M ${tip1.xTip},${tip1.yTip} H ${props.width/2 - props.spaceBetweenTrees/2} L ${props.width/2 + props.spaceBetweenTrees/2},${tip2.yTip} H ${props.width/2 + props.spaceBetweenTrees/2 + tip2.xTip}`;
};

class Tangle extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      left: 0,
      top: 31,
      lookup: undefined,
      drawn: false
    };
    this.timeout = false;
  }
  shouldComponentUpdate(nextProps) {
    return (
      this.props.width !== nextProps.width ||
      this.props.height !== nextProps.height ||
      this.props.leftTreeName !== nextProps.leftTreeName ||
      this.props.rightTreeName !== nextProps.rightTreeName
    );
  }
  drawLines(props) {
    if (!props) props = this.props; // eslint-disable-line
    const thickness = props.lookup.length > 750 ? 0.25 : props.lookup.length > 100 ? 0.5 : 1;
    select(this.d3ref).selectAll("*").remove();
    const makeTipPath = makeTipPathGenerator(props);
    select(this.d3ref)
      .selectAll(".tangleLine")
      .data(props.lookup)
      .enter()
      .append("path")
      .attr("class", "tangleLine")
      .attr("d", makeTipPath)
      .attr("stroke-width", thickness)
      .attr("stroke", (idxs) => props.colors[idxs[0]])
      .attr("fill", 'none');
  }
  // transitionColors(newColors) {
  //   select(this.d3ref).selectAll(".tangleLine")
  //     .transition().duration(500)
  //     .attr("stroke", (idxs) => newColors[idxs[0]]);
  // }
  // transitionPath(props) {
  //   const makeTipPath = makeTipPathGenerator(props);
  //   select(this.d3ref).selectAll(".tangleLine")
  //     .transition().duration(500)
  //     .attr("d", makeTipPath);
  // }
  componentWillReceiveProps(nextProps) {
    if (!this.state.drawn && nextProps.rightNodes[0].shell) {
      this.drawLines(nextProps);
      this.setState({drawn: true});
    }
  }
  componentDidMount() {
    if (!this.state.drawn && this.props.rightNodes[0].shell) {
      this.drawLines(this.props);
      this.setState({drawn: true});
    }
  }
  /* CDU is used to update phylotree when the SVG size _has_ changed (and this is why it's in CDU not CWRP) */
  componentDidUpdate(prevProps) {
    if (this.props.width !== prevProps.width || this.props.height !== prevProps.height) {
      if (this.timeout) {
        window.clearTimeout(this.timeout);
      } else {
        select(this.d3ref).selectAll(".tangleLine").remove();
      }
      this.timeout = window.setTimeout(this.drawLines.bind(this), 1000);
    }
  }
  render() {
    const textStyles = {position: "absolute", top: 5, zIndex: 100, fontSize: 16, color: "#000", fontWeight: 500};
    const lefts = [this.props.width/2 - this.props.spaceBetweenTrees/2, this.props.width/2 + this.props.spaceBetweenTrees/2];
    return (
      <div id="TangleContainer">
        <div id="MainTreeTitle" style={{...textStyles, left: lefts[0], transform: "translateX(-100%)"}}>
          {this.props.leftTreeName}
        </div>
        <div id="SecondTreeTitle" style={{...textStyles, left: lefts[1]}}>
          {this.props.rightTreeName}
        </div>
        <div
          id="TangleSvgContainer"
          style={{position: "absolute", left: this.state.left, top: this.state.top, zIndex: 100, pointerEvents: "none"}}
        >
          <svg
            id="Tangle"
            style={{cursor: "default", width: this.props.width, height: this.props.height}}
            ref={(c) => {this.d3ref = c;}}
          />
        </div>
      </div>
    );
  }
}

export default Tangle;
