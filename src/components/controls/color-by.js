import React from "react";
import Radium from "radium";
import { defaultColorBy, genericDomain, colors } from "../../util/globals";
import { connect } from "react-redux";
import * as scales from "../../util/colorScales";
import { parseGenotype } from "../../util/getGenotype";

// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";

const returnStateNeeded = (fullStateTree) => {
  return {
    geneLength: fullStateTree.sequences.geneLength
  };
};

@connect(returnStateNeeded)
@Radium
class ColorBy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: "region",
      colorBy: "region"
    };
  }
  static propTypes = {
    /* react */
    // dispatch: React.PropTypes.func,
    params: React.PropTypes.object,
    routes: React.PropTypes.array,
    /* component api */
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
  }
  static defaultProps = {
    // foo: "bar"
  }

  componentWillMount() {
    const currentColorBy = this.props.location.query.colorBy;
    if (currentColorBy){
      this.setState({selected:currentColorBy});
    }
  }

  setColorBy(colorBy) {
    if (colorBy.slice(0,2) !== "gt") {
      this.setColorByQuery(colorBy);
      this.setState({"selected":colorBy, "colorBy":colorBy});
    } else {
      // don't update colorby yet, genotype still needs to be specified
      this.setState({"selected":"gt"});
    }
  }

  setColorByQuery(colorBy) {
    const newQuery = Object.assign({}, this.props.location.query,
                                   {colorBy: colorBy});
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  setGenotypeColorBy(genotype) {
    if (parseGenotype("gt-" + genotype, this.props.geneLength)) {
      // We got a valid genotype, set query params and state
      this.setColorByQuery("gt-" + genotype);
      this.setState({"selected":"gt", "colorBy":"gt-" + genotype});
    } else {
      // we don't have a valid genotype, don't update anything yet
      return null;
    }
  }

  genotypeInput() {
    if (this.state.selected === "gt") {
      return (
        <input type="text" placeholder="HA1 position"
               onChange={(e) => this.setGenotypeColorBy(e.target.value)}
        />
      );
    } else {
      return null;
    }
  }

  getStyles() {
    return {
      base: {
        marginBottom: 20
      }
    };
  }
  render() {
    if (!this.props.location.query.colorBy) {
      this.setColorBy(defaultColorBy);
      return null;
    } else if (this.props.location.query.colorBy.slice(0,3) === "gt-" && this.state.selected !== "gt") {
      this.setColorBy(this.props.location.query.colorBy);
      return null;
    }
    const styles = this.getStyles();
    const colorOptions = Object.keys(this.props.colorOptions).map( (cOpt) =>
                              <option value={ cOpt } selected={cOpt === this.state.selected ? true : false}>
                                { this.props.colorOptions[cOpt].menuItem }
                              </option> );

    return (
      <div style={styles.base}>
        <span> Color by </span>
        <select id="coloring"
          onChange={(e) => {this.setColorBy(e.target.value);}}
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
