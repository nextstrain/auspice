import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import Select from "react-select";
import { sidebarField } from "../../globalStyles";
import { defaultColorBy, controlsWidth } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { modifyURLquery } from "../../util/urlHelpers";
import { analyticsControlsEvent } from "../../util/googleAnalytics";

/* Why does this have colorBy set as state (here) and in redux?
   it's for the case where we select genotype, then wait for the
   base to be selected, so we modify state but not yet dispatch
*/

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    geneLength: state.sequences.geneLength,
    colorOptions: state.metadata.colorOptions,
    entropy: state.entropy.entropy
  };
})
class ColorBy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      colorBySelected: defaultColorBy,
      geneSelected: "nuc",
      positionSelected: ""
    };
  }
  static propTypes = {
    colorBy: PropTypes.string.isRequired,
    geneLength: PropTypes.object,
    colorOptions: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired
  }
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillReceiveProps(nextProps) {
    const colorBy = nextProps.colorBy;
    if (colorBy) {
      const selected = (colorBy.slice(0, 2) !== "gt") ? colorBy : "gt";
      this.setState({colorBySelected: selected});
    }
  }

  setColorBy(colorBy) {
    if (colorBy.slice(0, 2) !== "gt") {
      analyticsControlsEvent(`color-by-${colorBy}`);
      this.props.dispatch(changeColorBy(colorBy));
      modifyURLquery(this.context.router, {c: colorBy}, true);
      this.setState({colorBySelected: colorBy});
    } else {
      // don't update colorBy yet, genotype still needs to be specified
      this.setState({colorBySelected: "gt"});
    }
  }

  getGtGeneOptions() {
    let options = [];
    if (this.props.entropy) {
      options = Object.keys(this.props.entropy).map((prot) => {
        return {
          value: prot,
          label: prot === "nuc" ? "nucleotide" : prot
        };
      });
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
          this.setState({geneSelected: opt.value});
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
            this.setState({positionSelected: e.target.value});
            this.setGenotypeColorByFromInput(e.target.value);
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

  setGenotypeColorByFromInput(position) {
    // check if this is any sort of integer
    if (!this.isNormalInteger(position)) {
      return;
    }
    // check if integer is in range
    const gene = this.state.geneSelected;
    if (parseInt(position, 10) < 1 || parseInt(position, 10) > this.props.geneLength[gene]) {
      return;
    }
    const colorBy = "gt-" + gene + "_" + position;
    analyticsControlsEvent("color-by-genotype");
    this.props.dispatch(changeColorBy(colorBy));
    modifyURLquery(this.context.router, {c: colorBy}, true);
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
          <div/>
        }
      </div>
    );
  }
}

export default ColorBy;
