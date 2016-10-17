import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryLine, VictoryChart} from "victory";
import * as globals from "../../util/globals";

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
    genotype: React.PropTypes.string,
  }
  static defaultProps = {
    genotype:["global", "HA1", "159F"]
  }
  getStyles() {
    return {
      base: {

      }
    };
  }
  drawFrequencies() {
    const key = this.props.genotype
                ? this.props.genotype[0]+"_" + this.props.genotype[1] + ":" + this.props.genotype[2]
                : "global_HA1:159F"
    const traj = [];
    const states = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
                         "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
                         "W", "X", "Y", "Z", "-", "*"];
    for (let si=0; si<states.length; si+=1){
      const key = this.props.genotype
                  ? this.props.genotype+states[si]
                  : "not found";
      if (key !== "not found" && this.props.frequencies[key]){
        traj.push(
          <VictoryLine
            width={globals.width}
            data={
                this.props.frequencies[key].map((frequency, i) => {
                  return {x: this.props.pivots[i], y: frequency}
                })
            }
          />
        );
      }
    }
    return (
      <VictoryChart>
        {traj}
      </VictoryChart>
    );
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
