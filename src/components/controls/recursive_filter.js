import React from "react";
import Radium from "radium";
import queryString from "query-string";
import { filterAbbrRev } from "../../util/globals";

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
class RecursiveFilter extends React.Component {
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

  setFilterQuery(filters) {
    console.log("setFilterQuery", filters);
    const newQuery = Object.assign({}, this.props.location.query,
                        {"filter":filters.filter((d) => ((typeof d !== "undefined") && d.length)).join("-")});
    console.log(newQuery, this.props.location.pathname);
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  render() {
    // the selector below resets the path by router.push({pathname:new_path})
    // the currently selected option is passed down as this.props.selected
    // 9/19/2016: https://facebook.github.io/react/docs/forms.html#why-select-value
    console.log(this.props.filterTree, this.props.options);
    return (
      <select
        style={{marginRight: 20}}
        value={this.props.selected}
        onChange={(e) => {
          if (e.target.value === this.props.title) {
            this.setFilterQuery(this.props.filterTree);
          } else {
            this.setFilterQuery(this.props.filterTree.concat([filterAbbrRev[e.target.value]||e.target.value]));
          }
        }}
      >
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              <option key={i} selected={(option === this.props.selected) ? "selected" : ""}>
                {option}
              </option>);
          })
        }
      </select>
    );
  }
}

export default RecursiveFilter;
