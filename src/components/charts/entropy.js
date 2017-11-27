import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./entropyInfoPanel";
import { changeMutType } from "../../actions/entropy";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import "../../css/entropy.css";

const getStyles = (width) => {
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

/* these two functions convert between the genotype naming system used in the URLs,
e.g. 'gt-nuc_1234', 'gt-NS1-123' and the data structure used in entropy.json
note that the numbering systems are not the same! */
const constructEncodedGenotype = (aa, d) => {
  return aa ? 'gt-' + d.prot + "_" + (d.codon + 1) : 'gt-nuc_' + (d.x + 1);
};
const parseEncodedGenotype = (colorBy) => {
  const [name, num] = colorBy.slice(3).split('_');
  const aa = name !== 'nuc';
  const data = {aa, prot: aa ? name : false};
  if (aa) {
    data.codon = num - 1;
  } else {
    data.x = num - 1;
  }
  return data;
};

const getChartGeom = (props) => {
  const responsive = computeResponsive({
    horizontal: 1,
    vertical: 0.3,
    browserDimensions: props.browserDimensions,
    sidebar: props.sidebar,
    sidebarRight: p.sidebarRight,
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
    maxNt: state.entropy.maxNt,
    maxYVal: state.entropy.maxYVal,
    browserDimensions: state.browserDimensions.browserDimensions,
    loaded: state.entropy.loaded,
    colorBy: state.controls.colorBy,
    defaultColorBy: state.controls.defaults.colorBy,
    shouldReRender: false,
    panelLayout: state.controls.panelLayout
  };
})
class Entropy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
      chart: false
    };
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    entropy: PropTypes.object,
    sidebar: PropTypes.bool.isRequired,
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
    this.props.dispatch(changeColorBy(colorBy, this.context.router));
    this.setState({hovered: false});
  }

  changeMutTypeCallback(newMutType) {
    if (newMutType !== this.props.mutType) {
      /* 1. switch the redux colorBy back to the default */
      this.props.dispatch(changeColorBy(this.props.defaultColorBy, this.context.router));
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
  setUp(props) {
    const chart = new EntropyChart(
      this.d3entropy,
      props.annotations,
      props.geneMap,
      props.maxNt,
      { /* callbacks */
        onHover: this.onHover.bind(this),
        onLeave: this.onLeave.bind(this),
        onClick: this.onClick.bind(this)
      }
    );
    chart.render(getChartGeom(props), props.bars, props.maxYVal, props.mutType === "aa");
    this.setState({
      chart,
      chartGeom: getChartGeom(props)
    });
<<<<<<< HEAD
    /* unsure why this cannot be incorporated into the initial render... */
    chart.update({
      selected: parseEncodedGenotype(props.colorBy),
      aa: props.mutType === "aa"
    });
=======
>>>>>>> improve interface between react & D3
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
<<<<<<< HEAD
    if (this.state.chart) {
      if ((this.props.browserDimensions !== nextProps.browserDimensions) ||
         (this.props.sidebar !== nextProps.sidebar || this.props.sidebarRight !== nextProps.sidebarRight)) {
        if (nextProps.colorBy.startsWith("gt")) {
          this.state.chart.render(this.getChartGeom(nextProps), nextProps.mutType === "aa", parseEncodedGenotype(nextProps.colorBy));
        } else {
          this.state.chart.render(this.getChartGeom(nextProps), nextProps.mutType === "aa");
        }
      }
      // can we return here?!?!?!
=======
    if (this.state.chart &&
      ((this.props.browserDimensions !== nextProps.browserDimensions) || (this.props.sidebar !== nextProps.sidebar))) {
      this.state.chart.render(
        getChartGeom(nextProps),
        nextProps.bars,
        nextProps.maxYVal,
        nextProps.mutType === "aa",
        nextProps.colorBy.startsWith("gt") ? parseEncodedGenotype(nextProps.colorBy) : undefined
      );
      return;
    }
    if (this.state.chart) { /* props changed => update */
>>>>>>> improve interface between react & D3
      const updateParams = {};
      if (this.props.mutType !== nextProps.mutType) {
        updateParams.aa = nextProps.mutType === "aa";
        if (nextProps.colorBy.startsWith("gt")) {
          updateParams.selected = parseEncodedGenotype(nextProps.colorBy);
        } else {
          updateParams.clearSelected = true;
        }
      }
      if (this.props.bars !== nextProps.bars) { /* will always be true if mutType has changed */
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
        console.log("updateParams:", updateParams)
        this.state.chart.update(updateParams);
      }
    }
  }

  render() {
    const chartGeom = getChartGeom(this.props);
    const styles = getStyles(chartGeom.width);
    return (
      <Card title={"Diversity"}>
        {this.aaNtSwitch(styles)}
        <InfoPanel
          hovered={this.state.hovered}
          mutType={this.props.mutType}
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

export default Entropy;
