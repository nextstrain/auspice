import React from "react";
import Radium from "radium";
import queryString from "query-string";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";

// @connect(state => {
//   return state.FOO;
// })
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
    console.log("setColorBy", url, this.props.location.pathname,prefix);
    window.history.pushState({}, "", url);
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  getStyles() {
    return {
      base: {
        marginBottom: 20
      }
    };
  }
  render() {
    const styles = this.getStyles();
    console.log("colorBy", this.props);
    const colorOptions = Object.keys(this.props.colorOptions).map( (cOpt) =>
                              <option value={ cOpt }> { this.props.colorOptions[cOpt].menuItem } </option> );

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
