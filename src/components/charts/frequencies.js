import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryLine} from "victory";

@connect(state => {
  return state.frequencies;
})
@Radium
class Frequencies extends React.Component {
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
  createDate() {
    
  }
  drawFrequencies() {
    return (
      <VictoryLine
        scale={{x: "date", y: "linear"}}
        data={this.createData()}/>
    )
  }
  render() {
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {this.props.frequencies ? this.drawFrequencies() : "Waiting on freq data"}
      </div>
    );
  }
}

export default Frequencies;
