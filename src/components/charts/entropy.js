/*eslint-env browser*/
/*eslint dot-notation: "off", max-params: 0*/
import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import * as globals from "../../util/globals";
import Card from "../framework/card";
import computeResponsive from "../../util/computeResponsive";
import { changeColorBy } from "../../actions/colors";
import { modifyURLquery } from "../../util/urlHelpers";
import { materialButton, materialButtonSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./entropyInfoPanel";
import "../../css/entropy.css";
import { changeMutType } from "../../actions/treeProperties";

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
    mutType: state.controls.mutType,
    entropy: state.entropy.entropy,
    browserDimensions: state.browserDimensions.browserDimensions,
    load: state.entropy.loadStatus,
    shouldReRender: false
  };
})
class Entropy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false
    };
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }
  static propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    entropy: React.PropTypes.object,
    sidebar: React.PropTypes.bool,
    browserDimensions: React.PropTypes.object,
    load: React.PropTypes.number
  }

  setColorByGenotype(colorBy) {
    this.props.dispatch(changeColorBy(colorBy));
    modifyURLquery(this.context.router, {c: colorBy}, true);
  }

  getChartGeom() {
    const responsive = computeResponsive({
      horizontal: 1,
      vertical: .3333333,
      browserDimensions: this.props.browserDimensions,
      sidebar: this.props.sidebar
    });
    return {
      responsive,
      width: responsive.width,
      height: 300,
      padBottom: 50,
      padLeft: 15,
      padRight: 12
    };
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
    if (this.props.mutType === "aa") {
      this.setColorByGenotype("gt-" + d.prot + "_" + (d.codon + 1));
    } else {
      this.setColorByGenotype("gt-nuc_" + (d.x + 1));
    }
    this.setState({hovered: false});
  }

  changeMutTypeCallback(newMutType) {
    if (newMutType !== this.props.mutType) {
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
  componentWillReceiveProps(nextProps) {
    if (this.props.load !== nextProps.load && nextProps.load === 2) {
      const chart = new EntropyChart(
        this.refs.d3entropy,
        calcEntropy(nextProps.entropy),
        { /* callbacks */
          onHover: this.onHover.bind(this),
          onLeave: this.onLeave.bind(this),
          onClick: this.onClick.bind(this)
        }
      );
      chart.render(this.getChartGeom());
      this.setState({
        chart,
        chartGeom: this.getChartGeom(),
        shouldReRender: true
      });
    } else if (nextProps.load === 2 && this.props.sidebar !== nextProps.sidebar) {
      this.setState({shouldReRender: true});
    }
  }
  // componentDidMount() {
  //   this.repaint();
  // }
  componentDidUpdate() {
    if (this.state.shouldReRender && this.state.chart && this.props.browserDimensions) {
      this.setState({shouldReRender: false});
      this.state.chart.render(this.getChartGeom(), this.props.mutType === "aa");
    } else {
      this.state.chart.updateMutType(this.props.mutType === "aa")
    }
  }
  // repaint() {
  //   if (this.state.chart && this.props.browserDimensions) {
  //     this.state.chart.render(this.getChartGeom());
  //   }
  // }
  render() {

    /* get chart geom data */
    const chartGeom = this.getChartGeom();
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
          style={{pointerEvents: "auto"}}
          width={chartGeom.responsive.width}
          height={chartGeom.height}
        >
          <g ref="d3entropy" id="d3entropy"/>
        </svg>
      </Card>
    );
  }
}

export default Entropy;
