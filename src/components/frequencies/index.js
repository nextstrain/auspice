import React from "react";
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { materialButton, materialButtonSelected } from "../../globalStyles";
// import EntropyChart from "./entropyD3";
// import InfoPanel from "./infoPanel";
import { changeMutType, showCountsNotEntropy } from "../../actions/entropy";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import "../../css/entropy.css";

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
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy
  };
})
export class Frequencies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      chart: false
    };
  }

  // setUp(props) {
  //   const chart = new EntropyChart(
  //     this.d3entropy,
  //     props.annotations,
  //     props.geneMap,
  //     props.geneLength.nuc,
  //     { /* callbacks */
  //       onHover: this.onHover.bind(this),
  //       onLeave: this.onLeave.bind(this),
  //       onClick: this.onClick.bind(this)
  //     }
  //   );
  //   chart.render(props);
  //   this.setState({chart});
  // }
  componentDidMount() {
    // if (this.props.loaded) {
    //   this.setUp(this.props);
    // }
  }
  componentWillReceiveProps(nextProps) {
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
    const chartGeom = computeChartGeometry(this.props);
    const styles = getStyles(chartGeom.width);
    return (
      <Card title={"Frequencies"}>
        <svg style={{pointerEvents: "auto"}} width={chartGeom.responsive.width} height={chartGeom.height}>
          <g ref={(c) => { this.d3frequencies = c; }} id="d3frequencies"/>
        </svg>
      </Card>
    );
  }
}
