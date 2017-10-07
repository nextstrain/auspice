import React from "react";
import { connect } from "react-redux";
import d3 from "d3";
// import * as globals from "../../util/globals";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import getColorScale from "../../util/getColorScale"
import drawTimeline from "./zoomTimelineD3.js"
import _ from "lodash";
// import ceil from "Math";


@connect(state => {
  return {
    nodes: state.tree.nodes,
    visibility: state.tree.visibility,
    nodeColors: state.tree.nodeColors,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy,
    colorScale: state.controls.colorScale,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
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
      height: responsive.height/2,
      padBottom: 50,
      padLeft: 15,
      padRight: 12
    };
  }


  // componentDidMount(props) {
  // }

  componentWillReceiveProps(nextProps) {
    if (nextProps.nodes[0] && nextProps.visibility && nextProps.nodeColors) {
    let tallies = this.getCounts(nextProps)
    drawTimeline(tallies.counts, tallies.colors,this.state.chartGeom.responsive.width,this.state.chartGeom.responsive.height/2)
  }
    // this.maybeComputeResponive(nextProps);
  }

  // componentDidUpdate(prevProps, prevState) {
  // }

  getCounts(props) {

    // pull all the visible tips in the tree, extract date and color value
    const all_nodes = _.zip(props.visibility, props.nodes, props.nodeColors) // [ ["visible", {node}, '#000000'] ]
    let visible_tips = []
    let all_colors = []
    _.each(all_nodes, (n)=>{
      if (n[1].hasChildren===false && n[0]==="visible") {
        visible_tips.push([n[1].attr['date'], n[2]]) // [ (1976-03-12, #000000) ]
        all_colors.push(n[2])
      }
    });

    let colors = _.uniq(all_colors)

    // determine the number of months in each bin, convert from a date to a bin index
    var parseDate = d3.time.format("%Y-%m-%d").parse;
    let monthDiff = (d1, d2) => {
        let year1 = d1.getYear()
        let year2 = d2.getYear()
        let month1 = d1.getMonth()
        let month2 = d2.getMonth()
        let numberOfMonths = (year2 - year1) * 12 + (month2 - month1) + 1;
        return numberOfMonths;
    }

    let getNBins = (absoluteMonthDiff) => {
      if (absoluteMonthDiff <= 120) {
        return absoluteMonthDiff
      } else if (absoluteMonthDiff < 1440) {
        return _.ceil(absoluteMonthDiff / 12)
      } else {
        return 120
      }}

    let absoluteDateMin = parseDate(props.absoluteDateMin)
    let absoluteDateMax = parseDate(props.absoluteDateMax)
    let absoluteMonthDiff = monthDiff(absoluteDateMin, absoluteDateMax)
    let nbins = getNBins(absoluteMonthDiff)
    let months_per_bin = _.ceil(absoluteMonthDiff / nbins)

    let date_to_month = (date) => {
      // return month as integer index, where 0 == first month in datemin
      return monthDiff(absoluteDateMin, date)
    }

    let month_to_bin = (date, months_per_bin) => {
      let month_idx = date_to_month(date)
      let bin_idx = _.ceil(month_idx / months_per_bin)
      return bin_idx
    }

    let counts = []
    let all_bins = _.range(nbins+1)
    _.forEach(all_bins, (idx)=>{
      counts[idx] = {}
      _.forEach(colors, (color)=>{
        counts[idx][color] = 0
      })
    })

    _.forEach(visible_tips, (n)=>{
      let bin_idx = month_to_bin(parseDate(n[0]), months_per_bin)
      let category = n[1]
        counts[bin_idx][category] += 1
    })

    const sumValues = obj => Object.values(obj).reduce((a, b) => a + b)
    _.forEach(all_bins, (bin)=> {
      if (!_.isEmpty(counts[bin])) {
      counts[bin]['total'] = sumValues(counts[bin])
    }
      counts[bin]['x'] = bin
    })
    return {'counts': counts, 'colors': colors}
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
