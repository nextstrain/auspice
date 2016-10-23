import React from "react";
import Radium from "radium";
import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
// import { FOO } from "../actions";
import {VictoryAxis, VictoryChart, VictoryBar} from "victory";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import d3 from "d3";

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
    // const amino_acid_charts = [];
    // for (let prot in this.props.entropy) {
    //   if (prot !== "nuc") {
    //     amino_acid_charts.push(
    //       <VictoryBar
    //         style={{data: {fill: globals.genotypeColors[amino_acid_charts.length%10], width:2}}}
    //         data={this.props.entropy[prot]['val'].map((s, i) => {return {x: this.props.entropy[prot]['pos'][i], y: s}})}
    //       />
    //       );
    //   }
    // }

    const entropyChartWidth = 900;
    const entropyChartHeight = 300;
    const bottomPadding = 30;
    const leftPadding = 80;
    const rightPadding = 80;

    const entropy = this.props.entropy['nuc']['val'].map((s, i) => {return {x: this.props.entropy['nuc']['pos'][i], y: s}});

    const entropyWithoutZeros = _.filter(entropy, (e) => {return e.y !== 0});


    const x = d3.scale.linear()
                    .domain([0, entropy.length]) // original array, since the x values are still mapped to that
                    .range([0, entropyChartWidth - rightPadding]);

    const y = d3.scale.linear()
                    .domain([0, _.maxBy(entropyWithoutZeros, 'y').y]) // original array, since the x values are still mapped to that
                    .range([0, entropyChartHeight]);


    return (
      <Card title={"Entropy"}>
        <svg width={entropyChartWidth} height={entropyChartHeight}>
          {entropyWithoutZeros.map((e) => {
            return (
              <rect x={x(e.x) + leftPadding} y={entropyChartHeight - bottomPadding - y(e.y)} width="1" height={y(e.y)}/>
            )
          })}
          <VictoryAxis
            padding={{
              top: 0,
              bottom: 0,
              left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
              right: 0 // this is confusing, but ok
            }}
            domain={[0, _.maxBy(entropyWithoutZeros, 'x').x]}
            offsetY={bottomPadding}
            width={entropyChartWidth}
            standalone={false}/>
            <VictoryAxis
              dependentAxis
              padding={{
                top: 0,
                bottom: bottomPadding,
                left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
                right: rightPadding / 2 // bug? why is that / 2 necessary...
              }}
              domain={[0, _.maxBy(entropyWithoutZeros, 'y').y]}
              offsetY={bottomPadding}
              width={entropyChartWidth}
              standalone={false}/>
        </svg>
      </Card>
    );


    // <VictoryChart width={globals.width}>
    //   <VictoryBar
    //     style={{data: {fill: "lightgrey", "width":2}}}
    //     data={this.props.entropy['nuc']['val'].map((s, i) => {return {x: this.props.entropy['nuc']['pos'][i], y: s}})}
    //     />
    // </VictoryChart>
    // <VictoryChart width={globals.width}>
    //   {amino_acid_charts}
    // </VictoryChart>
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
