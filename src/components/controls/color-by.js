import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { debounce } from "lodash";
import { sidebarField } from "../../globalStyles";
import { controlsWidth, nucleotide_gene } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype, decodePositions, getCdsLength } from "../../util/getGenotype";
import CustomSelect from "./customSelect";

/* the reason why we have colorBy as state (here) and in redux
   is for the case where we select genotype, then wait for the
   base to be selected, so we modify state but not yet dispatch */

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    colorings: state.metadata.colorings,
    genomeMap: state.entropy.genomeMap,
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

    if (isColorByGenotype(props.colorBy)) {
      const genotype = decodeColorByGenotype(props.colorBy);

      if (genotype) {
        this.state = this.newState({
          colorBySelected: "gt",
          geneSelected: genotype.gene,
          positionSelected: genotype.positions.join(",")
        });
      }
    } else {
      this.state = this.newState({
        colorBySelected: props.colorBy
      });
    }
  }
  static propTypes = {
    colorBy: PropTypes.string.isRequired,
    colorings: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    genomeMap: PropTypes.array,
  }

  // Applies the given state to the immutable blank state and replaces the
  // current state with the result.
  replaceState(state) {
    this.setState((_oldState, _props) => this.newState(state));
  }

  newState(state) {
    return {
      ...this.BLANK_STATE,
      ...state
    };
  }

  // State from the outside world enters via props.
  UNSAFE_componentWillReceiveProps(nextProps) {
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
          positions: decodePositions(positionSelected, getCdsLength(this.props.genomeMap, geneSelected))
        });

        if (genotype && genotype!==this.props.colorBy) {
          this.dispatchColorByGenotype(genotype);
        }
      }
    } else {
      this.dispatchColorBy(colorBySelected);
    }
  }

  /**
   * Avoids double invocation of change() method
   */
  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.colorBySelected === nextState.colorBySelected &&
        this.state.geneSelected === nextState.geneSelected &&
        this.state.positionSelected === nextState.positionSelected &&
        this.props.colorings === nextProps.colorings) {
      return false;
    }
    return true;
  }

  dispatchColorBy(colorBy, name = colorBy) {
    analyticsControlsEvent(`color-by-${name}`);
    this.props.dispatch(changeColorBy(colorBy));
  }

  dispatchColorByGenotype = debounce((genotype) => {
    this.dispatchColorBy(genotype, "genotype");
  }, 400);

  getGtGeneOptions() {
    if (!this.props.genomeMap?.length) return [];
    const options = [
      // Nuc is first option, especially helpful when there are many many genes/CDSs
      {value: nucleotide_gene, label: "nucleotide"}
    ]
    this.props.genomeMap[0].genes.forEach((gene) => {
      /**
       * A lot of the code in this file refers to "gene(s)", however the actual dropdown
       * options represent CDSs, as these are what we have translations / mutations for.
       * The `genomeMap` differentiates between the two, and we may one day have a more
       * complex dropdown UI which exposes the associated gene for a CDS.
       */
      gene.cds.forEach((cds) => {
        options.push({value: cds.name, label: cds.name})
      })
    })
    return options;
  }

  gtGeneSelect() {
    const gtGeneOptions = this.getGtGeneOptions();
    return (
      <CustomSelect
        name="selectGenotype"
        id="selectGenotype"
        placeholder="gene…"
        value={gtGeneOptions.filter(({value}) => value === this.state.geneSelected)}
        options={gtGeneOptions}
        isClearable={false}
        isSearchable
        isMulti={false}
        onChange={(opt) => {
          this.setState({ geneSelected: opt.value });
        }}
      />
    );
  }

  gtPositionInput() {
    const { geneSelected } = this.state;

    const placeholder = geneSelected
      ? `${geneSelected} position (1–${getCdsLength(this.props.genomeMap, geneSelected)})…`
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

  render() {
    const styles = this.getStyles();

    const colorOptions = Object.keys(this.props.colorings)
      .map((key) => ({value: key, label: this.props.colorings[key].title}));

    return (
      <div style={styles.base} id="selectColorBy">
        <CustomSelect
          name="selectColorBy"
          value={colorOptions.filter(({value}) => value === this.state.colorBySelected)}
          options={colorOptions}
          isClearable={false}
          isSearchable
          isMulti={false}
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

export const ColorByInfo = (
  <>
    Change the metadata field which the visualisation is coloured by.
    <br/>
    The phylogeny, map and frequencies panel (if available) will all be coloured
    in a consistent fashion.
  </>
);

export default ColorBy;
