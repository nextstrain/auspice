import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import { withRouter } from "react-router";
import DatePicker from 'react-datepicker';
import moment from 'moment';
import _ from 'lodash';

import Slider from './slider';

@connect()
@Radium
class DateRangeInputs extends React.Component {
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

  // called after either <DatePicker /> changes

  createQueryParams(newRange) {
    return Object.assign({}, this.props.query, {
      dmin: newRange.min,
      dmax: newRange.max
    });
  }
  updateDateRange(ref, m) {
    let newRange;
    console.log(m)
    if (ref === 'date_min') {
      newRange = { min: m.valueOf(), max: this.props.location.query.dmax || moment().valueOf() /* present */ };
    } else {
      newRange = { min: this.props.location.query.dmin || moment().subtract(12, "years").valueOf(), max: m.valueOf() };
    }
    this.props.router.push({
      pathname: this.props.pathname,
      query: this.createQueryParams(newRange)
    });
  }
  updateSlider(values) {
    // {values} is an array of unix timestamps
    // [timestampStart, timestampEnd]
    const newRange = {min: values[0], max: values[1]};
    // set url
    this.props.router.push({
      pathname: this.props.pathname,
      query: this.createQueryParams(newRange)
    });
  }
  render() {
    /* strainMinDate is the dataset, selectedMinDate is the user option */
    /* abstract these dates into the reducer so they come in as props and are global state */
    const absoluteMin = moment().subtract(12, "years").valueOf(); // replace 12 with duration
    const absoluteMax = moment().valueOf(); // present
    const selectedMin = +this.props.location.query.dmin || absoluteMin;
    const selectedMax = +this.props.location.query.dmax || absoluteMax;
    const datePickerMin = this.props.location.query.dmin ? moment(+this.props.location.query.dmin) : moment(absoluteMin);
    const datePickerMax = this.props.location.query.dmax ? moment(+this.props.location.query.dmax) : moment(absoluteMax);
    return (
      <div>
        <Slider
          min={absoluteMin}
          max={absoluteMax}
          defaultValue={[absoluteMin, absoluteMax]}
          value={[selectedMin, selectedMax]}
          onChange={this.updateSlider.bind(this)}
          withBars />
        <div style={{height: 10}}> </div>
        {/*
          the CSS for this is in index.html
          docs: https://hacker0x01.github.io/react-datepicker/
        */}
        <DatePicker
          selected={datePickerMin}
          onChange={this.updateDateRange.bind(this, 'date_min')} />
        <DatePicker
          selected={datePickerMax}
          onChange={this.updateDateRange.bind(this, 'date_max')} />
      </div>
    );
  }
}

export default withRouter(DateRangeInputs);


// dateValues = nodes.filter((d) => {
//   return (typeof d.date === 'string') & (typeof vaccineChoice[d.strain] === "undefined") & (typeof reference_viruses[d.strain] === "undefined");
// }).map((d) => {
//   return new Date(d.date);
// });
//
// let time_back = 1.0;
// if (typeof time_window !== "undefined") {
//   time_back = time_window;
// }
// if (typeof fullDataTimeWindow !== "undefined") {
//   time_back = fullDataTimeWindow;
// }
//
// var earliestDate = new Date(globalDate);
// earliestDate.setDate(earliestDate.getDate() - (time_back * 365.25));
//
// dateScale = d3.time.scale()
//   .domain([earliestDate, globalDate])
//   .range([5, 205])
//   .clamp([true]);
//
// niceDateScale = d3.time.scale()
//   .domain([earliestDate, globalDate])
//   .range([5, 205])
//   .clamp([true])
//   .nice(d3.time.month);
//
// counterData = {};
// counterData.date = globalDate;
// counterData.x = dateScale(globalDate);
// const startDate = new Date(globalDate);
// startDate.setDate(startDate.getDate() - (time_window * 365.25));
// counterData.x2 = dateScale(startDate);


/*********************************
**********************************
**********************************
**********************************
** Date
**********************************
**********************************
**********************************
*********************************/
/*
const ymd_format = d3.time.format("%Y-%m-%d");
let dateValues;
let earliestDate;
let dateScale;
let niceDateScale;
let counterData;

const adjust_freq_by_date = () => {
  calcTipCounts(rootNode);
  const tipCount = rootNode.tipCount;
  nDisplayTips = displayRoot.tipCount;
  nodes.forEach((d) => {
    d.frequency = (d.tipCount) / tipCount;
  });
};

var drag = d3.behavior.drag()
.on("drag", dragged)
.on("dragstart", () => {
  d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
  d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
  d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
  d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
})
.on("dragend", () => {
  d3.selectAll(".date-input-text").style("fill", "#CCC");
  d3.selectAll(".date-input-marker").style("fill", "#CCC");
  d3.selectAll(".date-input-window").style("stroke", "#CCC");
  d3.selectAll(".date-input-edge").style("stroke", "#CCC");
  dragend();
});

const dragMin = d3.behavior.drag()
.on("drag", draggedMin)
.on("dragstart", () => {
  d3.selectAll(".date-input-text").style("fill", "#5DA8A3");
  d3.selectAll(".date-input-marker").style("fill", "#5DA8A3");
  d3.selectAll(".date-input-window").style("stroke", "#5DA8A3");
  d3.selectAll(".date-input-edge").style("stroke", "#5DA8A3");
})
.on("dragend", () => {
  d3.selectAll(".date-input-text").style("fill", "#CCC");
  d3.selectAll(".date-input-marker").style("fill", "#CCC");
  d3.selectAll(".date-input-window").style("stroke", "#CCC");
  d3.selectAll(".date-input-edge").style("stroke", "#CCC");
  dragend();
});


const calcNodeAges = (tw) => {
  tips.forEach((d) => {
    const date = new Date(d.date.replace(/XX/g, "01"));
    const oneYear = 365.25 * 24 * 60 * 60 * 1000; // days*hours*minutes*seconds*milliseconds
    const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;
    d.diff = diffYears;
    if (d.diff > 0 && d.diff < tw) {
      d.current = true;
    } else {
      d.current = false;
    }
    for (let k in restrictTo) {
      if (d[k] !== restrictTo[k] && restrictTo[k] !== "all") {
        d.current = false;
      }
    }
  });
};

function dragged(d) {

  d.date = dateScale.invert(d3.event.x);
  d.x = dateScale(d.date);
  const startDate = new Date(d.date);
  startDate.setDate(startDate.getDate() - (time_window * 365.25));
  d.x2 = dateScale(startDate);

  d3.selectAll(".date-input-text")
    .attr("dx", (dd) => {return 0.5 * dd.x;})
    .text((dd) => {
      const format = d3.time.format("%Y %b %-d");
      return format(dd.date);
    });
  d3.selectAll(".date-input-marker")
    .attr("cx", (dd) => {
      return dd.x;
    });
  d3.selectAll(".date-input-window")
    .attr("x1", (dd) => {return dd.x;})
    .attr("x2", (dd) => {return dd.x2;});
  d3.selectAll(".date-input-edge")
    .attr("x1", (dd) => {return dd.x2;})
    .attr("x2", (dd) => {return dd.x2;});

    globalDate = d.date;

    calcNodeAges(time_window);
//	treeplot.selectAll(".link")
//		.style("stroke", function(d){return "#ccc";})

treeplot.selectAll(".tip")
    .style("visibility", tipVisibility);
//		.style("fill", "#CCC")
//		.style("stroke", "#AAA");

treeplot.selectAll(".vaccine")
    .style("visibility", (dd) => {
      const date = new Date(dd.choice);
      const oneYear = 365.25 * 24 * 60 * 60 * 1000; // days*hours*minutes*seconds*milliseconds
      const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;

      if (diffYears > 0) {
        return "visible";
      } else {
        return "hidden";
      }
    });

}

const draggedMin = (d) => {
  d.date = dateScale.invert(d3.event.x);
  d.x2 = dateScale(d.date);

  // days * hours * minutes * seconds * milliseconds
  const oneYear = 365.25 * 24 * 60 * 60 * 1000;
  time_window = (globalDate.getTime() - d.date.getTime()) / oneYear;

  d3.selectAll(".date-input-window")
    .attr("x2", (dd) => {return dd.x2;});
  d3.selectAll(".date-input-edge")
    .attr("x1", (dd) => {return dd.x2;})
    .attr("x2", (dd) => {return dd.x2;});

  calcNodeAges(time_window);

  treeplot.selectAll(".tip")
    .style("visibility", tipVisibility);

  treeplot.selectAll(".vaccine")
    .style("visibility", (dd) => {
      const date = new Date(dd.choice);

      const diffYears = (globalDate.getTime() - date.getTime()) / oneYear;

      if (diffYears > 0) {
        return "visible";
      } else {
        return "hidden";
      }
    });
};

const dragend = () => {
  const num_date = globalDate / 1000 / 3600 / 24 / 365.25 + 1970;
  //	updateColorDomains(num_date);
  //	initHIColorDomain();
  for (let ii = 0; ii < rootNode.pivots.length - 1; ii++) {
    if (rootNode.pivots[ii] < num_date && rootNode.pivots[ii + 1] >= num_date) {
      freq_ii = Math.max(dfreq_dn, ii + 1);
    }
  }

  calcNodeAges(time_window);
  adjust_coloring_by_date();
  adjust_freq_by_date();

  if (typeof calcDfreq === "function") {
    calcDfreq(rootNode, freq_ii);
  }

  if (colorBy === "genotype") {
    colorByGenotype();
  }

  if ((colorBy === "date")||(colorBy === "cHI")) {
    removeLegend();
    makeLegend();
  }

  treeplot.selectAll(".link")
    .transition().duration(500)
    .attr("points", branchPoints)
    .style("stroke-width", branchStrokeWidth)
    .style("stroke", branchStrokeColor);

  treeplot.selectAll(".tip")
    .transition().duration(500)
    .style("visibility", tipVisibility)
    .style("fill", tipFillColor)
    .style("stroke", tipStrokeColor);


  if ((typeof tip_labels !== "undefined") && (tip_labels)) {
    nDisplayTips = displayRoot.fullTipCount;
    treeplot.selectAll(".tipLabel")
      .transition().duration(1000)
      .style("font-size", tipLabelSize);
  }
};

const date_init = () => {


  d3.select("#date-input")
    .attr("width", 240)
    .attr("height", 65);

  const counter = d3.select("#date-input").selectAll(".date-input-text")
    .data([counterData])
    .enter()
    .append("text")
    .attr("class", "date-input-text")
    .attr("text-anchor", "left")
    .attr("dx", (d) => { return 0.5 * d.x; })
    .attr("dy", "1.0em")
    .text((d) => {
      const format = d3.time.format("%Y %b %-d");
      return format(d.date);
    })
    .style("cursor", "pointer")
    .call(drag);

  const customTimeFormat = d3.time.format.multi([
    [".%L", (d) => { return d.getMilliseconds(); }],
    [":%S", (d) => { return d.getSeconds(); }],
    ["%I:%M", (d) => { return d.getMinutes(); }],
    ["%I %p", (d) => { return d.getHours(); }],
    ["%a %d", (d) => { return d.getDay() && d.getDate() !== 1; }],
    ["%b %d", (d) => { return d.getDate() !== 1; }],
    ["%b", (d) => { return d.getMonth(); }],
    ["%Y", (d) => { return true; }]
  ]);

  const dateAxis = d3.svg.axis()
    .scale(niceDateScale)
    .orient("bottom")
    .ticks(5)
    .tickFormat(customTimeFormat)
    .outerTickSize(2)
    .tickPadding(8);

  d3.select("#date-input").selectAll(".date-input-axis")
    .data([counterData])
    .enter()
    .append("g")
    .attr("class", "date-input-axis")
    .attr("transform", "translate(0,35)")
    .call(dateAxis);

  const window = d3.select("#date-input").selectAll(".date-input-window")
    .data([counterData])
    .enter()
    .append("line")
    .attr("class", "date-input-window")
    .attr("x1", (d) => { return d.x; })
    .attr("x2", (d) => { return d.x2; })
    .attr("y1", 35)
    .attr("y2", 35)
    .style("stroke", "#CCC")
    .style("stroke-width", 5);

  const edge = d3.select("#date-input").selectAll(".date-input-edge")
    .data([counterData])
    .enter()
    .append("line")
    .attr("class", "date-input-edge")
    .attr("x1", (d) => { return d.x2; })
    .attr("x2", (d) => { return d.x2; })
    .attr("y1", 30)
    .attr("y2", 40)
    .style("stroke", "#CCC")
    .style("stroke-width", 3)
    .style("cursor", "pointer")
    .call(dragMin);

  const marker = d3.select("#date-input").selectAll(".date-input-marker")
    .data([counterData])
    .enter()
    .append("circle")
    .attr("class", "date-input-marker")
    .attr("cx", (d) => {return d.x; })
    .attr("cy", 35)
    .attr("r", 6)
    .style("fill", "#CCC")
    .style("stroke", "#777")
    .style("cursor", "pointer")
    .call(drag);

};
*/
