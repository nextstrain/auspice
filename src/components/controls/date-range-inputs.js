import React from "react";
import DatePicker from "react-datepicker";
import moment from "moment";
// import _ from "lodash";
import Slider from "./slider";
import { connect } from "react-redux";
import { controlsWidth } from "../../util/globals";
import { modifyURLquery } from "../../util/urlHelpers";
import { changeDateFilter } from "../../actions/treeProperties";

moment.updateLocale("en", {
  longDateFormat: {
    L: "YYYY-MM-DD"
  }
});

@connect((state) => {
  return {
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax
  };
})
class DateRangeInputs extends React.Component {
  constructor(props) {
    super(props);
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    dateMin: React.PropTypes.string.isRequired,
    dateMax: React.PropTypes.string.isRequired,
    absoluteDateMin: React.PropTypes.string.isRequired,
    absoluteDateMax: React.PropTypes.string.isRequired,
    dispatch: React.PropTypes.func.isRequired
  }
  getStyles() {
    return {
      base: {

      }
    };
  }

  numericToCalendar(numDate) {
    const unixDate = (numDate - 1970) * 365.2425 * 24 * 3600; // number of seconds since 1970
    return moment.unix(unixDate).format("YYYY-MM-DD");
  }

  calendarToNumeric(calDate) {
    const unixDate = moment(calDate).unix();  // number of seconds since 1970
    return 1970 + (unixDate / 365.2425 / 24 / 3600);
  }


  updateFromPicker(ref, momentDate) {
    // a momentDate is received from DatePicker
    let newRange;
    if (ref === "updateDateMin") {
      newRange = { min: momentDate.format("YYYY-MM-DD"),
                   max: this.props.dateMax };
      this.props.dispatch(changeDateFilter(newRange.min, null));
      modifyURLquery(this.context.router, {dmin: newRange.min}, true);
    } else if (ref === "updateDateMax") {
      newRange = { min: this.props.dateMin,
                   max: momentDate.format("YYYY-MM-DD") };
      this.props.dispatch(changeDateFilter(null, newRange.max));
      modifyURLquery(this.context.router, {dmax: newRange.max}, true);
    }
  }

  updateFromSlider(numDateValues) {
    // {numDateValues} is an array of numDates received from Slider
    // [numDateStart, numDateEnd]
    const newRange = {min: this.numericToCalendar(numDateValues[0]),
      max: this.numericToCalendar(numDateValues[1])};
    if (this.props.dateMin !== newRange.min && this.props.dateMax === newRange.max) { // update min
      this.props.dispatch(changeDateFilter(newRange.min, null));
      modifyURLquery(this.context.router, {dmin: newRange.min}, true);
    } else if (this.props.dateMin === newRange.min &&
               this.props.dateMax !== newRange.max) { // update max
      this.props.dispatch(changeDateFilter(null, newRange.max));
      modifyURLquery(this.context.router, {dmax: newRange.max}, true);
    } else if (this.props.dateMin !== newRange.min &&
               this.props.dateMax !== newRange.max) { // update both
      this.props.dispatch(changeDateFilter(newRange.min, newRange.max));
      modifyURLquery(this.context.router, {dmin: newRange.min, dmax: newRange.max}, true);
    }
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

    const absoluteMin = this.props.absoluteDateMin;
    const absoluteMax = this.props.absoluteDateMax;
    const selectedMin = this.props.dateMin;
    const selectedMax = this.props.dateMax;

    const absoluteMinNumDate = this.calendarToNumeric(absoluteMin);
    const absoluteMaxNumDate = this.calendarToNumeric(absoluteMax);
    const selectedMinNumDate = this.calendarToNumeric(selectedMin);
    const selectedMaxNumDate = this.calendarToNumeric(selectedMax);

    return (
      <div>
        <div style={{width: controlsWidth}}>
        <Slider                                       // numDates are handed to Slider
          min={absoluteMinNumDate}
          max={absoluteMaxNumDate}
          defaultValue={[absoluteMinNumDate, absoluteMaxNumDate]}
          value={[selectedMinNumDate, selectedMaxNumDate]}
          onChange={this.updateFromSlider.bind(this)}
          minDistance={0.5}                           // minDistance is in years
          pearling
          withBars/>
        </div>
        <div style={{height: 5}}> </div>
        {/*
          the CSS for this is in index.html
          docs: https://hacker0x01.github.io/react-datepicker/
        */}
        <div style={{width: controlsWidth}}>
          <DatePicker                               // momentDates are handed to DatePicker
            dateFormat="YYYY/MM/DD"
            selected={moment(selectedMin)}
            onChange={this.updateFromPicker.bind(this, "updateDateMin")}
          />
          <DatePicker                               // momentDates are handed to DatePicker
            dateFormat="YYYY/MM/DD"
            className="right-datepicker"
            selected={moment(selectedMax)}
            onChange={this.updateFromPicker.bind(this, "updateDateMax")}
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
