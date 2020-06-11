import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { select } from "d3-selection";
import { withTranslation } from "react-i18next";
import 'd3-transition';
import Card from "../framework/card";
import { changeColorBy } from "../../actions/colors";
import { tabGroup, tabGroupMember, tabGroupMemberSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./infoPanel";
import { changeMutType, showCountsNotEntropy } from "../../actions/entropy";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { timerStart, timerEnd } from "../../util/perf";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype } from "../../util/getGenotype";
import { nucleotide_gene } from "../../util/globals";
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
    },
    aaNtSwitch: {
      position: "absolute",
      right: 5,
      top: 0,
      zIndex: 100
    },
    entropyCountSwitch: {
      position: "absolute",
      right: 74,
      top: 0,
      zIndex: 100
    }
  };
};

const constructEncodedGenotype = (mutType, d) => {
  return encodeColorByGenotype(
    mutType === "aa"
      ? { gene: d.prot, positions: [d.codon] }
      : { positions: [d.x] }
  );
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
    loaded: state.entropy.loaded,
    colorBy: state.controls.colorBy,
    zoomMin: state.controls.zoomMin,
    zoomMax: state.controls.zoomMax,
    defaultColorBy: state.controls.defaults.colorBy,
    shouldReRender: false,
    panelLayout: state.controls.panelLayout,
    narrativeMode: state.narrative.display
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
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    loaded: PropTypes.bool.isRequired,
    colorBy: PropTypes.string.isRequired,
    defaultColorBy: PropTypes.string.isRequired,
    mutType: PropTypes.string.isRequired
  }

  /* CALLBACKS */
  onHover(d, x, y) {
    // console.log("hovering @", x, y, this.state.chartGeom);
    this.setState({hovered: {d, type: ".tip", x, y}});
  }
  onLeave() {
    this.setState({hovered: false});
  }
  onClick(d) {
    if (this.props.narrativeMode) return;
    const colorBy = constructEncodedGenotype(this.props.mutType, d);
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
    if (this.props.narrativeMode) return null;
    return (
      <div style={{...tabGroup, ...styles.aaNtSwitch}}>
        <button
          key={1}
          style={this.props.mutType === "aa" ? tabGroupMemberSelected : tabGroupMember}
          onClick={() => this.changeMutTypeCallback("aa")}
        >
          <span style={styles.switchTitle}> {"AA"} </span>
        </button>
        <button
          key={2}
          style={this.props.mutType !== "aa" ? tabGroupMemberSelected : tabGroupMember}
          onClick={() => this.changeMutTypeCallback("nuc")}
        >
          <span style={styles.switchTitle}> {"NT"} </span>
        </button>
      </div>
    );
  }
  entropyCountSwitch(styles) {
    const { t } = this.props;
    if (this.props.narrativeMode) return null;
    return (
      <div style={{...tabGroup, ...styles.entropyCountSwitch}}>
        <button
          key={1}
          style={this.props.showCounts ? tabGroupMember : tabGroupMemberSelected}
          onClick={() => this.props.dispatch(showCountsNotEntropy(false))}
        >
          <span style={styles.switchTitle}> {t("entropy")} </span>
        </button>
        <button
          key={2}
          style={this.props.showCounts ? tabGroupMemberSelected : tabGroupMember}
          onClick={() => this.props.dispatch(showCountsNotEntropy(true))}
        >
          <span style={styles.switchTitle}> {t("events")} </span>
        </button>
      </div>
    );
  }
  setUp(props) {
    const chart = new EntropyChart(
      this.d3entropy,
      props.annotations,
      props.geneMap,
      props.geneLength[nucleotide_gene],
      { /* callbacks */
        onHover: this.onHover.bind(this),
        onLeave: this.onLeave.bind(this),
        onClick: this.onClick.bind(this)
      }
    );
    chart.render(props);
    if (props.narrativeMode) {
      select(this.d3entropy).selectAll(".handle--custom").style("visibility", "hidden");
    }
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
    if (!this.state.chart) {
      if (nextProps.loaded) {
        this.setUp(nextProps);
      }
      return;
    }
    // if we're here, then this.state.chart exists
    if (this.props.width !== nextProps.width || this.props.height !== nextProps.height) {
      timerStart("entropy initial render");
      this.state.chart.render(nextProps);
      timerEnd("entropy initial render");
    } else { /* props changed, but a new render probably isn't required */
      timerStart("entropy D3 update");
      const updateParams = {};
      if (this.props.zoomMax !== nextProps.zoomMax || this.props.zoomMin !== nextProps.zoomMin) {
        updateParams.zoomMax = nextProps.zoomMax;
        updateParams.zoomMin = nextProps.zoomMin;
      }
      if (this.props.bars !== nextProps.bars) { /* will always be true if mutType has changed */
        updateParams.aa = nextProps.mutType === "aa";
        updateParams.newBars = nextProps.bars;
        updateParams.maxYVal = nextProps.maxYVal;
      }
      if (this.props.colorBy !== nextProps.colorBy && (isColorByGenotype(this.props.colorBy) || isColorByGenotype(nextProps.colorBy))) {
        if (isColorByGenotype(nextProps.colorBy)) {
          const colorByGenotype = decodeColorByGenotype(nextProps.colorBy, nextProps.geneLength);
          if (colorByGenotype.aa) {  /* if it is a gene, zoom to it */
            updateParams.gene = colorByGenotype.gene;
            updateParams.start = nextProps.geneMap[updateParams.gene].start;
            updateParams.end = nextProps.geneMap[updateParams.gene].end;
          } else { /* if a nuc, want to do different things if 1 or multiple */
            const positions = colorByGenotype.positions;
            const zoomCoord = this.state.chart.zoomCoordinates;
            const maxNt = this.state.chart.maxNt;
            /* find out what new coords would be - if different enough, change zoom */
            let startUpdate, endUpdate;
            if (positions.length > 1) {
              const start = Math.min.apply(null, positions);
              const end = Math.max.apply(null, positions);
              startUpdate = start - (end-start)*0.05;
              endUpdate = end + (end-start)*0.05;
            } else {
              const pos = positions[0];
              const eitherSide = maxNt*0.05;
              const newStartEnd = (pos-eitherSide) <= 0 ? [0, pos+eitherSide] :
                (pos+eitherSide) >= maxNt ? [pos-eitherSide, maxNt] : [pos-eitherSide, pos+eitherSide];
              startUpdate = newStartEnd[0];
              endUpdate = newStartEnd[1];
            }
            /* if the zoom would be different enough, change it */
            if (!(startUpdate > zoomCoord[0]-maxNt*0.4 && startUpdate < zoomCoord[0]+maxNt*0.4) ||
              !(endUpdate > zoomCoord[1]-maxNt*0.4 && endUpdate < zoomCoord[1]+maxNt*0.4) ||
              !(positions.every((x) => x > zoomCoord[0]) && positions.every((x) => x < zoomCoord[1]))) {
              updateParams.gene = colorByGenotype.gene;
              updateParams.start = startUpdate;
              updateParams.end = endUpdate;
            }
          }
          updateParams.selected = decodeColorByGenotype(nextProps.colorBy, nextProps.geneLength);
        } else {
          updateParams.clearSelected = true;
        }
      }
      if (Object.keys(updateParams).length) {
        this.state.chart.update(updateParams);
      }
      timerEnd("entropy D3 update");
    }
    /* perhaps hide the brush due to the narrative */
    if (this.props.narrativeMode !== nextProps.narrativeMode) {
      if (nextProps.narrativeMode) {
        select(this.d3entropy).selectAll(".handle--custom").style("visibility", "hidden");
      } else {
        select(this.d3entropy).selectAll(".handle--custom").style("visibility", "visible");
      }
    }
  }

  render() {
    const { t } = this.props;
    const styles = getStyles(this.props.width);
    return (
      <Card title={t("Diversity")}>
        <InfoPanel
          hovered={this.state.hovered}
          width={this.props.width}
          height={this.props.height}
          mutType={this.props.mutType}
          showCounts={this.props.showCounts}
          geneMap={this.props.geneMap}
          t={t}
        />
        <svg
          id="d3entropyParent"
          style={{pointerEvents: "auto"}}
          width={this.props.width}
          height={this.props.height}
        >
          <g ref={(c) => { this.d3entropy = c; }} id="d3entropy"/>
        </svg>
        {this.aaNtSwitch(styles)}
        {this.entropyCountSwitch(styles)}
      </Card>
    );
  }

  componentWillUnmount() {
    // TODO:1050 undo all listeners within EntropyChart (ie this.state.chart)
  }
}

const WithTranslation = withTranslation()(Entropy);
export default WithTranslation;
