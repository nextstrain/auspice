import React from "react";
import Radium from "radium";
import { connect } from "react-redux";
import { TOGGLE_BRANCH_LABELS } from "../../actions/controls";
import {sans} from "../../globalStyles";

@connect()
@Radium
class ToggleBranchLabels extends React.Component {
  getStyles() {
    return {
      base: {
        marginBottom: 20,
        fontFamily: sans,
        marginTop: 10
      }
    };
  }
  handleCheckboxClick() {
    this.props.dispatch({type: TOGGLE_BRANCH_LABELS});
  }
  render() {
    const styles = this.getStyles();
    return (
      <label style={styles.base}>
        <input onChange={this.handleCheckboxClick.bind(this)} type="checkbox"/>
        <span> show branch labels</span>
      </label>
    );
  }
}

export default ToggleBranchLabels;
