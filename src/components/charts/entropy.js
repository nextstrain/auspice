import React from "react";
import Radium from "radium";
import _ from "lodash";
import { connect } from "react-redux";
import {VictoryAxis} from "victory";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import d3 from "d3";
import { parseGenotype } from "../../util/getGenotype";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/controls";
import { modifyURLquery } from "../../util/urlHelpers";

@connect(state => {
  return {
    entropy: state.entropy.entropy,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
@Radium
class Entropy extends React.Component {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  componentWillUpdate(prevProps) {
    /* check here to see if this.props.browserDimensions has changed and rerender */
  }

  setColorByGenotype(colorBy) {
    this.props.dispatch(changeColorBy(colorBy))
    modifyURLquery(this.context.router, {c: colorBy}, true);
  }

  drawEntropy() {
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    })

    const entropyChartWidth = responsive.width;
    const entropyChartHeight = 300;
    const bottomPadding = 45;
    const leftPadding = 80;
    const rightPadding = 80;

    const entropy = this.props.entropy['nuc']['val'].map((s, i) => {return {x: this.props.entropy['nuc']['pos'][i], y: s}});

    const entropyWithoutZeros = _.filter(entropy, (e) => {return e.y !== 0});

    let aminoAcidEntropyWithoutZeros = [];
    const annotations = [];
    let aaCount=0;
    for (let prot in this.props.entropy) {
      if (prot !== "nuc") {
        let tmpProt= this.props.entropy[prot];
        aaCount+=1;
        annotations.push({prot: prot,
                          start: tmpProt['pos'][0],
                          end: tmpProt['pos'][tmpProt['pos'].length-1],
                          readingFrame: 1, //+tmpProt['pos'][0]%3,
                          fill: globals.genotypeColors[aaCount%10],
                         });
        const tmpEntropy = tmpProt['val'].map(
              (s, i) => {return {x: tmpProt['pos'][i],
                                 y: s,
                                 codon: tmpProt['codon'][i],
                                 fill: globals.genotypeColors[aaCount%10],
                                 prot: prot
                                 }}
            );
        aminoAcidEntropyWithoutZeros = aminoAcidEntropyWithoutZeros.concat(tmpEntropy.filter((e) => e.y !== 0));
      }
    }

    const x = d3.scale.linear()
                    .domain([0, entropy.length]) // original array, since the x values are still mapped to that
                    .range([leftPadding, entropyChartWidth - rightPadding]);

    const yMax = Math.max(_.maxBy(entropyWithoutZeros, 'y').y,
                          _.maxBy(aminoAcidEntropyWithoutZeros, 'y').y);
    const y = d3.scale.linear()
                    .domain([-0.11*yMax, 1.2*yMax]) // original array, since the x values are still mapped to that
                    .range([entropyChartHeight-bottomPadding, 0]);

    return (
      <Card title={"Genetic Diversity"}>
        <svg width={entropyChartWidth} height={entropyChartHeight}>
          {annotations.map((e, i) => {
            return (
              <g key={i}>
              <rect
                x={x(e.start)}
                y={y(-0.025*yMax*e.readingFrame)}
                width={x(e.end)-x(e.start)}
                height={12}
                fill={e.fill}
                stroke={e.fill}
              />
              <text
                x={0.5*(x(e.start) + x(e.end)) }
                y={y(-0.025*yMax*e.readingFrame) + 10}
                textAnchor={"middle"}
                fontSize={10}
                fill={"#444"}
              >
                {e.prot}
              </text>
              </g>
            );
          })}
          {entropyWithoutZeros.map((e, i) => {
            return (
              <rect
                key={i}
                x={x(e.x)}
                y={y(e.y)}
                width="1" height={y(0) - y(e.y)}
                cursor={"pointer"}
                onClick={() => {this.setColorByGenotype("gt-nuc_" + (e.x + 1));}}
                fill={"#CCC"}
                stroke={"#CCC"}
              />
            );
          })}
          {aminoAcidEntropyWithoutZeros.map((e, i) => {
            return (
              <rect
                key={i}
                x={x(e.x)}
                y={y(e.y)}
                width="2.5" height={y(0) - y(e.y)}
                cursor={"pointer"}
                onClick={() => {this.setColorByGenotype("gt-" + e.prot + "_" + (e.codon + 1));}}
                fill={e.fill}
                stroke={"#CCC"}
              />
            );
          })}
          {/* x axis */}
          <VictoryAxis
            padding={{
              top: 0,
              bottom: 0,
              left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
              right: rightPadding // this is confusing, but ok
            }}
            domain={x.domain()}
            offsetY={bottomPadding}
            width={entropyChartWidth}
            standalone={false}
            label={"Position"}
          />
          {/* y axis */}
          <VictoryAxis
            dependentAxis
            padding={{
              top: 0,
              bottom: bottomPadding,
              left: leftPadding, // cosmetic, 1px overhang, add +1 if persists
              right: rightPadding / 2 // bug? why is that / 2 necessary...
            }}
            domain={y.domain()}
            offsetY={bottomPadding}
            standalone={false}
          />
        </svg>
      </Card>
    );
  }

  render() {
    return (
      <div>
        {this.props.entropy && this.props.browserDimensions ? this.drawEntropy() : "Waiting on entropy data"}
      </div>
    );
  }
}

export default Entropy;
