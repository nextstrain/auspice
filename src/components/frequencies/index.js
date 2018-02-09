import React from "react";
import { select } from "d3-selection";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import { toggleNormalization } from "../../actions/frequencies";
import "../../css/entropy.css";
import { calcScales, drawAxis, drawStream, turnMatrixIntoSeries, generateColorScaleD3, removeStream, drawTooltip, getMeaningfulLabels, getOrderedCategories } from "./functions";

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

export const computeChartGeometry = (props) => {
  const responsive = computeResponsive({
    horizontal: 1,
    vertical: 0.3,
    browserDimensions: props.browserDimensions,
    padding: props.padding,
    minHeight: 150
  });
  return {
    responsive,
    width: responsive.width,
    height: responsive.height,
    padBottom: 50,
    padLeft: 15,
    padRight: 12
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
    colorScale: state.controls.colorScale
  };
})
export class Frequencies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    /* Render frequencies (via D3) for the first time. DOM element exists. */
    console.log("Calling D3 (initial render of frequencies) (version ", this.props.version, ")");
    const svg = select(this.domRef);
    const chartGeom = computeChartGeometry(this.props);
    const scales = calcScales(chartGeom, this.props.ticks);
    drawAxis(svg, chartGeom, scales);
    if (!this.props.matrix) {console.error("Matrix undefined"); return;}
    const categories = getOrderedCategories(this.props.matrix);
    const series = turnMatrixIntoSeries(categories, this.props.pivots.length, this.props.matrix);
    const colourer = generateColorScaleD3(categories, this.props.colorScale);
    drawTooltip();
    const labels = getMeaningfulLabels(categories, this.props.colorScale);
    const svgStreamGroup = svg.append("g");
    drawStream(svgStreamGroup, scales, this.props.colorBy, labels, this.props.pivots, series, colourer);
    this.setState({svg, svgStreamGroup, chartGeom, scales, categories, series, colourer});
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.version === nextProps.version) {
      console.log("frequencies CWRP running, but the versions haven't changed, so doing nothing");
      return;
    }
    if (this.props.colorBy === nextProps.colorBy) {
      console.log("CWRP. colorBy unchanged. Should make nice transition");
    }
    console.log("Calling D3 for frequencies (version ", nextProps.version, ")");
    const categories = getOrderedCategories(this.props.matrix);
    const series = turnMatrixIntoSeries(categories, nextProps.pivots.length, nextProps.matrix);
    const colourer = generateColorScaleD3(categories, nextProps.colorScale);
    const labels = getMeaningfulLabels(categories, nextProps.colorScale);
    removeStream(this.state.svgStreamGroup);
    drawStream(this.state.svgStreamGroup, this.state.scales, nextProps.colorBy, labels, nextProps.pivots, series, colourer);
    this.setState({categories, series, colourer});
  }
  normalizationSwitch(styles) {
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
    console.log("React render of frequencies...")
    const chartGeom = computeChartGeometry(this.props);
    const styles = getStyles(chartGeom.width);
    return (
      <Card title={"Frequencies"}>
        {this.normalizationSwitch(styles)}
        <div id="freqinfo"/>
        <svg style={{pointerEvents: "auto"}} width={chartGeom.responsive.width} height={chartGeom.height}>
          <g ref={(c) => { this.domRef = c; }} id="d3frequencies"/>
        </svg>
      </Card>
    );
  }
}
