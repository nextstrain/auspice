import React from "react";
import Radium from "radium";
import d3 from "d3";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";


// @connect(state => {
//   return state.FOO;
// })
@Radium
class TreeLink extends React.Component {
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
  getStyles() {
    return {
      base: {

      }
    };
  }
  setupFreqScale() {
    return d3.scale.sqrt().domain([0, 1]).range([1, 10]);
  }
  branchPoints (d) {
    const freqScale = this.setupFreqScale();

    const mod = 0.5 * freqScale(d.target.frequency) - freqScale(0);
    return (d.source.x - mod).toString() + "," + d.source.y.toString() + " "
      + (d.source.x - mod).toString() + "," + d.target.y.toString() + " "
      + (d.target.x).toString() + "," + d.target.y.toString();
  };
  render() {
    const styles = this.getStyles();

    return (
      <polyline
        points={this.branchPoints(this.props.datum)}
        style={{
          fill: "none",
          stroke: "darkgrey",
          strokeWidth: ".4px"
        }}></polyline>
    );
  }
}

export default TreeLink;

// let link = treeplot.selectAll(".link")
//   .data(links)
//   .enter().append("polyline")
//   .attr("class", "link")
//   .style("stroke-width", branchStrokeWidth)
//   .style("stroke", branchStrokeColor)
//   .style("stroke-linejoin", "round")
//   .style("cursor", "pointer")
//   .style("fill", "none")
//   .on("mouseover", (d) => {
//     if ((colorBy !== "genotype") & (typeof addClade !== "undefined")) {
//       clade_freq_event = setTimeout(addClade, 1000, d);
//     }
//   })
//   .on("mouseout", (d) => {
//     // linkTooltip.hide(d);
//     if (typeof addClade !== "undefined") {
//       clearTimeout(clade_freq_event);
//     };
//   })
//   .on("click", zoom);
