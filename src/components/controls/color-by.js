import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { sidebarField } from "../../globalStyles";
import { controlsWidth } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

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
      if (nextProps.colorBy.startsWith("gt")) {
        const matches = nextProps.colorBy.match(/gt-(.+)_(.+)$/);
        this.setState({
          colorBySelected: "gt",
          geneSelected: matches[1],
          positionSelected: matches[2]
        });
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
    if (colorBy.slice(0, 2) !== "gt") {
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
        multi={false}
        onChange={(opt) => {
          const gene = opt.value;
          const position = this.state.positionSelected;
          this.setState({geneSelected: gene});
          this.setGenotypeColoring(gene, position);
        }}
      />
    );
  }

  gtPositionInput() {

    // let value = "";
    // if (this.props.colorBy) {
    //   if (this.props.colorBy.slice(0, 2) === "gt") {
    //     value = this.props.colorBy.slice(3);
    //   }
    // }

    if (this.state.colorBySelected === "gt") {
      return (
        <input
          type="text"
          style={sidebarField}
          placeholder={this.state.geneSelected + " position..."}
          value={this.state.positionSelected}
          onChange={(e) => {
            const gene = this.state.geneSelected;
            const position = e.target.value;
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
    // check if this is any sort of integer
    if (!this.isNormalInteger(position)) {
      return;
    }
    // check if integer is in range
    if (parseInt(position, 10) < 1 || parseInt(position, 10) > this.props.geneLength[gene]) {
      return;
    }
    const colorBy = "gt-" + gene + "_" + position;
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
    const options = Object.keys(this.props.colorOptions).map((key) => {
      return {
        value: key,
        label: this.props.colorOptions[key].menuItem
      };
    });
    return options;
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
