import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryLine, VictoryChart, VictoryBar, VictoryScatter} from "victory";
import * as globals from "../../util/globals";

@connect(state => {
  return state.entropy;
})
@Radium
class Entropy extends React.Component {
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
  drawEntropy() {
    console.log('Drawing entropy');
    return (
      <VictoryChart width={globals.width}>
        <VictoryBar
          style={{data: {fill: "lightgrey"}}}
          data={this.props.entropy['HA1']['val'].map((s, i) => {return {x: this.props.entropy['HA1']['pos'][i], y: s}})}
        />
      </VictoryChart>
      )
  }
  render() {
    console.log('in entropy render', this.props.entropy);
    const styles = this.getStyles();
    return (
      <div style={[
        styles.base,
        this.props.style
      ]}>
        {this.props.entropy ? this.drawEntropy() : "Waiting on entropy data"}
      </div>
    );
  }
}

export default Entropy;
