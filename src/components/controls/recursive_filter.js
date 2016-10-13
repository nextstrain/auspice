import React from "react";
import Radium from "radium";
import queryString from "query-string";
import { filterAbbrRev,filterAbbrFwd } from "../../util/globals";

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

  makeQueryString(filters, fields){
    let tmp_str = filters[0];
    for (let ii=0; ii<fields.length; ii+=1){
      if (ii && filters[ii]){
        tmp_str = tmp_str + "-" + fields[ii] + "." + filters[ii];
      }
    }
    return tmp_str;
  }

  setFilterQuery(filters, fields) {
    const newQuery = Object.assign({}, this.props.location.query,
                        {"filter":this.makeQueryString(filters, fields)});
    this.props.changeRoute(this.props.location.pathname, newQuery);
  }

  render() {
    // the selector below resets the path by router.push({pathname:new_path})
    // the currently selected option is passed down as this.props.selected
    // 9/19/2016: https://facebook.github.io/react/docs/forms.html#why-select-value
    return (
      <select
        style={{marginRight: 20}}
        value={this.props.selected}
        onChange={(e) => {
          if (e.target.value === this.props.title) {
            this.setFilterQuery(this.props.filterTree, this.props.fields);
          } else {
            this.setFilterQuery(this.props.filterTree.concat(e.target.value)
                                .map((d) => filterAbbrRev[d]||d),
                                this.props.fields);
          }
        }}
      >
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              <option key={i}
                      selected={(option === this.props.selected) ? "selected" : ""}
                      value={option}
              >
                {option + (this.props.counts[i] ? " (" + this.props.counts[i] + ")" : "")}
              </option>);
          })
        }
      </select>
    );
  }
}

export default RecursiveFilter;
