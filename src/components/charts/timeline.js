import React from "react";
import { connect } from "react-redux";
// import * as globals from "../../util/globals";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import getColorScale from "../../util/getColorScale"
import drawTimeline from "./timelineD3.js"
import _ from "lodash";
import d3 from "d3";

@connect(state => {
  return {
    nodes: state.tree.nodes,
    visibility: state.tree.visibility,
    nodeColors: state.tree.nodeColors,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy,
    colorScale: state.controls.colorScale,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
  };
})

class Timeline extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: null,
      visibility: false,
      nodeColors: null,
      browserDimensions: null,
      colorBy: null,
      chartGeom: this.getChartGeom(),
    };
  }

  getChartGeom(props) {
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: 1,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    });
    return {
      responsive,
      width: responsive.width,
      height: responsive.height,
      padBottom: 50,
      padLeft: 15,
      padRight: 12
    };
  }


  componentDidMount(props) {
  }

  componentWillReceiveProps(nextProps) {

    if (nextProps.nodes[0] && nextProps.visibility && nextProps.nodeColors) {
    let tally = this.getCounts(nextProps)
    drawTimeline(tally,this.state.chartGeom.responsive.width,this.state.chartGeom.responsive.height)
  }
    // this.maybeComputeResponive(nextProps);
  }

  // componentDidUpdate(prevProps, prevState) {
  // }

  getCounts(props) {

    const all_nodes = _.zip(props.visibility, props.nodes, props.nodeColors) // [ ["visible", {node}, '#000000'] ]
    let visible_tips = []
    _.each(all_nodes, (n)=>{
      if (n[1].hasChildren===false && n[0]==="visible") {
        visible_tips.push([n[1].attr['num_date'], n[2]])
      }
    });


    const x_axis_binsGenerator = d3.layout.histogram()  // create layout object
      .value((d) => {return d[0]})
      .bins(20)       // to use 20 bins
      .range([props.dateMin, props.dateMax])  // to cover range from dateMin to dateMax

    const x_axis_bins = x_axis_binsGenerator(visible_tips)
    console.log('x_axis_bins', x_axis_bins[1])

    // const counts = { };
    // for (const n in visible_tips) {
    //   }

    return (visible_tips)};
    // let denominator = visible_tips.length;


  drawFrequencies() {
    const frequencyChartWidth = 900;
    const frequencyChartHeight = 300;
    const bottomPadding = 45;
    const leftPadding = 80;
    const rightPadding = 80;
    const x = d3.scale.linear()
                .domain([pivots[0], pivots[pivots.length-1]]) // original array, since the x values are still mapped to that
                .range([leftPadding, frequencyChartWidth - rightPadding]);

    const y = d3.scale.linear()
                .domain([0, 1.05]) // original array, since the x values are still mapped to that
                .range([frequencyChartHeight-bottomPadding, 0]);
  }

  render() {
    return (
      <Card>
      <div id="timelineAttachPointD3"
      style={{width: this.state.chartGeom.responsive.width,
              height: this.state.chartGeom.height}}
      >
      </div>
        </Card>
    );
  }
}

export default Timeline;
