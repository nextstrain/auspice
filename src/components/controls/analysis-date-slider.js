import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Slider from "./slider";
import { controlsWidth } from "../../util/globals";
import { changeAnalysisSliderValue } from "../../actions/tree";
import { dataFont, darkGrey } from "../../globalStyles";

@connect((state) => {
  return {
    value: state.controls.analysisSlider.value,
    absoluteMinVal: state.controls.analysisSlider.absoluteMinVal,
    absoluteMaxVal: state.controls.analysisSlider.absoluteMaxVal
  };
})
class AnalysisDateSlider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lastSliderUpdateTime: Date.now()
    }
  }
  static propTypes = {
    value: PropTypes.number.isRequired,
    absoluteMinVal: PropTypes.number.isRequired,
    absoluteMaxVal: PropTypes.number.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  getStyles() {
    return {
      base: {
      }
    };
  }

  updateFromSlider(debounce, value) {
    if (debounce) {
      // simple debounce @ 100ms
      const currentTime = Date.now();
      if (currentTime < this.state.lastSliderUpdateTime + 100) {
        return null
      }
      this.setState({lastSliderUpdateTime: currentTime})
    }
    this.props.dispatch(changeAnalysisSliderValue(Math.round(value * 100) / 100));
    return null;
  }

  render() {
    return (
      <div>
        <div style={{width: controlsWidth}}>
        <Slider
          min={this.props.absoluteMinVal}
          max={this.props.absoluteMaxVal}
          defaultValue={this.props.value}
          value={this.props.value}
          /* debounce the onChange event, but ensure the final one goes through */
          onChange={this.updateFromSlider.bind(this, true)}
          onAfterChange={this.updateFromSlider.bind(this, false)}
          minDistance={(this.props.absoluteMaxVal - this.props.absoluteMinVal) / 10.0}
          pearling
          withBars/>
        </div>
        <div style={{height: 5}}> </div>
        <div style={{width: controlsWidth, font: dataFont, color: darkGrey, fontSize: 12}}>
          <span style={{float: "right"}}>{Math.round(this.props.value * 100) / 100}</span>
        </div>
      </div>
    );
  }
}

export default AnalysisDateSlider;
