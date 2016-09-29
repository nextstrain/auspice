import React from "react";
import Radium from "radium";
import queryString from "query-string";
import { defaultColorBy, genericDomain, colors } from "../../util/globals";
import { connect } from "react-redux";
import { CHANGE_COLORBY } from "../../actions/controls";
import * as scales from "../../util/colorScales";

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

  genericScale(cmin,cmax){
    const offset = +cmin;
    const range = cmax-cmin;
    const tmpColorScale = d3.scale.linear()
      .domain(genericDomain.map((d) => offset + d * range))
      .range(colors[10]);
    return tmpColorScale;
  }

  getColorScale(colorBy) {
    let colorScale;
    let continuous=false;
    if (colorBy === "ep") {
      colorScale = this.genericScale(0, 15);
      continuous = true;
    } else if (colorBy === "ne") {
      colorScale = this.genericScale(0, 25);
      continuous = true;
    } else if (colorBy === "rb") {
      colorScale = this.genericScale(0, 6);
      continuous = true;
    } else if (colorBy === "lbi") {
      colorScale = scales.lbiColorScale;
      // todo, discuss
      // adjust_coloring_by_date();
      continuous = true;
    } else if (colorBy === "dfreq") {
      colorScale = scales.dfreqColorScale;
      continuous = true;
    } else if (colorBy === "region") {
      colorScale = scales.regionColorScale;
    } else if (colorBy === "cHI") {
      colorScale = scales.cHIColorScale;
      continuous = true;
    } else if (colorBy === "num_date") {
      colorScale = this.genericScale(this.props.location.query.dmin, this.props.location.query.dmax);
      continuous = true;
    } else if (colorBy === "fitness") {
      colorScale = scales.fitnessColorScale;
      continuous = true;
    }
    return {"scale": colorScale, "continuous": continuous};
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
    console.log("setColorBy", url, this.props.location.pathname,prefix);
    window.history.pushState({}, "", url);
    this.props.changeRoute(this.props.location.pathname, newQuery);
    this.props.dispatch({ type: CHANGE_COLORBY, data: {"colorBy": colorBy, "colorScale": this.getColorScale(colorBy)}});
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
      console.log("setting default colorby", defaultColorBy);
      this.setColorBy(defaultColorBy);
      return null;
    }
    const styles = this.getStyles();
    console.log("colorBy", this.props);
    const colorOptions = Object.keys(this.props.colorOptions).map( (cOpt) =>
                              <option value={ cOpt } >
                                { this.props.colorOptions[cOpt].menuItem }
                              </option> );

    return (
      <div style={styles.base}>
        <span> Color by </span>
        <select id="coloring"
          onChange={(e) => {
            if (e.target.value === this.props.title) { return }
              this.setColorBy(e.target.value);
          }}>
          {colorOptions}
        </select>
      </div>
    );
  }
}

export default ColorBy;
