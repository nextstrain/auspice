import React from "react";
import SelectLabel from "../framework/select-label";
import { connect } from "react-redux";
import { CHANGE_ANIMATION_TIME } from "../../actions/types";//*
import { CHANGE_ANIMATION_START } from "../../actions/types"; //*
import { CHANGE_ANIMATION_CUMULATIVE } from "../../actions/types"; //*
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import Toggle from "./toggle";
import {materialButton, materialButtonSelected} from "../../globalStyles";

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
      const loopRunning = window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop;
      if (!loopRunning) {
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

        // if (window.NEXTSTRAIN && window.NEXTSTRAIN.mapAnimationLoop)

        /* cast string to num, the see if its an integer, ie., don't send the action if they type 'd' */
        this.props.dispatch({
          type: CHANGE_ANIMATION_TIME,
          data: duration /* this.checkAndTransformAnimationDuration(+e.target.value) */
        });
      }
    }
  }

  render() {

    return (
      <div id='mapAnimationControls'>

      <div style={{marginBottom: 15}}>
        <SelectLabel text="Animation speed"/>
        <button
          style={this.props.mapAnimationDurationInMilliseconds === 60000 ? materialButtonSelected : materialButton}
          onClick={this.handleChangeAnimationTimeClicked("slow")}>
          Slow
        </button>
        <button
          style={this.props.mapAnimationDurationInMilliseconds === 30000 ? materialButtonSelected : materialButton}
          onClick={this.handleChangeAnimationTimeClicked("medium")}>
          Medium
        </button>
        <button
          style={this.props.mapAnimationDurationInMilliseconds === 15000 ? materialButtonSelected : materialButton}
          onClick={this.handleChangeAnimationTimeClicked("fast")}>
          Fast
        </button>
      </div>

      <Toggle
        display={true}
        on={this.props.mapAnimationCumulative}
        callback={(e) => {
          analyticsControlsEvent("change-animation-cumulative");
          this.props.dispatch({ type: CHANGE_ANIMATION_CUMULATIVE, data: !this.props.mapAnimationCumulative });
          // modifyURLquery(this.context.router, {apt: e.target.value}, true);
        }}
        label="Animate cumulative history"
      />
      </div>
    );
  }
}

export default MapAnimationControls
