import React from "react";
import SelectLabel from "../framework/select-label";
import DatePicker from "react-datepicker";
import _ from "lodash";
import { select} from "../../globalStyles";
import { connect } from "react-redux";
import { CHANGE_ANIMATION_TIME } from "../../actions/types";//*
import { CHANGE_ANIMATION_START } from "../../actions/types"; //*
import { CHANGE_ANIMATION_PATHTRAILING } from "../../actions/types"; //*
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
    mapAnimationPathTrailing: state.controls.mapAnimationPathTrailing
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

  render() {

    /* duplicated */
    let absoluteDateMinStr = this.props.absoluteDateMin;
    let absoluteDateMaxStr = this.props.absoluteDateMax;
    let absoluteDateMin = moment(absoluteDateMinStr, 'YYYY-MM-DD');
    let absoluteDateMax = moment(absoluteDateMaxStr, 'YYYY-MM-DD');
    let numberDays = moment.duration(absoluteDateMax.diff(absoluteDateMin)).asDays();

    return (
      <div id='mapAnimationControls'>

        <SelectLabel text="Animation length (seconds)"/>
        <input
          style={{
            padding: "5px 10px",
            borderRadius: 3,
            border: "1px solid lightgrey",
            marginBottom: 10,
            fontSize: 14,
          }}
          type='text'
          id='animationLengthInSeconds'
          value={this.props.mapAnimationDurationInMilliseconds / 1000 /* we get milliseconds from reducer, and send milliseconds as well, see: checkAndTransformAnimationDuration */}
          onChange={(e) => {
            analyticsControlsEvent("change-animation-time");
            /* cast string to num, the see if its an integer, ie., don't send the action if they type 'd' */
            if (Number.isInteger(+e.target.value)) {
              this.props.dispatch({
                type: CHANGE_ANIMATION_TIME,
                data: +e.target.value * 1000 /* this.checkAndTransformAnimationDuration(+e.target.value) */
              });
            }
          }}/>

        {/*<SelectLabel text="Animation start date (click to change)"/>*/}
        {/*<MapAnimationStartDatePicker/>*/}

        <SelectLabel text="Animation path trailing"/>
        <input
          type='checkbox'
          checked={this.props.mapAnimationPathTrailing}
          id='mapAnimationPathTrailing'
          onChange={(e) => {
            analyticsControlsEvent("change-animation-pathtrailing");
            this.props.dispatch({ type: CHANGE_ANIMATION_PATHTRAILING, data: !this.props.mapAnimationPathTrailing });
            // modifyURLquery(this.context.router, {apt: e.target.value}, true);
          }}/>

        </div>
    );
  }
}

export default MapAnimationControls


// max={absoluteDateMax.year().month().date()} //These probably need to be reformatted (or just kept as strings above)
// min={absoluteDateMin.year().month().date()}
