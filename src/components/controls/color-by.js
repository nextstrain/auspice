import React from "react";
import { defaultColorBy } from "../../util/globals";
import { parseGenotype } from "../../util/getGenotype";
import { select} from "../../globalStyles";
import SelectLabel from "../framework/select-label";
import { connect } from "react-redux";
import { changeColorBy } from "../../actions/controls";

/* Why does this have colorBy set as state (here) and in redux?
   it's for the case where we select genotype, then wait for the
   base to be selected, so we modify state but not yet dispatch
*/

@connect((state) => {
  return {
    colorBy: state.controls.colorBy,
    geneLength: state.sequences.geneLength
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
    /* react */
    dispatch: React.PropTypes.func,
    router: React.PropTypes.object,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  componentWillReceiveProps(nextProps) {
    const colorBy = nextProps.colorBy;
    if (colorBy) {
      const selected = (colorBy.slice(0,2) !== "gt") ? colorBy : "gt";
      this.setState({"selected": selected});
    }
  }

  setColorBy(colorBy) {
    if (colorBy.slice(0,2) !== "gt") {
      this.props.dispatch(changeColorBy(colorBy, this.context.router))
      this.setState({"selected": colorBy});
    } else {
      // don't update colorBy yet, genotype still needs to be specified
      this.setState({"selected": "gt"});
    }
  }

  genotypeInput() {
    let placeholder = "Genome position";
    if (this.props.colorBy) {
      if (this.props.colorBy.slice(0,2) === "gt") {
        placeholder = this.props.colorBy.slice(3);
      }
    }
    if (this.state.selected === "gt") {
      return (
        <input type="text" placeholder={placeholder}
               onChange={(e) => this.setGenotypeColorBy(e.target.value)}
        />
      );
    } else {
      return null;
    }
  }

  setGenotypeColorBy(genotype) {
    if (parseGenotype("gt-" + genotype, this.props.geneLength)) {
      // We got a valid genotype, set query params and state
      this.props.dispatch(changeColorBy("gt-" + genotype, this.context.router))
    } else {
      // we don't have a valid genotype, don't update anything yet
      return null;
    }
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
      <option key={i} value={ cOpt } selected={cOpt === this.state.selected ? true : false}>
        { this.props.colorOptions[cOpt].menuItem }
      </option> );

    return (
      <div style={styles.base}>
        <SelectLabel text="Color by"/>
        <select style={select} id="coloring"
          onChange={(e) => { this.setColorBy(e.target.value); }}>
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
