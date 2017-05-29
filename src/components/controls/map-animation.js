import React from "react";
import SelectLabel from "../framework/select-label";
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

@connect((state) => {
  return {
    metadata: state.metadata.metadata,
    mapAnimationStartDate: state.controls.mapAnimationStartDate,
    mapAnimationDurationInMilliseconds: state.controls.mapAnimationDurationInMilliseconds,
    mapAnimationPathTrailing: state.controls.mapAnimationPathTrailing
  };
})

class MapAnimationControls extends React.Component {

  // static contextTypes = {
    // router: React.PropTypes.object.isRequired
  // }



  checkAndTransformAnimationTime(input) {

    /* duplicated */
    let absoluteDateMinStr = this.props.absoluteDateMin;
    let absoluteDateMaxStr = this.props.absoluteDateMax;
    let absoluteDateMin = moment(absoluteDateMinStr, 'YYYY-MM-DD');
    let absoluteDateMax = moment(absoluteDateMaxStr, 'YYYY-MM-DD');
    let numberDays = moment.duration(absoluteDateMax.diff(absoluteDateMin)).asDays();

    //input is seconds
    let max_seconds = numberDays;
    let min_seconds= 5;

    // _.isNumber validation
    let animationLength
    if (input <= min_seconds){
      animationLength = min_seconds
    }
    else if (input >= max_seconds){
      animationLength = max_seconds
    }
    else{
      animationLength = input
    }
    return animationLength*1000 //return milliseconds instead of seconds
  }

  checkAnimationDate(input) {

    /* duplicated */
    let absoluteDateMinStr = this.props.absoluteDateMin;
    let absoluteDateMaxStr = this.props.absoluteDateMax;
    let absoluteDateMin = moment(absoluteDateMinStr, 'YYYY-MM-DD');
    let absoluteDateMax = moment(absoluteDateMaxStr, 'YYYY-MM-DD');
    let numberDays = moment.duration(absoluteDateMax.diff(absoluteDateMin)).asDays();


    let maxDate = absoluteDateMax.diff(numberDays*0.1, 'days') // Latest start date is end date - 10%
    let inputDate = moment(input, 'YYYY-MM-DD')

    let startDate
    if (inputDate <= absoluteDateMin){
      startDate = absoluteDateMinStr;
    } else if (inputdate >= maxDate){
      startDate = maxDate.year(year).month(month).date(day);
    } else{
      startDate = input;
    };
    return startDate;

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

        <SelectLabel text="Animation start date (click to change)"/>
        <MapAnimationStartDatePicker/>

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
