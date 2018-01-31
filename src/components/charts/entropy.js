import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./entropyInfoPanel";
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

const constructEncodedGenotype = (aa, d) => {
  return aa ? `gt-${d.prot}_${d.codon}` : `gt-nuc_${d.x}`;
};

export const parseEncodedGenotype = (colorBy) => {
  const [name, num] = colorBy.slice(3).split('_');
  const aa = name !== 'nuc';
  const data = {aa, prot: aa ? name : false};
  if (aa) {
    data.codon = parseInt(num, 10);
  } else {
    data.x = parseInt(num, 10);
  }
  return data;
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
    mutType: state.controls.mutType,
    bars: state.entropy.bars,
    annotations: state.entropy.annotations,
    geneMap: state.entropy.geneMap,
    geneLength: state.controls.geneLength,
    maxYVal: state.entropy.maxYVal,
    showCounts: state.entropy.showCounts,
    browserDimensions: state.browserDimensions.browserDimensions,
    loaded: state.entropy.loaded,
    colorBy: state.controls.colorBy,
    defaultColorBy: state.controls.defaults.colorBy,
    shouldReRender: false,
    panelLayout: state.controls.panelLayout
  };
})
export class Entropy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      chart: false
    };
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    entropy: PropTypes.object,
    browserDimensions: PropTypes.object.isRequired,
    loaded: PropTypes.bool.isRequired,
    colorBy: PropTypes.string,
    defaultColorBy: PropTypes.string,
    mutType: PropTypes.string.isRequired
  }

  /* CALLBACKS */
  onHover(d, x, y) {
    // console.log("hovering @", x, y, this.state.chartGeom);
    this.setState({hovered: {d, type: ".tip", x, y, chartGeom: this.state.chartGeom}});
  }
  onLeave() {
    this.setState({hovered: false});
  }
  onClick(d) {
    const colorBy = constructEncodedGenotype(this.props.mutType === "aa", d);
    analyticsControlsEvent("color-by-genotype");
    this.props.dispatch(changeColorBy(colorBy));
    this.setState({hovered: false});
  }

  changeMutTypeCallback(newMutType) {
    if (newMutType !== this.props.mutType) {
      /* 1. switch the redux colorBy back to the default */
      this.props.dispatch(changeColorBy(this.props.defaultColorBy));
      /* 2. update the mut type in redux & re-calulate entropy */
      this.props.dispatch(changeMutType(newMutType));
    }
  }

  aaNtSwitch(styles) {
    return (
      <div style={styles.switchContainer}>
        <button
          key={1}
          style={this.props.mutType === "aa" ? materialButtonSelected : materialButton}
          onClick={() => this.changeMutTypeCallback("aa")}
        >
          <span style={styles.switchTitle}> {"AA"} </span>
        </button>
        <button
          key={2}
          style={this.props.mutType !== "aa" ? materialButtonSelected : materialButton}
          onClick={() => this.changeMutTypeCallback("nuc")}
        >
          <span style={styles.switchTitle}> {"NT"} </span>
        </button>
      </div>
    );
  }
  entropyCountSwitch(styles) {
    return (
      <div style={styles.switchContainerWide}>
        <button
          key={1}
          style={this.props.showCounts ? materialButton : materialButtonSelected}
          onClick={() => this.props.dispatch(showCountsNotEntropy(false))}
        >
          <span style={styles.switchTitle}> {"entropy"} </span>
        </button>
        <button
          key={2}
          style={this.props.showCounts ? materialButtonSelected : materialButton}
          onClick={() => this.props.dispatch(showCountsNotEntropy(true))}
        >
          <span style={styles.switchTitle}> {"counts"} </span>
        </button>
      </div>
    );
  }
  setUp(props) {
    const chart = new EntropyChart(
      this.d3entropy,
      props.annotations,
      props.geneMap,
      props.geneLength.nuc,
      { /* callbacks */
        onHover: this.onHover.bind(this),
        onLeave: this.onLeave.bind(this),
        onClick: this.onClick.bind(this)
      }
    );
    chart.render(props);
    this.setState({chart});
  }
  componentDidMount() {
    if (this.props.loaded) {
      this.setUp(this.props);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (!nextProps.loaded) {
      this.setState({chart: false});
    }
    if (!this.state.chart && nextProps.loaded) {
      this.setUp(nextProps);
      return;
    }
    if (this.state.chart && ((this.props.browserDimensions !== nextProps.browserDimensions) || (this.props.padding.left !== nextProps.padding.left || this.props.padding.right !== nextProps.padding.right))) {
      this.state.chart.render(nextProps);
      return;
    }
    if (this.state.chart) { /* props changed => update */
      const updateParams = {};
      if (this.props.bars !== nextProps.bars) { /* will always be true if mutType has changed */
        updateParams.aa = nextProps.mutType === "aa";
        updateParams.newBars = nextProps.bars;
        updateParams.maxYVal = nextProps.maxYVal;
      }
      if (this.props.colorBy !== nextProps.colorBy && (this.props.colorBy.startsWith("gt") || nextProps.colorBy.startsWith("gt"))) {
        if (!nextProps.colorBy.startsWith("gt")) {
          updateParams.clearSelected = true;
        } else {
          updateParams.selected = parseEncodedGenotype(nextProps.colorBy);
        }
      }
      if (Object.keys(updateParams).length) {
        this.state.chart.update(updateParams);
      }
    }
  }

  render() {
    const chartGeom = computeChartGeometry(this.props);
    const styles = getStyles(chartGeom.width);
    return (
      <Card title={"Diversity"}>
        {this.aaNtSwitch(styles)}
        {this.entropyCountSwitch(styles)}
        <InfoPanel
          hovered={this.state.hovered}
          chartGeom={chartGeom}
          mutType={this.props.mutType}
          showCounts={this.props.showCounts}
        />
        <svg
          id="d3entropyParent"
          style={{pointerEvents: "auto"}}
          width={chartGeom.responsive.width}
          height={chartGeom.height}
        >
          <g ref={(c) => { this.d3entropy = c; }} id="d3entropy"/>
        </svg>
      </Card>
    );
  }
}
