import React from "react";
import Radium from "radium";
import queryString from "query-string";
import {select} from "../../globalStyles";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";

// @connect(state => {
//   return state.FOO;
// })

/*
 * implements a selector that
 * (i) knows about the upstream choices and
 * (ii) resets the route upon change
 */
@Radium
class ChooseVirusSelect extends React.Component {
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
    style: React.PropTypes.object
  }
  static defaultProps = {
    // foo: "bar"
  }
  getStyles() {
    return {
      base: {

      }
    };
  }

  // assembles a new path from the upstream choices and the new selection
  // downstream choices will be set to defaults in parseParams
  createPath(e) {
    let p = (this.props.choice_tree.length > 0) ? "/" : "";
    p += this.props.choice_tree.join("/") + "/" + e.target.value;
    return p;
  }

  setVirusPath(newPath) {
    this.props.changeRoute(newPath, this.props.location.query);
  }

  render() {
    // the selector below resets the path by router.push({pathname:new_path})
    // the currently selected option is passed down as this.props.selected
    // 9/19/2016: https://facebook.github.io/react/docs/forms.html#why-select-value
    return (
      <select
        style={select}
        value={this.props.selected}
        onChange={(e) => {
          if (e.target.value === this.props.title) { return }
            this.setVirusPath(this.createPath(e));
        }}
      >
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              <option key={i}>
                {option}
              </option>);
          })
        }
      </select>
    );
  }
}

export default ChooseVirusSelect;
