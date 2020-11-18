import React from "react";
import { connect } from "react-redux";
import styled from 'styled-components';
import Slider from "./slider";
import { controlsWidth, minDistanceDateSlider } from "../../util/globals";
import { numericToCalendar } from "../../util/dateHelpers";
import { changeDateFilter } from "../../actions/tree";
import { MAP_ANIMATION_PLAY_PAUSE_BUTTON } from "../../actions/types";

const DateLabel = styled.div`
  font-family: ${(props) => props.theme["font-family"]};
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
  float: ${(props) => props.right ? "right" : "left"};
`;

@connect((state) => {
  return {
    branchLengthsToDisplay: state.controls.branchLengthsToDisplay,
    dateMin: state.controls.dateMin,
    dateMax: state.controls.dateMax,
    dateMinNumeric: state.controls.dateMinNumeric,
    dateMaxNumeric: state.controls.dateMaxNumeric,
    absoluteDateMin: state.controls.absoluteDateMin,
    absoluteDateMax: state.controls.absoluteDateMax,
    absoluteDateMinNumeric: state.controls.absoluteDateMinNumeric,
    absoluteDateMaxNumeric: state.controls.absoluteDateMaxNumeric
  };
})
class DateRangeInputs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lastSliderUpdateTime: Date.now()
    };
    this.updateFromSliderNotDebounced = this.updateFromSlider.bind(this, false);
    this.updateFromSliderDebounced = this.updateFromSlider.bind(this, true);
  }
  maybeClearMapAnimationInterval() {
    if (window.NEXTSTRAIN && window.NEXTSTRAIN.animationTickReference) {
      clearInterval(window.NEXTSTRAIN.animationTickReference);
      window.NEXTSTRAIN.animationTickReference = null;
      this.props.dispatch({
        type: MAP_ANIMATION_PLAY_PAUSE_BUTTON,
        data: "Play"
      });
    }
  }
  updateFromSlider(debounce, numDateValues) {
    /* debounce: boolean. TRUE: both debounce and quickdraw. */
    this.maybeClearMapAnimationInterval();

    if (debounce) {
      // simple debounce @ 100ms
      const currentTime = Date.now();
      if (currentTime < this.state.lastSliderUpdateTime + 100) {
        return null;
      }
      // console.log("UPDATING", currentTime, this.state.lastSliderUpdateTime)
      this.setState({lastSliderUpdateTime: currentTime});
    }
    // {numDateValues} is an array of numDates received from Slider
    // [numDateStart, numDateEnd]
    const newRange = {min: numericToCalendar(numDateValues[0]),
      max: numericToCalendar(numDateValues[1])};
    if (this.props.dateMin !== newRange.min && this.props.dateMax === newRange.max) { // update min
      this.props.dispatch(changeDateFilter({newMin: newRange.min, quickdraw: debounce}));
    } else if (this.props.dateMin === newRange.min &&
               this.props.dateMax !== newRange.max) { // update max
      this.props.dispatch(changeDateFilter({newMax: newRange.max, quickdraw: debounce}));
    } else if (this.props.dateMin !== newRange.min &&
               this.props.dateMax !== newRange.max) { // update both
      this.props.dispatch(changeDateFilter({newMin: newRange.min, newMax: newRange.max, quickdraw: debounce}));
    } else if (debounce === false) {
      /* this occurs when no dates have actually changed BUT we need to redraw (e.g. quickdraw has come off) */
      this.props.dispatch(changeDateFilter({quickdraw: debounce}));
    }
    return null;
  }
  render() {
    if (this.props.branchLengthsToDisplay === "divOnly") {
      return null;
    }
    return (
      <div>
        <div style={{width: controlsWidth}}>
          <Slider // numDates are handed to Slider
            min={this.props.absoluteDateMinNumeric}
            max={this.props.absoluteDateMaxNumeric}
            defaultValue={[this.props.absoluteDateMinNumeric, this.props.absoluteDateMaxNumeric]}
            value={[this.props.dateMinNumeric, this.props.dateMaxNumeric]}
            /* debounce the onChange event, but ensure the final one goes through */
            onChange={this.updateFromSliderDebounced}
            onAfterChange={this.updateFromSliderNotDebounced}
            minDistance={minDistanceDateSlider * (this.props.absoluteDateMaxNumeric - this.props.absoluteDateMinNumeric)}
            pearling
            withBars
          />
        </div>
        <div style={{height: 5}}/>
        <div style={{width: controlsWidth}}>
          <DateLabel>{this.props.dateMin}</DateLabel>
          <DateLabel right>{this.props.dateMax}</DateLabel>
        </div>
      </div>
    );
  }
}

export const DateRangeInfo = (
  <>
    Use this slider to filter the data based on the sample date.
    This may include inferred dates for ancestral nodes in the tree,
    and thus the date range here can be wider than the sample collection range.
  </>
);

export default DateRangeInputs;
