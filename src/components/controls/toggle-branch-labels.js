import React from "react";
import Radium from "radium";
// import _ from "lodash";
// import Flex from "./framework/flex";
import { connect } from "react-redux";
import { toggleBranchLabels } from "../../actions/controls";


@connect()
@Radium
class ToggleBranchLabels extends React.Component {
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
  handleCheckboxClick() {
    this.props.dispatch(toggleBranchLabels());
  }
  render() {
    const styles = this.getStyles();
    return (
      <label>
        <input onChange={this.handleCheckboxClick.bind(this)} type="checkbox"/>
        branch labels
      </label>
    );
  }
}

export default ToggleBranchLabels;
