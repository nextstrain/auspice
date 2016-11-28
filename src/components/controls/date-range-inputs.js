import React from "react";
import { defaultDateSliderFraction, defaultDateRange } from "../../util/globals";
import DatePicker from 'react-datepicker';
import moment from 'moment';
import _ from 'lodash';

import Slider from './slider';

moment.updateLocale('en', {
    longDateFormat : {
        L: "DD/MM/YYYY",
        l: "D/M/YYYY"
    }
});

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
    style: React.PropTypes.object
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

  numericDate(secSinceUnix) {
    const res = 1970 + (secSinceUnix / 365.25 / 24 / 3600 / 1000);
    return res;
  }

  numericToUnix(numdate) {
    const res = (numdate - 1970) * 365.25 * 24 * 3600 * 1000;
    return res;
  }

  setDateQueryParam(newRange) {
    const newQuery = Object.assign({}, this.props.location.query,
                                   {dmin: newRange.min, dmax:newRange.max});
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }


  updateDateRange(ref, m) {
    let newRange;
    if (ref === "date_min") {
      newRange = { min: this.numericDate(m.valueOf()),
                   max: (this.props.location.query.dmax || this.numericDate(moment().valueOf())) /* present */ };
    } else {
      newRange = { min: (this.props.location.query.dmin
                        || this.numericDate(moment().subtract(12, "years").valueOf())),
                   max: this.numericDate(m.valueOf()) };
    }
    this.setDateQueryParam(newRange);
  }
  updateSlider(values) {
    // {values} is an array of unix timestamps
    // [timestampStart, timestampEnd]
    const newRange = {min: values[0], max: values[1]};
    this.setDateQueryParam(newRange);
  }
  render() {
    /*
    this shows a string of text above the slider

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

      this shows an axis below the sliders
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

    */

    /* strainMinDate is the dataset, selectedMinDate is the user option */
    /* abstract these dates into the reducer so they come in as props and are global state */
    const absoluteMin = this.numericDate(moment().subtract(defaultDateRange, "years").valueOf()); // replace 12 with duration
    const absoluteMax = this.numericDate(moment().valueOf()); // present
    const selectedMin = (+this.props.location.query.dmin
                         || this.numericDate(moment().subtract(defaultDateRange*defaultDateSliderFraction, "years").valueOf()));
    const selectedMax = +this.props.location.query.dmax || absoluteMax;
    const datePickerMin = (this.props.location.query.dmin
                           ? moment(this.numericToUnix(+this.props.location.query.dmin))
                           : moment(this.numericToUnix(absoluteMin)));
    const datePickerMax = (this.props.location.query.dmax
                           ? moment(this.numericToUnix(+this.props.location.query.dmax))
                           : moment(this.numericToUnix(absoluteMax)));

    if (!(this.props.location.query.dmax && this.props.location.query.dmin) ){
      this.setDateQueryParam({"min":selectedMin, "max":selectedMax});
      return null;
    }
    return (
      <div>
        <div style={{width: 250}}>
        <Slider
          min={absoluteMin}
          max={absoluteMax}
          defaultValue={[absoluteMin, absoluteMax]}
          value={[selectedMin, selectedMax]}
          onChange={this.updateSlider.bind(this)}
          withBars />
        </div>
        <div style={{height: 10}}> </div>
        {/*
          the CSS for this is in index.html
          docs: https://hacker0x01.github.io/react-datepicker/
        */}
        <div style={{width: 250}}>
          <DatePicker
            selected={datePickerMin}
            onChange={this.updateDateRange.bind(this, "date_min")}
          />
          <DatePicker
            selected={datePickerMax}
            onChange={this.updateDateRange.bind(this, "date_max")}
          />
        </div>
      </div>
    );
  }
}

export default DateRangeInputs;

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

let time_back = 1.0;
let dateValues;
let earliestDate;
let dateScale;
let niceDateScale;
let counterData;

let globalDate;

if (typeof globalDate === "undefined") {
  globalDate = new Date();
}

const counterData = {};
const startDate = new Date(globalDate);
const earliestDate = new Date(globalDate);
const ymd_format = d3.time.format("%Y-%m-%d");

counterData.date = globalDate;
counterData.x = dateScale(globalDate);
startDate.setDate(startDate.getDate() - (time_window * 365.25));
counterData.x2 = dateScale(startDate);
earliestDate.setDate(earliestDate.getDate() - (time_back * 365.25));

if (typeof time_window !== "undefined") {
  time_back = time_window;
}
if (typeof fullDataTimeWindow !== "undefined") {
  time_back = fullDataTimeWindow;
}

dateScale = d3.time.scale()
  .domain([earliestDate, globalDate])
  .range([5, 205])
  .clamp([true]);

niceDateScale = d3.time.scale()
  .domain([earliestDate, globalDate])
  .range([5, 205])
  .clamp([true])
  .nice(d3.time.month);

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


  d.date = dateScale.invert(d3.event.x);
  d.x = dateScale(d.date);
  const startDate = new Date(d.date);
  startDate.setDate(startDate.getDate() - (time_window * 365.25));
  d.x2 = dateScale(startDate);

    globalDate = d.date;

    calcNodeAges(time_window);
//	treeplot.selectAll(".link")
//		.style("stroke", function(d){return "#ccc";})


const draggedMin = (d) => {
  d.date = dateScale.invert(d3.event.x);
  d.x2 = dateScale(d.date);

  // days * hours * minutes * seconds * milliseconds
  const oneYear = 365.25 * 24 * 60 * 60 * 1000;
  time_window = (globalDate.getTime() - d.date.getTime()) / oneYear;

  calcNodeAges(time_window);

};

  /* ON DRAG END ----

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


  if ((typeof tip_labels !== "undefined") && (tip_labels)) {
    nDisplayTips = displayRoot.fullTipCount;
    treeplot.selectAll(".tipLabel")
      .transition().duration(1000)
      .style("font-size", tipLabelSize);
  }
  ---- ON DRAG END */
