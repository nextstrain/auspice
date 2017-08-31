import React from "react";
import { connect } from "react-redux";
import { defaultColorBy } from "../../util/globals";
import { parseGenotype } from "../../util/getGenotype";
import { select } from "../../globalStyles";
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
    colorOptions: state.metadata.colorOptions
  };
})
class ColorBy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: defaultColorBy
    };
  }
  static propTypes = {
    colorBy: React.PropTypes.string.isRequired,
    geneLength: React.PropTypes.object,
    colorOptions: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillReceiveProps(nextProps) {
    const colorBy = nextProps.colorBy;
    if (colorBy) {
      const selected = (colorBy.slice(0, 2) !== "gt") ? colorBy : "gt";
      this.setState({"selected": selected});
    }
  }

  setColorBy(colorBy) {
    if (colorBy.slice(0, 2) !== "gt") {
      analyticsControlsEvent(`color-by-${colorBy}`);
      this.props.dispatch(changeColorBy(colorBy));
      modifyURLquery(this.context.router, {c: colorBy}, true);
      this.setState({"selected": colorBy});
    } else {
      // don't update colorBy yet, genotype still needs to be specified
      this.setState({"selected": "gt"});
    }
  }

  genotypeInput() {
    let value = "";
    if (this.props.colorBy) {
      if (this.props.colorBy.slice(0, 2) === "gt") {
        value = this.props.colorBy.slice(3);
      }
    }
    if (this.state.selected === "gt") {
      return (
        <input
          type="text"
          placeholder="Genome position"
          value={value}
          onChange={(e) => this.setGenotypeColorBy(e.target.value)}
        />
      );
    }
    return null;
  }

  setGenotypeColorBy(genotype) {
    if (parseGenotype("gt-" + genotype, this.props.geneLength)) {
      // We got a valid genotype, set query params and state
      analyticsControlsEvent("color-by-genotype");
      this.props.dispatch(changeColorBy("gt-" + genotype));
      modifyURLquery(this.context.router, {c: "gt-" + genotype}, true);
    }
    // else we don't have a valid genotype, don't update anything yet
    return null;
  }

  getStyles() {
    return {
      base: {
        marginBottom: 10
      }
    };
  }

  render() {
    const styles = this.getStyles();
    const colorOptions = Object.keys(this.props.colorOptions).map((cOpt, i) =>
      <option key={i} value={ cOpt }>
        { this.props.colorOptions[cOpt].menuItem.toLowerCase() }
      </option> );

    return (
      <div style={styles.base}>
        <select
          style={select}
          id="coloring"
          value={this.state.selected}
          onChange={(e) => { this.setColorBy(e.target.value); }}
        >
          {colorOptions}
        </select>
        <div>
          {this.genotypeInput()}
        </div>
      </div>
    );
  }
}

export default ColorBy;
