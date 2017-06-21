import React from "react";
import SelectLabel from "../framework/select-label";
import DatePicker from "react-datepicker";
import _ from "lodash";
import { select} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_ANIMATION_TIME } from "../../actions/types";//*
import { CHANGE_ANIMATION_START } from "../../actions/types"; //*
import { CHANGE_ANIMATION_CUMULATIVE } from "../../actions/types"; //*
import { changeColorBy } from "../../actions/colors";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import moment from 'moment';
import { controlsWidth } from "../../util/globals";
import { dataFont, darkGrey } from "../../globalStyles";

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
    absoluteDateMax: state.controls.absoluteDateMax,
    dateScale: state.controls.dateScale,
    dateFormat: state.controls.dateFormat,
    // mapAnimationStartDate: state.controls.mapAnimationStartDate,
  };
})

class MapAnimationStartDatePicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lastSliderUpdateTime: Date.now()
    }
  }

  numericToCalendar(numDate) {
    return(this.props.dateFormat(this.props.dateScale.invert(numDate)));
  }

  calendarToNumeric(calDate) {
    return(this.props.dateScale(this.props.dateFormat.parse(calDate)));
  };

  validateSelectedAnimationStartDate(input) {

    /* duplicated */
    let absoluteDateMinStr = this.props.absoluteDateMin;
    let absoluteDateMaxStr = this.props.absoluteDateMax;
    let absoluteDateMin = moment(absoluteDateMinStr, "YYYY-MM-DD");
    let absoluteDateMax = moment(absoluteDateMaxStr, "YYYY-MM-DD");
    // let numberDays = moment.duration(absoluteDateMax.diff(absoluteDateMin)).asDays();
    // let maxDate = absoluteDateMax.diff(numberDays * 0.1, "days") // Latest start date is end date - 10%

    let inputDate = moment(input, "YYYY-MM-DD")

    let startDate;
    if (inputDate <= absoluteDateMin){
      startDate = absoluteDateMinStr;
    } else if (inputDate >= absoluteDateMax){
      startDate = absoluteDateMaxStr;
    } else {
      startDate = moment(input).format("YYYY-MM-DD")
    }

    return startDate;

  }

  updateFromPicker(userSelectedDateAsMoment) {

      analyticsControlsEvent("change-animation-start-date");
      this.props.dispatch({
        type: CHANGE_ANIMATION_START,
        data: this.validateSelectedAnimationStartDate(userSelectedDateAsMoment)
      }); //might need to convert format
  }

  render() {
    // minDistance={(this.props.absoluteMaxVal - this.props.absoluteMinVal) / 10.0}
    // onChange={this.updateFromSlider.bind(this, true)}

    // const absoluteMin = this.props.absoluteDateMin;
    // const absoluteMax = this.props.absoluteDateMax;
    // const selectedMin = this.props.dateMin;
    // const selectedMax = this.props.dateMax;
    //
    // const absoluteMinNumDate = this.calendarToNumeric(absoluteMin);
    // const absoluteMaxNumDate = this.calendarToNumeric(absoluteMax);
    // const selectedMinNumDate = this.calendarToNumeric(selectedMin);
    // const selectedMaxNumDate = this.calendarToNumeric(selectedMax);

    return (
      <div style={{marginBottom: 15, width: controlsWidth}}>
        <DatePicker
          dateFormat="YYYY/MM/DD"

          selected={moment(this.props.mapAnimationStartDate)}
          onChange={this.updateFromPicker.bind(this)}
        />
      </div>
    );
  }
}

@connect((state) => {
  return {
    metadata: state.metadata.metadata,
    mapAnimationStartDate: state.controls.mapAnimationStartDate,
    mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds,
    mapAnimationCumulative: state.controls.mapAnimationCumulative
  };
})
class MapAnimationControls extends React.Component {

  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  // checkAndTransformAnimationDuration(input) {
  //
  //   const minimumMapAnimationTimeInSeconds = 5;
  //   const maximumMapAnimationTimeInSeconds = 120;
  //   let validatedInput = input;
  //
  //   if (input < minimumMapAnimationTimeInSeconds) {
  //     validatedInput = minimumMapAnimationTimeInSeconds;
  //   } else if (input > maximumMapAnimationTimeInSeconds) {
  //     validatedInput = maximumMapAnimationTimeInSeconds;
  //   }
  //
  //   return validatedInput * 1000 // ship milliseconds instead of seconds to reducer
  // }

  handleChangeAnimationTimeClicked(userSelectedDuration) {
    return () => {
      analyticsControlsEvent("change-animation-time");
      let duration;

      if (userSelectedDuration === "slow") {
        duration = 60000;
      } else if (userSelectedDuration === "medium") {
        duration = 30000;
      } else if (userSelectedDuration === "fast") {
        duration = 15000;
      } else {
        console.warn("Odd... controls/map-animation.js tried to set an animation speed we don't offer...")
      }

      /* cast string to num, the see if its an integer, ie., don't send the action if they type 'd' */
      this.props.dispatch({
        type: CHANGE_ANIMATION_TIME,
        data: duration /* this.checkAndTransformAnimationDuration(+e.target.value) */
      });
    }
  }

  render() {

    /* duplicated */
    let absoluteDateMinStr = this.props.absoluteDateMin;
    let absoluteDateMaxStr = this.props.absoluteDateMax;
    let absoluteDateMin = moment(absoluteDateMinStr, 'YYYY-MM-DD');
    let absoluteDateMax = moment(absoluteDateMaxStr, 'YYYY-MM-DD');
    let numberDays = moment.duration(absoluteDateMax.diff(absoluteDateMin)).asDays();

    return (
      <div id='mapAnimationControls'>

      <div style={{marginBottom: 15}}>
        <SelectLabel text="Animation speed (seconds)"/>
        <button
          style={{
            padding: "5px 10px",
            outline: "none",
            color: this.props.mapAnimationDurationInMilliseconds === 60000 ? "white" : "black",
            backgroundColor: this.props.mapAnimationDurationInMilliseconds === 60000 ? "rgb(80, 151, 186)" : "white",
            border: this.props.mapAnimationDurationInMilliseconds === 60000 ? "1px solid rgb(80, 151, 186)" : "1px solid lightgrey",
            marginRight: 10,
            borderRadius: 3,
            fontSize: 14,
          }}
          onClick={this.handleChangeAnimationTimeClicked("slow")}>
          Slow
        </button>
        <button
          style={{
            padding: "5px 10px",
            outline: "none",
            color: this.props.mapAnimationDurationInMilliseconds === 30000 ? "white" : "black",
            backgroundColor: this.props.mapAnimationDurationInMilliseconds === 30000 ? "rgb(80, 151, 186)" : "white",
            border: this.props.mapAnimationDurationInMilliseconds === 30000 ? "1px solid rgb(80, 151, 186)" : "1px solid lightgrey",
            marginRight: 10,
            borderRadius: 3,
            fontSize: 14,
          }}
          onClick={this.handleChangeAnimationTimeClicked("medium")}>
          Medium
        </button>
        <button
          style={{
            padding: "5px 10px",
            outline: "none",
            color: this.props.mapAnimationDurationInMilliseconds === 15000 ? "white" : "black",
            backgroundColor: this.props.mapAnimationDurationInMilliseconds === 15000 ? "rgb(80, 151, 186)" : "white",
            border: this.props.mapAnimationDurationInMilliseconds === 15000 ? "1px solid rgb(80, 151, 186)" : "1px solid lightgrey",
            marginRight: 10,
            borderRadius: 3,
            fontSize: 14,
          }}
          onClick={this.handleChangeAnimationTimeClicked("fast")}>
          Fast
        </button>
      </div>
      {/*<SelectLabel text="Animation start date (click to change)"/>*/}
      {/*<MapAnimationStartDatePicker/>*/}

      <SelectLabel text="Animate cumulative history"/>
      <input
        type='checkbox'
        checked={this.props.mapAnimationCumulative}
        id='mapAnimationCumulative'
        onChange={(e) => {
          analyticsControlsEvent("change-animation-cumulative");
          this.props.dispatch({ type: CHANGE_ANIMATION_CUMULATIVE, data: !this.props.mapAnimationCumulative });
          // modifyURLquery(this.context.router, {apt: e.target.value}, true);
        }}/>

      </div>
    );
  }
}

export default MapAnimationControls


// max={absoluteDateMax.year().month().date()} //These probably need to be reformatted (or just kept as strings above)
// min={absoluteDateMin.year().month().date()}
