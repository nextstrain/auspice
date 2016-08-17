import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
// import { connect } from "react-redux";
// import { FOO } from "../actions";
import { withRouter } from 'react-router';

// @connect(state => {
//   return state.FOO;
// })
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
    style: React.PropTypes.object,
    // foo: React.PropTypes.string
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
  createQueryParams(e) {
    if (this.props.queryParamAccessor === "virus") {
      return {virus: e.target.value}
    } else {
      return Object.assign({}, this.props.query, {
        [this.props.queryParamAccessor]: e.target.value
      })
    }

    Object.assign({}, this.props.query, {
      [this.props.queryParamAccessor]: e.target.value // ie., strain: H3N2 virus: Zika
    })
  }
  render() {
    const styles = this.getStyles();
    return (
      <select
        style={{marginRight: 20}}
        onChange={(e) => {
          if (e.target.value === this.props.title) { return }
          this.props.router.push({
            pathname: this.props.pathname,
            query: this.createQueryParams(e)
          })
          // fire action to do async here
        }}>
        <option> {this.props.title} </option>
        {
          this.props.options.map((option) => {
            console.log("option", typeof this.props.query[this.props.queryParamAccessor], typeof option)
            return (
              /* ie., this.props.query[virus] === flu -- leave this fuzzy == for duration */
              <option selected={this.props.query[this.props.queryParamAccessor] == option}>
                {option}
              </option>
            )
          })
        }
      </select>
    );
  }
}

export default withRouter(ChooseVirusSelect);
