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
  createPath(e) {
    console.log('createPath:',this.props.choice_tree);
    let p = (this.props.choice_tree.length>0)?'/':'';
    p+=this.props.choice_tree.join('/') +'/'+ e.target.value;
    return p;
  }
  render() {
    const styles = this.getStyles();
    return (
      <select

        style={{marginRight: 20}}
        onChange={(e) => {
          if (e.target.value === this.props.title) { return }
          console.log('virus-select:',this.createPath(e), this.props.router);
          this.props.router.push({
            pathname:this.createPath(e)
          })
          console.log('virus-select2:',this.createPath(e), this.props.router);
          // Object.assign(this.props.router, {pathname:this.createPath(e)});
          console.log('virus-select3', this.props);
          // fire action to do async here
        }}>
        <option key={"titleOption"}> {this.props.title} </option>
        {
          this.props.options.map((option, i) => {
            return (
              /* ie., this.props.query[virus] === flu -- leave this fuzzy == for duration */
              <option key={i} selected={this.props.selected == option}>
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
