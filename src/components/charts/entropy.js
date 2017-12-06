import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import _filter from "lodash/filter";
import { genotypeColors } from "../../util/globals";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./entropyInfoPanel";
import { TOGGLE_MUT_TYPE } from "../../actions/types";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import "../../css/entropy.css";

const calcEntropy = (entropy) => {
  const entropyNt = entropy["nuc"]["val"].map((s, i) => {
    return {x: entropy["nuc"]["pos"][i], y: s};
  });

  const entropyNtWithoutZeros = _filter(entropyNt, (e) => { return e.y !== 0; });

  let aminoAcidEntropyWithoutZeros = [];
  const annotations = [];
  let aaCount = 0;
  for (const prot of Object.keys(entropy)) {
    if (prot !== "nuc") {
      const tmpProt = entropy[prot];
      aaCount += 1;
      annotations.push({
        prot: prot,
        start: tmpProt["pos"][0],
        end: tmpProt["pos"][tmpProt["pos"].length - 1],
        readingFrame: 1, // +tmpProt['pos'][0]%3,
        fill: genotypeColors[aaCount % 10]
      });
      const tmpEntropy = tmpProt["val"].map((s, i) => ({ // eslint-disable-line no-loop-func
        x: tmpProt["pos"][i],
        y: s,
        codon: tmpProt["codon"][i],
        fill: genotypeColors[aaCount % 10],
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

@connect((state) => {
  return {
    mutType: state.controls.mutType,
    entropy: state.entropy.entropy,
    browserDimensions: state.browserDimensions.browserDimensions,
    loaded: state.entropy.loaded,
    colorBy: state.controls.colorBy,
    defaultColorBy: state.controls.defaultColorBy,
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
    this.getChartGeom = (p) => {
      const responsive = computeResponsive({
        horizontal: 1,
        vertical: 0.3,
        browserDimensions: p.browserDimensions,
        sidebar: p.sidebar,
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
      /* 1. switch the redux colorBy back to the default & update the URL */
      this.props.dispatch(changeColorBy(this.props.defaultColorBy, this.context.router));
      /* 2. update the mut type in redux */
      this.props.dispatch({type: TOGGLE_MUT_TYPE, data: newMutType});
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
      calcEntropy(props.entropy),
      { /* callbacks */
        onHover: this.onHover.bind(this),
        onLeave: this.onLeave.bind(this),
        onClick: this.onClick.bind(this)
      }
    );
    chart.render(this.getChartGeom(props), props.mutType);
    this.setState({
      chart,
      chartGeom: this.getChartGeom(props)
    });
    chart.update({aa: props.mutType === "aa"}); // why is this necessary straight after an initial render?!
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
    if (this.state.chart) {
      if ((this.props.browserDimensions !== nextProps.browserDimensions) ||
         (this.props.sidebar !== nextProps.sidebar || this.props.sidebarRight !== nextProps.sidebarRight)) {
        if (nextProps.colorBy.startsWith("gt")) {
          this.state.chart.render(this.getChartGeom(nextProps), nextProps.mutType === "aa", parseEncodedGenotype(nextProps.colorBy));
        } else {
          this.state.chart.render(this.getChartGeom(nextProps), nextProps.mutType === "aa");
        }
      } if (this.props.mutType !== nextProps.mutType) {
        if (nextProps.colorBy.startsWith("gt")) {
          this.state.chart.update({aa: nextProps.mutType === "aa", selected: parseEncodedGenotype(nextProps.colorBy)});
        } else {
          this.state.chart.update({aa: nextProps.mutType === "aa", clearSelected: true});
        }
      }
      if (this.props.colorBy !== nextProps.colorBy && (this.props.colorBy.startsWith("gt") || nextProps.colorBy.startsWith("gt"))) {
        if (!nextProps.colorBy.startsWith("gt")) {
          this.state.chart.update({clearSelected: true});
        } else {
          this.state.chart.update({selected: parseEncodedGenotype(nextProps.colorBy)});
        }
      }
    }
  }

  render() {
    /* get chart geom data */
    const chartGeom = this.getChartGeom(this.props);
    /* get styles */
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
