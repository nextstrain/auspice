import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { select } from "d3-selection";
import { withTranslation } from "react-i18next";
import 'd3-transition';
import { FaInfoCircle } from "react-icons/fa";
import { isEqual } from 'lodash';
import Card from "../framework/card";
import { changeColorBy } from "../../actions/colors";
import { tabGroup, tabGroupMember, tabGroupMemberSelected } from "../../globalStyles";
import EntropyChart from "./entropyD3";
import InfoPanel from "./infoPanel";
import { changeEntropyCdsSelection, showCountsNotEntropy } from "../../actions/entropy";
import { ENTROPY_ONSCREEN_CHANGE } from "../../actions/types";
import { timerStart, timerEnd } from "../../util/perf";
import { encodeColorByGenotype } from "../../util/getGenotype";
import { nucleotide_gene } from "../../util/globals";
import { getCdsByName, calcEntropyInView } from "../../util/entropy";
import { StyledTooltip } from "../controls/styles";
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
    resetLayout: {
      position: "absolute",
      right: 190,
      top: 0,
      zIndex: 100
    },
    entropyCountSwitch: {
      position: "absolute",
      right: 50,
      top: 0,
      zIndex: 100
    },
    helpIcon: {
      position: "absolute",
      right: 25,
      top: 3,
      fontSize: '16px', // controls icon size
      cursor: 'help',
      color: '#888'
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
    onScreen: state.entropy.onScreen,
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
    narrativeMode: state.narrative.display,
    showOnlyPanels: state.controls.showOnlyPanels
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
    const colorBy = d.codon===undefined ?
      encodeColorByGenotype({ positions: [d.x] }) :
      encodeColorByGenotype({ gene: this.props.selectedCds.name, positions: [d.codon] });
    this.props.dispatch(changeColorBy(colorBy));
    this.setState({hovered: false});
  }
  onCdsClick(d) {
    /**
     * This callback is only available if we are viewing the genome in the main axis.
     * The color-by is decoupled from the selected CDS / selected position; this callback
     * modifies the entropy selected CDS/positions, but leaves the color-by untouched.
     */
    this.props.dispatch(changeEntropyCdsSelection(getCdsByName(this.props.genomeMap, d.cds.name)));
    this.setState({hovered: false});
  }

  resetLayout(styles) {
    if (this.props.narrativeMode || !this.state.chart) return null;
    const viewingGenome = this.props.selectedCds===nucleotide_gene;
    /**
     * The intention for this button is to be inactive when viewing the genome &
     * fully zoomed out, however zoom actions do not trigger redux state changes
     * which would be necessary for this (see comment in @connect decorator
     * above). Once we fix that it is simple to conditionally inactivate this
     * button.
     */
    return (
      <div style={{...tabGroup, ...styles.resetLayout}}>
        <button
          key={1}
          style={tabGroupMember}
          onClick={() => {
            if (viewingGenome) {
              this.state.chart.update({
                zoomMin: this.state.chart.zoomBounds[0],
                zoomMax: this.state.chart.zoomBounds[1],
              })
            } else {
              this.props.dispatch(changeEntropyCdsSelection(nucleotide_gene));
            }
          }}
        >
          <span style={styles.switchTitle}> {'RESET LAYOUT'} </span>
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
        onClick: this.onClick.bind(this),
        onCdsClick: this.onCdsClick.bind(this)
      }
    );
    chart.render(props);
    if (props.narrativeMode) {
      select(this.d3entropy).selectAll(".handle--custom").style("visibility", "hidden");
    }
    this.setState({chart});
  }
  visibilityOnScreenChange(entries) {
    if (entries.length!==1) {
      return console.error(`Unexpected IntersectionObserver callback entries of length`, entries.length);
    }
    const onScreen = entries[0].isIntersecting;
    if (onScreen===this.props.onScreen) return; // can happen when component initially rendered
    // if gone off screen or come back on screen with the bars still valid then we don't need to recalculate entropy data
    if (!onScreen || this.props.bars) {
      return this.props.dispatch({type: ENTROPY_ONSCREEN_CHANGE, onScreen})
    }
    // else if back on screen and the bars are invalid then we need to regenerate them
    this.props.dispatch((dispatch, getState) => {
      const { entropy, tree } = getState();
      const [entropyData, entropyMaxYVal] = calcEntropyInView(tree.nodes, tree.visibility, entropy.selectedCds, entropy.showCounts);
      dispatch({type: ENTROPY_ONSCREEN_CHANGE, onScreen, entropyData, entropyMaxYVal});
    });
  }
  componentDidMount() {
    if (this.props.loaded) {
      this.setUp(this.props); 
      const observer = new IntersectionObserver(this.visibilityOnScreenChange.bind(this), {threshold: 0.0});
      observer.observe(this.d3entropy)
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
      if (this.props.bars !== nextProps.bars) {
        updateParams.newBars = [nextProps.bars, nextProps.maxYVal];
      }
      if (this.props.selectedCds !== nextProps.selectedCds) {
        updateParams.selectedCds = nextProps.selectedCds;
      }
      if (this.props.showCounts !== nextProps.showCounts) {
        updateParams.showCounts = nextProps.showCounts;
      }
      if (!isEqual(this.props.selectedPositions, nextProps.selectedPositions)) {
        updateParams.selectedPositions = nextProps.selectedPositions
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

  title() {
    if (this.props.width<500) return "Diversity";
    if (this.props.selectedCds===nucleotide_gene) {
      return "Nucleotide diversity of genome"
    }
    return `Amino acid diversity of CDS ${this.props.selectedCds.name}`
  }

  render() {
    const styles = getStyles(this.props.width);
    return (
      <Card infocard={this.props.showOnlyPanels} title={this.title()}>
        <InfoPanel d3event={this.state.hovered.d3event} width={this.props.width} height={this.props.height}>
          {this.state.hovered ? this.state.hovered.tooltip(this.props.t) : null}
        </InfoPanel>
        <svg
          id="d3entropyParent"
          style={{pointerEvents: "auto"}}
          width={this.props.width}
          height={this.props.height}
        >
          {/* TODO: remove intermediate <g>s once the 1Password extension interference is resolved
            * <https://github.com/nextstrain/auspice/issues/1919>
            */}
          <g><g><g><g>
            <g ref={(c) => { this.d3entropy = c; }} id="d3entropy"/>
          </g></g></g></g>
        </svg>
        {this.resetLayout(styles)}
        {this.entropyCountSwitch(styles)}
        <span style={styles.helpIcon} data-tip data-for="entropyHelp">
          <FaInfoCircle/>
        </span>
        <StyledTooltip place="left" type="dark" effect="solid" id="entropyHelp" style={{maxWidth: '50vh'}}>
          <div>
            This panel displays the observed diversity across the current genome or a selected CDS
            {` (currently you are viewing ${this.props.selectedCds===nucleotide_gene?'the genome':`CDS ${this.props.selectedCds.name}`}). `}
            <p/>
            The lower axis shows the genome with +ve strand CDSs above and -ve strand CDSs below and
            the grey overlay allows zooming in to a region.
            The upper axis shows either the zoomed in region of the genome or a selected CDS;
            in the latter case the coordinates represent amino acids.
            <p/>
            Clicking on a CDS will select it and show it on the upper axis.
            {` Clicking "Reset Layout" will always return you to viewing the entire genome.`}
          </div>
        </StyledTooltip>
      </Card>
    );
  }

  componentWillUnmount() {
    // TODO:1050 undo all listeners within EntropyChart (ie this.state.chart)
  }
}

const WithTranslation = withTranslation()(Entropy);
export default WithTranslation;
