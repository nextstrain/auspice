import React from "react";
import Radium from "radium";
import queryString from "query-string";
import { defaultColorBy, genericDomain, colors } from "../../util/globals";
import { connect } from "react-redux";
import * as scales from "../../util/colorScales";
import genotypeInput from "./genotypeInput";

// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";

@connect()
@Radium
class ColorBy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

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

  setColorBy(colorBy) {
    const tmp_path = this.props.location.pathname
    const prefix = (tmp_path === "" || tmp_path[0] === "/") ? "" : "/";
    const suffix = (tmp_path.length && tmp_path[tmp_path.length - 1] !== "/") ? "/?" : "?";

    const newQuery = Object.assign({}, this.props.location.query,
                                   {colorBy: colorBy});
    // https://www.npmjs.com/package/query-string
    const url = (prefix + this.props.location.pathname
                 + suffix + queryString.stringify(newQuery));
    window.history.pushState({}, "", url);
    this.props.changeRoute(this.props.location.pathname, newQuery);
    // this.props.dispatch({ type: CHANGE_COLORBY,
      // data: {"colorBy": colorBy}
    // });
  }

  setGenotypeColorBy(genotype) {
    //this.setColorBy("gt:" + genotype);
    this.setColorBy("gt:HA1_159");
  }

  extraInput(colorBy) {
    if (colorBy === "gt") {
      console.log("extraInput");
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
    }
    const currentColorBy = this.props.location.query.colorBy;
    const styles = this.getStyles();
    const colorOptions = Object.keys(this.props.colorOptions).map( (cOpt) =>
                              <option value={ cOpt } selected={cOpt === currentColorBy ? "selected" : null}>
                                { this.props.colorOptions[cOpt].menuItem }
                              </option> );

    return (
      <div style={styles.base}>
        <span> Color by </span>
        <select id="coloring"
          onChange={(e) => {
            if (e.target.value !== this.props.title) {this.setColorBy(e.target.value);}
          }}
        >
          {colorOptions}
        </select>
        <div>
        {this.extraInput(currentColorBy)}
        </div>
      </div>
    );
  }
}

export default ColorBy;
