import React from "react";
import Radium from "radium";
import queryString from "query-string";
import { connect } from "react-redux";

// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";

//@connect()
//@Radium
class genotypeInput extends React.Component {
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

  getStyles() {
    return {
      base: {
        marginBottom: 20
      }
    };
  }
  render() {
    console.log("genotypeInput", this.props);
    return (
      <div>
      GENOTYPE
      <input type="text" placeholder="HA1 position"/>
      </div>
    );
  }
}

export default genotypeInput;
