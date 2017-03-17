/*eslint-env browser*/
/*eslint dot-notation: "off", max-params: 0*/
import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import {VictoryAxis} from "victory-chart";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import d3 from "d3";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { modifyURLquery } from "../../util/urlHelpers";
import { dataFont, darkGrey, materialButton, materialButtonSelected } from "../../globalStyles";

const calcEntropy = function (entropy) {
  const entropyNt = entropy["nuc"]["val"].map((s, i) => {
    return {x: entropy["nuc"]["pos"][i], y: s};
  });

  const entropyNtWithoutZeros = _.filter(entropyNt, (e) => {return e.y !== 0;});

  let aminoAcidEntropyWithoutZeros = [];
  const annotations = [];
  let aaCount = 0;
  for (let prot in entropy) {
    if (prot !== "nuc") {
      const tmpProt = entropy[prot];
      aaCount += 1;
      annotations.push({prot: prot,
                        start: tmpProt["pos"][0],
                        end: tmpProt["pos"][tmpProt["pos"].length - 1],
                        readingFrame: 1, //+tmpProt['pos'][0]%3,
                        fill: globals.genotypeColors[aaCount % 10]
                       });
      const tmpEntropy = tmpProt["val"].map((s, i) => ({
        x: tmpProt["pos"][i],
        y: s,
        codon: tmpProt["codon"][i],
        fill: globals.genotypeColors[aaCount % 10],
        prot: prot
      }));
      aminoAcidEntropyWithoutZeros = aminoAcidEntropyWithoutZeros.concat(
        tmpEntropy.filter((e) => e.y !== 0)
      );
    }
  }
  return {annotations,
    aminoAcidEntropyWithoutZeros,
    entropyNt,
    entropyNtWithoutZeros};
};

const makeXAxis = (chartGeom, domain) => (
  <VictoryAxis
    padding={{
      top: 0,
      bottom: 0,
      left: chartGeom.padLeft, // cosmetic, 1px overhang, add +1 if persists
      right: chartGeom.padRight // this is confusing, but ok
    }}
    domain={domain}
    offsetY={chartGeom.padBottom}
    width={chartGeom.width}
    standalone={false}
    label={"Position"}
    tickCount={5}
    style={{
      axis: {stroke: "black", padding: 0},
      axisLabel: {fontSize: 14, padding: 30, fill: darkGrey, fontFamily: dataFont},
      tickLabels: {fontSize: 12, padding: 0, fill: darkGrey, fontFamily: dataFont},
      ticks: {stroke: "black", size: 5, padding: 5}
    }}
  />
);

const makeYAxis = (chartGeom, domain) => (
  <VictoryAxis
    dependentAxis
    padding={{
      top: 0,
      bottom: chartGeom.padBottom,
      left: chartGeom.padLeft, // cosmetic, 1px overhang, add +1 if persists
      right: chartGeom.padRight / 2 // bug? why is that / 2 necessary...
    }}
    domain={domain}
    offsetY={chartGeom.padBottom}
    standalone={false}
    style={{
      axis: {stroke: "black", padding: 0},
      axisLabel: {fontSize: 14, padding: 30, fill: darkGrey, fontFamily: dataFont},
      tickLabels: {fontSize: 12, padding: 0, fill: darkGrey, fontFamily: dataFont},
      ticks: {stroke: "black", size: 5, padding: 5}
    }}
  />
);

const makeAnnotation = (x, y, yMax, e, i) => (
  <g key={i}>
    <rect
      x={x(e.start)}
      y={y(-0.025 * yMax * e.readingFrame)}
      width={x(e.end) - x(e.start)}
      height={12}
      fill={e.fill}
      stroke={e.fill}
    />
    <text
      x={0.5 * (x(e.start) + x(e.end)) }
      y={y(-0.025 * yMax * e.readingFrame) + 10}
      textAnchor={"middle"}
      fontSize={10}
      fill={"#444"}
    >
      {e.prot}
    </text>
  </g>
);

const getStyles = function (width) {
  return {
    switchContainer: {
      position: "absolute",
      marginTop: -25,
      paddingLeft: width - 100
    },
    switchTitle: {
      margin: 5,
      position: "relative",
      top: -1
    }
  };
};

@connect(state => {
  return {
    entropy: state.entropy.entropy,
    browserDimensions: state.browserDimensions.browserDimensions
  };
})
class Entropy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aa: true
    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    entropy: React.PropTypes.object,
    sidebar: React.PropTypes.bool,
    browserDimensions: React.PropTypes.object
  }

  setColorByGenotype(colorBy) {
    this.props.dispatch(changeColorBy(colorBy));
    modifyURLquery(this.context.router, {c: colorBy}, true);
  }

  makeEntropyNtBar(x, y, e, i) {
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
  }

  makeEntropyAABar(x, y, e, i) {
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
  }

  getChartGeom() {
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    });
    return {
      width: responsive.width,
      height: 300,
      padBottom: 50,
      padLeft: 38,
      padRight: 12
    };
  }

  aaNtSwitch(styles) {
    return (
      <div style={styles.switchContainer}>
        <button
          key={1}
          style={this.state.aa ? materialButtonSelected : materialButton}
          onClick={() => this.setState({aa: true})}
        >
          <span style={styles.switchTitle}> {"AA"} </span>
        </button>
        <button
          key={2}
          style={!this.state.aa ? materialButtonSelected : materialButton}
          onClick={() => this.setState({aa: false})}
        >
          <span style={styles.switchTitle}> {"NT"} </span>
        </button>
      </div>
    );
  }

  render() {
    if (!(this.props.entropy && this.props.browserDimensions)) {
      return (
        <div>
          "Waiting on entropy data"
        </div>
      );
    }
    /* get entropy data */
    const { annotations,
      aminoAcidEntropyWithoutZeros,
      entropyNt,
      entropyNtWithoutZeros } = calcEntropy(this.props.entropy);
    /* get chart geom data */
    const chartGeom = this.getChartGeom();
    /* get styles */
    const styles = getStyles(chartGeom.width);
    /* d3 scales */
    const x = d3.scale.linear()
      .domain([0, entropyNt.length]) // original array, since the x values are still mapped to that
      .range([chartGeom.padLeft, chartGeom.width - chartGeom.padRight]);
    const yMax = Math.max(_.maxBy(entropyNtWithoutZeros, "y").y,
                          _.maxBy(aminoAcidEntropyWithoutZeros, "y").y);
    const y = d3.scale.linear()
      .domain([-0.11 * yMax, 1.2 * yMax]) // x values are mapped to orig array
      .range([chartGeom.height - chartGeom.padBottom, 0]);

    return (
      <Card title={"Diversity"}>
        {this.aaNtSwitch(styles)}
        <svg width={chartGeom.width} height={chartGeom.height}>
          {annotations.map(makeAnnotation.bind(this, x, y, yMax))}
          {this.state.aa ?
            aminoAcidEntropyWithoutZeros.map(this.makeEntropyAABar.bind(this, x, y)) :
            entropyNtWithoutZeros.map(this.makeEntropyNtBar.bind(this, x, y))
          }
          {makeXAxis(chartGeom, x.domain())}
          {makeYAxis(chartGeom, y.domain())}
        </svg>
      </Card>
    );
  }
}

export default Entropy;
