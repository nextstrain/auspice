import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { sidebarField } from "../../globalStyles";
import { controlsWidth, colorByMenuPreferredOrdering } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype, decodePositions } from "../../util/getGenotype";

/* the reason why we have colorBy as state (here) and in redux
   is for the case where we select genotype, then wait for the
   base to be selected, so we modify state but not yet dispatch */

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    geneLength: state.controls.geneLength,
    colorOptions: state.metadata.colorOptions,
    geneMap: state.entropy.geneMap
  };
})
class ColorBy extends React.Component {
  constructor(props) {
    super(props);

    this.BLANK_STATE = {
      // These are values for controlled form components, so cannot be null.
      colorBySelected: "",
      geneSelected: "",
      positionSelected: ""
    };

    this.state = this.newState({
      colorBySelected: props.colorBy
    });
  }
  static propTypes = {
    colorBy: PropTypes.string.isRequired,
    geneLength: PropTypes.object.isRequired,
    colorOptions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  // Applies the given state to the immutable blank state and replaces the
  // current state with the result.
  replaceState(state) {
    this.setState((oldState, props) => this.newState(state)); // eslint-disable-line no-unused-vars
  }

  newState(state) {
    return {
      ...this.BLANK_STATE,
      ...state
    };
  }

  // State from the outside world enters via props.
  componentWillReceiveProps(nextProps) {
    if (this.props.colorBy !== nextProps.colorBy) {
      if (isColorByGenotype(nextProps.colorBy)) {
        const genotype = decodeColorByGenotype(nextProps.colorBy);

        if (genotype) {
          this.replaceState({
            colorBySelected: "gt",
            geneSelected: genotype.gene,
            positionSelected: genotype.positions.join(",")
          });
        }
      } else {
        this.replaceState({
          colorBySelected: nextProps.colorBy
        });
      }
    }
  }

  // Our internal state is published back to the outside world when it changes.
  componentDidUpdate() {
    const colorBySelected = this.state.colorBySelected;

    if (colorBySelected === "gt") {
      const { geneSelected, positionSelected } = this.state;

      // Only dispatch a change to the app's colorBy if we have a
      // fully-specified genotype (gene and position).
      if (geneSelected && positionSelected) {
        const genotype = encodeColorByGenotype({
          gene: geneSelected,
          positions: decodePositions(positionSelected, this.props.geneLength[geneSelected])
        });

        if (genotype) {
          analyticsControlsEvent("color-by-genotype");
          this.props.dispatch(changeColorBy(genotype));
        }
      }
    } else {
      analyticsControlsEvent(`color-by-${colorBySelected}`);
      this.props.dispatch(changeColorBy(colorBySelected));
    }
  }

  getGtGeneOptions() {
    let options = [];
    if (this.props.geneMap) {
      options = Object.keys(this.props.geneMap).map((prot) => ({value: prot, label: prot}));
      options[options.length] = {value: "nuc", label: "nucleotide"};
    }
    return options;
  }

  gtGeneSelect() {
    const gtGeneOptions = this.getGtGeneOptions();
    return (
      <Select
        name="selectGenotype"
        id="selectGenotype"
        placeholder="gene…"
        value={this.state.geneSelected}
        options={gtGeneOptions}
        clearable={false}
        searchable={true}
        multi={false}
        onChange={(opt) => {
          this.setState({ geneSelected: opt.value });
        }}
      />
    );
  }

  gtPositionInput() {
    const { geneSelected } = this.state;

    const geneLength = Math.floor(this.props.geneLength[geneSelected]);

    const placeholder = geneSelected
      ? `${geneSelected} position (1–${geneLength})…`
      : `position…`;

    return (
      <input
        type="text"
        style={sidebarField}
        placeholder={placeholder}
        value={this.state.positionSelected}
        onChange={(e) => {
          this.setState({ positionSelected: e.target.value });
        }}
      />
    );
  }

  isNormalInteger(str) {
    const n = Math.floor(Number(str));
    return String(n) === str && n >= 0;
  }

  getStyles() {
    return {
      base: {
        width: controlsWidth,
        marginBottom: 0,
        fontSize: 14
      }
    };
  }

  getColorByOptions() {
    return Object.keys(this.props.colorOptions).map((key) => {
      return {
        value: key,
        label: this.props.colorOptions[key].menuItem
      };
    }).sort((a, b) => {
      const [ia, ib] = [colorByMenuPreferredOrdering.indexOf(a.value), colorByMenuPreferredOrdering.indexOf(b.value)];
      if (ia === -1 || ib === -1) {
        if (ia === -1) return 1;
        else if (ib === -1) return -1;
        return 0;
      }
      return ia > ib ? 1 : -1;
    });
  }

  render() {
    const styles = this.getStyles();
    const colorOptions = this.getColorByOptions();
    return (
      <div style={styles.base}>
        <Select
          name="selectColorBy"
          id="selectColorBy"
          value={this.state.colorBySelected}
          options={colorOptions}
          clearable={false}
          searchable={false}
          multi={false}
          onChange={(opt) => {
            this.replaceState({ colorBySelected: opt.value });
          }}
        />
        {this.state.colorBySelected === "gt" ?
          <div>
            {this.gtGeneSelect()}
            {this.gtPositionInput()}
          </div>
          :
          null
        }
      </div>
    );
  }
}

export default ColorBy;
