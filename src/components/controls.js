import React from 'react';
import Radium from 'radium';
// import _ from 'lodash';
// import Flex from './framework/flex';
// import { connect } from 'react-redux';
// import { FOO } from '../actions';
import Button from "./framework/generic-button";
import DateSlider from "./controls/date_slider";
import ColorLegend from "./controls/color_legend";
import ColorByInputs from "./controls/color_by_inputs";
import SearchStrainsInput from "./controls/search_strains_inputs";

// @connect(state => {
//   return state.FOO;
// })
@Radium
class Controls extends React.Component {
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
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        <DateSlider/>
        <ColorLegend/>
        <ColorByInputs/>
        <SearchStrainsInput/>
        <Button> Reset Layout </Button>
      </div>
    );
  }
}

export default Controls;
