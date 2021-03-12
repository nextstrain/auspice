import React from "react";
import { withTranslation } from "react-i18next";
import { select } from "d3-selection";
import 'd3-transition';
import { connect } from "react-redux";
import Card from "../framework/card";
import { calcXScale, calcYScale, drawXAxis, drawYAxis, drawProjectionInfo,
  drawStream, processMatrix, parseColorBy, normString } from "./functions";
import "../../css/entropy.css";

@connect((state) => {
  return {
    data: state.frequencies.data,
    pivots: state.frequencies.pivots,
    matrix: state.frequencies.matrix,
    nodes: state.tree.nodes,
    projection_pivot: state.frequencies.projection_pivot,
    version: state.frequencies.version,
    browserDimensions: state.browserDimensions.browserDimensions,
    colorBy: state.controls.colorBy,
    colorScale: state.controls.colorScale,
    colorOptions: state.metadata.colorings,
    normalizeFrequencies: state.controls.normalizeFrequencies
  };
})

class Frequencies extends React.Component {
  constructor(props) {
    super(props);
    this.state = {maxY: 0};
  }
  calcChartGeom(width, height) {
    return {width, height, spaceLeft: 40, spaceRight: 10, spaceBottom: 20, spaceTop: 10};
  }
  recomputeRedrawAll(newState, props) {
    /* modifies newState object which you should then pass to setState */
    const chartGeom = this.calcChartGeom(props.width, props.height);
    const data = processMatrix({...props});
    newState.maxY = data.maxY;
    newState.categories = data.categories;
    const scalesX = calcXScale(chartGeom, props.pivots);
    const scalesY = calcYScale(chartGeom, data.maxY);
    newState.scales = {...scalesX, ...scalesY};
    drawXAxis(newState.svg, chartGeom, scalesX);
    drawYAxis(newState.svg, chartGeom, scalesY);
    drawStream(newState.svgStreamGroup, newState.scales, data, {...props});
    drawProjectionInfo(newState.svg, newState.scales, props.projection_pivot, props.t);
  }
  recomputeRedrawPartial(oldState, oldProps, newProps) {
    /* we don't have to check width / height changes here - that's done in componentDidUpdate */
    const data = processMatrix({...newProps});
    const maxYChange = oldState.maxY !== data.maxY;
    const chartGeom = this.calcChartGeom(newProps.width, newProps.height);
    /* should the y scale be updated? */
    let newScales;
    if (maxYChange) {
      const scalesY = calcYScale(chartGeom, data.maxY);
      drawYAxis(oldState.svg, chartGeom, scalesY);
      newScales = {...oldState.scales, ...scalesY};
    } else {
      newScales = {...oldState.scales};
    }
    /* if !catChange we could transition the streams instead of redrawing them... */
    drawStream(oldState.svgStreamGroup, newScales, data, {...newProps});
    if (maxYChange) {
      drawProjectionInfo(oldState.svg, newScales, newProps.projection_pivot, newProps.t);
    }
    return {...oldState, scales: newScales, maxY: data.maxY, categories: data.categories};
  }
  componentDidMount() {
    /* things that only ever need to be done once, and _don't_ rely on the frequencies actually being loaded */
    const svg = select(this.domRef);
    const svgStreamGroup = svg.append("g");
    const newState = {svg, svgStreamGroup};
    /* things that rely on the data being available: */
    if (this.props.matrix) {
      this.recomputeRedrawAll(newState, this.props);
    }
    this.setState(newState);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.version === nextProps.version) {
      // no-op
    } else if (!this.props.loaded && nextProps.loaded) {
      const newState = {...this.state};
      this.recomputeRedrawAll(newState, nextProps);
      this.setState(newState);
    } else {
      const newState = this.recomputeRedrawPartial(this.state, this.props, nextProps);
      if (newState) this.setState(newState);
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      /* we could be cleverer here, but transitions on window size changes look rubbish anyways */
      const newState = {...this.state};
      this.recomputeRedrawAll(newState, this.props);
      this.setState(newState);
    }
  }
  render() {
    const { t } = this.props;
    const {tipCount, fullTipCount} = this.props.nodes[0];
    return (
      <Card title={`${t("Frequencies")} (${t("colored by")} ${parseColorBy(this.props.colorBy, this.props.colorOptions)} ${t(normString(this.props.normalizeFrequencies, tipCount, fullTipCount))})`}>
        <div
          id="freqinfo"
          style={{
            zIndex: 20,
            position: "absolute",
            borderRadius: "5px",
            padding: "10px",
            backgroundColor: "hsla(0,0%,100%,.9)",
            pointerEvents: "none",
            visibility: "hidden",
            fontSize: "14px"
          }}
        />
        <svg
          id="d3frequenciesSVG"
          width={this.props.width}
          height={this.props.height}
          style={{
            pointerEvents: "auto",
            overflow: "visible"
          }}
        >
          <g ref={(c) => { this.domRef = c; }} id="d3frequencies"/>
        </svg>
      </Card>
    );
  }
}

const WithTranslation = withTranslation()(Frequencies);
export default WithTranslation;
