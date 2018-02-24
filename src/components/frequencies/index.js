import React from "react";
import { select } from "d3-selection";
import { connect } from "react-redux";
import Card from "../framework/card";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import { toggleNormalization } from "../../actions/frequencies";
import "../../css/entropy.css";
import { calcScales, drawAxis, removeAxis, drawStream, drawTooltip } from "./functions";

const getStyles = (width) => {
  return {
    switchContainer: {
      position: "absolute",
      marginTop: -20,
      paddingLeft: width - 300
    },
    switchTitle: {
      margin: 5,
      position: "relative",
      top: -1
    }
  };
};

@connect((state) => {
  return {
    data: state.frequencies.data,
    pivots: state.frequencies.pivots,
    ticks: state.frequencies.ticks,
    matrix: state.frequencies.matrix,
    version: state.frequencies.version,
    normaliseData: state.frequencies.normaliseData,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy,
    colorScale: state.controls.colorScale,
    colorOptions: state.metadata.colorOptions
  };
})
export class Frequencies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  calcChartGeom(width, height) {
    return {width, height, spaceLeft: 30, spaceRight: 10, spaceBottom: 20, spaceTop: 10};
  }
  componentDidMount() {
    /* things that only ever need to be done once, and _don't_ rely on the frequencies actually being loaded */
    drawTooltip();
    const svg = select(this.domRef);
    const svgStreamGroup = svg.append("g");
    const chartGeom = this.calcChartGeom(this.props.width, this.props.height);
    const newState = {svg, svgStreamGroup};

    /* things that rely on the data being available: */
    if (this.props.matrix) {
      newState.scales = calcScales(chartGeom, this.props.ticks);
      drawAxis(svg, chartGeom, newState.scales);
      drawStream(svgStreamGroup, newState.scales, {...this.props});
    }
    this.setState(newState);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.version === nextProps.version) {
      return;
    }
    let scales = this.state.scales;
    if (!this.props.loaded && nextProps.loaded) {
      const chartGeom = this.calcChartGeom(nextProps.width, nextProps.height);
      scales = calcScales(chartGeom, nextProps.ticks);
      drawAxis(this.state.svg, chartGeom, scales);
    }
    drawStream(this.state.svgStreamGroup, scales, {...nextProps});
    if (scales !== this.state.scales) {
      this.setState({scales});
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      removeAxis(this.state.svg);
      const chartGeom = this.calcChartGeom(this.props.width, this.props.height);
      const scales = calcScales(chartGeom, this.props.ticks);
      drawAxis(this.state.svg, chartGeom, scales);
      drawStream(this.state.svgStreamGroup, scales, {...this.props});
      this.setState({scales});
    }
  }
  normalizationSwitch(svgWidth) {
    const styles = getStyles(svgWidth);
    const onClick = () => this.props.dispatch(toggleNormalization);
    return (
      <div style={styles.switchContainer}>
        <button
          key={1}
          style={this.props.normaliseData ? materialButton : materialButtonSelected}
          onClick={onClick}
        >
          <span style={styles.switchTitle}> {"raw data"} </span>
        </button>
        <button
          key={2}
          style={this.props.normaliseData ? materialButtonSelected : materialButton}
          onClick={onClick}
        >
          <span style={styles.switchTitle}> {"normalised data"} </span>
        </button>
      </div>
    );
  }
  render() {
    return (
      <Card title={`Frequencies (coloured by ${this.props.colorOptions[this.props.colorBy].legendTitle})`}>
        {this.normalizationSwitch(this.props.width)}
        <div id="freqinfo"/>
        <svg style={{pointerEvents: "auto"}} width={this.props.width} height={this.props.height}>
          <g ref={(c) => { this.domRef = c; }} id="d3frequencies"/>
        </svg>
      </Card>
    );
  }
}
