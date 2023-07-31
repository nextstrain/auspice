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
import { changeEntropyCdsSelection, showCountsNotEntropy } from "../../actions/entropy";
import { timerStart, timerEnd } from "../../util/perf";
import { encodeColorByGenotype, getCdsFromGenotype } from "../../util/getGenotype";
import { nucleotide_gene, equalArrays } from "../../util/globals";
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
    goBackToNucleotide: {
      position: "absolute",
      right: 144,
      top: 0,
      zIndex: 100
    },
    entropyCountSwitch: {
      position: "absolute",
      right: 5,
      top: 0,
      zIndex: 100
    }
  };
};

@connect((state) => {
  return {
    selectedCds: state.entropy.selectedCds,
    selectedPositions: state.entropy.selectedPositions,
    bars: state.entropy.bars,
    genomeMap: state.entropy.genomeMap,
    maxYVal: state.entropy.maxYVal,
    showCounts: state.entropy.showCounts,
    loaded: state.entropy.loaded,
    colorBy: state.controls.colorBy,
    /**
     * Note that zoomMin & zoomMax only represent the state when changed by a URL
     * i.e. on dataset load or narrative page change. As such, they fall out-of-sync
     * as soon as any user-zooming is performed.
     */
    zoomMin: state.controls.zoomMin,
    zoomMax: state.controls.zoomMax,
    defaultColorBy: state.controls.defaults.colorBy,
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
    selectedCds: PropTypes.any.isRequired,
    selectedPositions: PropTypes.array.isRequired,
  }
  /* CALLBACKS */
  onHover(hovered) {
    this.setState({hovered})
  }
  onLeave() {
    this.setState({hovered: false});
  }
  onClick(d) {
    if (this.props.narrativeMode) return;
    // This will be improved in a subsequent commit
    const geneName = d.codon===undefined ? nucleotide_gene : d.prot;
    const cds = getCdsFromGenotype(geneName, this.props.genomeMap);
    const colorBy = cds===nucleotide_gene ?
      encodeColorByGenotype({ positions: [d.x] }) :
      encodeColorByGenotype({ gene: this.props.selectedCds.name, positions: [d.codon] });
    console.log("<entropy>::barchart-onClick-handler", d, cds, colorBy)
    this.props.dispatch(changeColorBy(colorBy));
    this.setState({hovered: false});
  }

  goBackToNucleotide(styles) {
    if (this.props.narrativeMode) return null;
    if (this.props.selectedCds===nucleotide_gene) return null;
    return (
      <div style={{...tabGroup, ...styles.goBackToNucleotide}}>
        <button
          key={1}
          style={tabGroupMember}
          onClick={() => {
            console.log(" --- > back to nucleotide < ---- ")
            this.props.dispatch(changeEntropyCdsSelection(nucleotide_gene));
          }}
        >
          <span style={styles.switchTitle}> {"⏎ nuc"} </span>
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
      props.genomeMap,
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
  UNSAFE_componentWillReceiveProps(nextProps) {
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
      if (this.props.bars !== nextProps.bars || this.props.selectedCds !== nextProps.selectedCds) { // TODO -- can remove 2nd conditional once bars update every cds change
        updateParams.showCounts = nextProps.showCounts;
        updateParams.selectedCds = nextProps.selectedCds;
        updateParams.newBars = nextProps.bars;
        updateParams.maxYVal = nextProps.maxYVal;
      }
      const cdsChanged = this.props.selectedCds !== nextProps.selectedCds;
      const positionsChanged = cdsChanged || !equalArrays(this.props.selectedPositions, nextProps.selectedPositions);
      if (cdsChanged || positionsChanged) {
        if (nextProps.selectedCds !== nucleotide_gene) {
          /* zoom to the gene - note that this functionality is ~duplicated within entropyD3.js,
          so we call that. The zooming will be revisited in a future commit */
          [updateParams.start, updateParams.end] = this.state.chart._getZoomCoordinates({aa: true, gene: nextProps.selectedCds.name});
          updateParams.gene = nextProps.selectedCds.name;
        } else {

          const positions = nextProps.selectedPositions;
          const zoomCoord = this.state.chart.zoomCoordinates;
          const maxNt = this.props.genomeMap[0].range[1];
          /* find out what new coords would be - if different enough, change zoom */
          let startUpdate, endUpdate;
          if (positions.length > 1) {
            const start = Math.min.apply(null, positions);
            const end = Math.max.apply(null, positions);
            startUpdate = start - (end-start)*0.05;
            endUpdate = end + (end-start)*0.05;
          } else if (positions.length===1) {
            const pos = positions[0];
            const eitherSide = maxNt*0.05;
            const newStartEnd = (pos-eitherSide) <= 0 ? [0, pos+eitherSide] :
              (pos+eitherSide) >= maxNt ? [pos-eitherSide, maxNt] : [pos-eitherSide, pos+eitherSide];
            startUpdate = newStartEnd[0];
            endUpdate = newStartEnd[1];
          } else {
            /* Nucleotide view, no positions selected */
            [startUpdate, endUpdate] = this.state.chart.zoomCoordinates;
          }
          /* if the zoom would be different enough, change it */
          if (!(startUpdate > zoomCoord[0]-maxNt*0.4 && startUpdate < zoomCoord[0]+maxNt*0.4) ||
            !(endUpdate > zoomCoord[1]-maxNt*0.4 && endUpdate < zoomCoord[1]+maxNt*0.4) ||
            !(positions.every((x) => x > zoomCoord[0]) && positions.every((x) => x < zoomCoord[1]))) {
            updateParams.gene = nucleotide_gene;
            updateParams.start = startUpdate;
            updateParams.end = endUpdate;
          }
        }
        if (cdsChanged) updateParams.selectedCds = nextProps.selectedCds;
        if (positionsChanged) updateParams.selectedPositions = nextProps.selectedPositions;
      }
      if (Object.keys(updateParams).length) {
        console.log("d3::update", updateParams)
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
        <InfoPanel d3event={this.state.hovered.d3event} width={this.props.width} height={this.props.height}>
          {this.state.hovered ? this.state.hovered.tooltip(this.props.t) : null}
        </InfoPanel>
        <svg
          id="d3entropyParent"
          style={{pointerEvents: "auto"}}
          width={this.props.width}
          height={this.props.height}
        >
          <g ref={(c) => { this.d3entropy = c; }} id="d3entropy"/>
        </svg>
        {this.goBackToNucleotide(styles)}
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
