import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { select } from "d3-selection";
import { changeColorBy } from "../../actions/colors";
import { materialButton, materialButtonSelected } from "../../globalStyles";
// import EntropyChart from "./entropyD3";
// import InfoPanel from "./infoPanel";
import { changeMutType, showCountsNotEntropy } from "../../actions/entropy";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import "../../css/entropy.css";
import { calcScales, drawAxis, drawStream, turnMatrixIntoSeries, generateColorScaleD3, removeStream } from "./functions";

const getStyles = (width) => {
  return {
    switchContainer: {
      position: "absolute",
      marginTop: -5,
      paddingLeft: width - 100
    },
    switchContainerWide: {
      position: "absolute",
      marginTop: -25,
      paddingLeft: width - 185
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
    console.log("Calling D3 methods for frequencies version ", this.props.version);
    const svg = select(this.domRef);
    const chartGeom = computeChartGeometry(this.props);
    // console.log("chartGeom:", chartGeom)
    const scales = calcScales(chartGeom, this.props.ticks);
    drawAxis(svg, chartGeom, scales);
    if (!this.props.matrix) {console.error("Matrix undefined"); return;}
    const categories = Object.keys(this.props.matrix);
    const series = turnMatrixIntoSeries(categories, this.props.pivots.length, this.props.matrix);
    const colourer = generateColorScaleD3(categories, this.props.colorScale);

    const svgStreamGroup = svg.append("g");
    drawStream(svgStreamGroup, scales, categories, this.props.pivots, series, colourer);

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

    console.log("CWRP calling D3 methods");

    const categories = Object.keys(nextProps.matrix);
    const series = turnMatrixIntoSeries(categories, nextProps.pivots.length, nextProps.matrix);
    const colourer = generateColorScaleD3(categories, nextProps.colorScale);
    removeStream(this.state.svgStreamGroup);
    drawStream(this.state.svgStreamGroup, this.state.scales, categories, nextProps.pivots, series, colourer);

    this.setState({categories, series, colourer});


    // if (!nextProps.loaded) {
    //   this.setState({chart: false});
    // }
    // if (!this.state.chart && nextProps.loaded) {
    //   this.setUp(nextProps);
    //   return;
    // }
    // if (this.state.chart && ((this.props.browserDimensions !== nextProps.browserDimensions) || (this.props.padding.left !== nextProps.padding.left || this.props.padding.right !== nextProps.padding.right))) {
    //   this.state.chart.render(nextProps);
    //   return;
    // }
    // if (this.state.chart) { /* props changed => update */
    //   const updateParams = {};
    //   if (this.props.bars !== nextProps.bars) { /* will always be true if mutType has changed */
    //     updateParams.aa = nextProps.mutType === "aa";
    //     updateParams.newBars = nextProps.bars;
    //     updateParams.maxYVal = nextProps.maxYVal;
    //   }
    //   if (this.props.colorBy !== nextProps.colorBy && (this.props.colorBy.startsWith("gt") || nextProps.colorBy.startsWith("gt"))) {
    //     if (!nextProps.colorBy.startsWith("gt")) {
    //       updateParams.clearSelected = true;
    //     } else {
    //       updateParams.selected = parseEncodedGenotype(nextProps.colorBy);
    //     }
    //   }
    //   if (Object.keys(updateParams).length) {
    //     this.state.chart.update(updateParams);
    //   }
    // }
  }

  render() {
    console.log("React render of frequencies...")
    const chartGeom = computeChartGeometry(this.props);
    const styles = getStyles(chartGeom.width);
    return (
      <Card title={"Frequencies"}>
        <svg style={{pointerEvents: "auto"}} width={chartGeom.responsive.width} height={chartGeom.height}>
          <g ref={(c) => { this.domRef = c; }} id="d3frequencies"/>
        </svg>
      </Card>
    );
  }
}
