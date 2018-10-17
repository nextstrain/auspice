import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { sidebarField } from "../../globalStyles";
import { controlsWidth, colorByMenuPreferredOrdering } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype } from "../../util/getGenotype";

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
    this.state = {
      colorBySelected: props.colorBy,
      geneSelected: "nuc",
      positionSelected: ""
    };
  }
  static propTypes = {
    colorBy: PropTypes.string.isRequired,
    geneLength: PropTypes.object.isRequired,
    colorOptions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.colorBy !== nextProps.colorBy) {
      if (isColorByGenotype(nextProps.colorBy)) {
        const genotype = decodeColorByGenotype(nextProps.colorBy);

        if (genotype) {
          this.setState({
            colorBySelected: "gt",
            geneSelected: genotype.gene,
            positionSelected: genotype.positions.join(",")
          });
        }
      } else {
        this.setState({
          colorBySelected: nextProps.colorBy,
          geneSelected: "nuc",
          positionSelected: ""
        });
      }
    }
  }

  setColorBy(colorBy) {
    if (!isColorByGenotype(colorBy)) {
      analyticsControlsEvent(`color-by-${colorBy}`);
      this.props.dispatch(changeColorBy(colorBy));
      this.setState({colorBySelected: colorBy});
    } else {
      // don't update colorBy yet, genotype still needs to be specified
      let geneSelected = "nuc"; /* a safe default */
      if (this.getGtGeneOptions().filter((d) => d.label === "HA1").length) {
        geneSelected = "HA1";
      }
      this.setState({colorBySelected: "gt", geneSelected});
      const gene = geneSelected;
      const position = this.state.positionSelected;
      this.setGenotypeColoring(gene, position);
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
        value={this.state.geneSelected}
        options={gtGeneOptions}
        clearable={false}
        searchable={true}
        multi={false}
        onChange={(opt) => {
          const gene = opt.value;
          const position = this.state.positionSelected;
          this.setState({geneSelected: gene, positionSelected:gene+" positions..."});
          this.setGenotypeColoring(gene, position);
        }}
      />
    );
  }

  gtPositionInput() {
    if (this.state.colorBySelected === "gt") {
      return (
        <input
          type="text"
          style={sidebarField}
          placeholder={this.state.geneSelected + " positions..."}
          value={this.state.positionSelected}
          onChange={(e) => {
            const gene = this.state.geneSelected;
            const position = e.target.value;
            console.log("gtPositionInput -> ", gene, position);
            this.setState({positionSelected: position});
            this.setGenotypeColoring(gene, position);
          }}
        />
      );
    }
    return null;
  }

  isNormalInteger(str) {
    const n = Math.floor(Number(str));
    return String(n) === str && n >= 0;
  }

  setGenotypeColoring(gene, position) {
    if (!position) {
      if (gene==="nuc") return;
      position = "1"; /* if it's a gene, set position to trigger zoom */
    }
    let positions = position.split(',').filter((x) => parseInt(x, 10)); /* get rid of non-ints */
    if (!positions.length) return; /* do nothing if no ints */
    if (!(positions.every((x) => x > 0) && positions.every((x) => x <= this.props.geneLength[gene]))) {
      positions = [1];  /* is positions are outside gene, set to 1 to trigger zoom */
    }
    const colorBy = encodeColorByGenotype({ gene, positions });
    analyticsControlsEvent("color-by-genotype");
    this.props.dispatch(changeColorBy(colorBy));
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
            this.setColorBy(opt.value);
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
