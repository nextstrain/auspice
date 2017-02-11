import React from "react";
import Radium from "radium";
import { TOGGLE_BRANCH_LABELS } from "../../actions/types";
import {dataFont, darkGrey} from "../../globalStyles";

@Radium
class ToggleBranchLabels extends React.Component {
  getStyles() {
    return {
      base: {
        marginBottom: 20,
        fontFamily: dataFont,
        marginTop: 10,
        color: darkGrey,
        fontSize: 14
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
