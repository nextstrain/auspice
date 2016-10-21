import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryLine, VictoryChart, VictoryBar, VictoryScatter} from "victory";
import * as globals from "../../util/globals";
import Card from "../framework/card";


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
    const amino_acid_charts = [];
    for (let prot in this.props.entropy) {
      if (prot !== "nuc") {
        amino_acid_charts.push(
          <VictoryBar
            style={{data: {fill: globals.genotypeColors[amino_acid_charts.length%10], width:2}}}
            data={this.props.entropy[prot]['val'].map((s, i) => {return {x: this.props.entropy[prot]['pos'][i], y: s}})}
          />
          );
      }
    }
    return (
      <Card title={"Entropy"}>
        <VictoryChart width={globals.width}>
          <VictoryBar
            style={{data: {fill: "lightgrey", "width":2}}}
            data={this.props.entropy['nuc']['val'].map((s, i) => {return {x: this.props.entropy['nuc']['pos'][i], y: s}})}
          />
        </VictoryChart>
       <VictoryChart width={globals.width}>
         {amino_acid_charts}
       </VictoryChart>
     </Card>
    );
  }
  render() {
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
